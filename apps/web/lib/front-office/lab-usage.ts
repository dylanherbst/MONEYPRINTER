// Lab usage and the daily spend cap for "Live AI Test" (task A-23). Server only.
//
// Everything here is an ESTIMATE. Costs are worked out from the token counts the provider reports and a fixed price
// table below; they are not read from a bill. The owner's real spend is whatever the Anthropic console says.
//
// The cap: FRONT_OFFICE_LAB_DAILY_CAP_AUD (Australian dollars per local day, Australia/Perth). Missing, not a number or
// negative means the default, A$5. Nothing the browser sends can change it; it is only ever read from server env.
// Every model call first RESERVES its worst-case cost (estimated input plus the max_tokens output bound); the call is
// refused, and never made, when the reservation would take the day over the cap. After the call the reservation is
// replaced by the estimate from the reported usage. Overshoot is limited to the input-size estimate error of one call.
//
// Persistence: the default store is in-process memory. It resets when the server restarts and is not shared between
// server instances, so on a multi-instance deploy each instance has its own cap. A persistent store (Supabase) is task
// A-25; it implements the same LabUsageStore interface.
import type { LlmRequest, LlmUsage } from './llm';

export const LAB_TIME_ZONE = 'Australia/Perth';
export const DEFAULT_LAB_DAILY_CAP_AUD = 5;
/** Output bound for every lab model call (sent as max_tokens), so the worst case per call is known before it is made. */
export const LAB_MAX_OUTPUT_TOKENS = 500;

/** USD to AUD, a fixed planning rate (about US$0.645 per A$1, rounded up so the AUD estimate errs high). Not a live
 * exchange rate; review it when the price table is reviewed. */
export const USD_TO_AUD = 1.55;

export type ModelPrice = { inputUsdPerMTok: number; outputUsdPerMTok: number };
/** List prices in US dollars per million tokens, by model id prefix, first match wins. Estimate only: check them against
 * Anthropic's pricing page when a new model is used. */
export const MODEL_PRICES: { match: RegExp; label: string; price: ModelPrice }[] = [
  { match: /^claude-opus-4-[5-9]/, label: 'Claude Opus 4.5+', price: { inputUsdPerMTok: 5, outputUsdPerMTok: 25 } },
  { match: /^claude-opus-4/, label: 'Claude Opus 4 / 4.1', price: { inputUsdPerMTok: 15, outputUsdPerMTok: 75 } },
  { match: /^claude-sonnet-4/, label: 'Claude Sonnet 4.x', price: { inputUsdPerMTok: 3, outputUsdPerMTok: 15 } },
  { match: /^claude-3-7-sonnet/, label: 'Claude Sonnet 3.7', price: { inputUsdPerMTok: 3, outputUsdPerMTok: 15 } },
  { match: /^claude-haiku-4/, label: 'Claude Haiku 4.x', price: { inputUsdPerMTok: 1, outputUsdPerMTok: 5 } },
  { match: /^claude-3-5-haiku/, label: 'Claude Haiku 3.5', price: { inputUsdPerMTok: 0.8, outputUsdPerMTok: 4 } },
];
/** Unknown model: priced at the highest rate in the table, and flagged, so the estimate and the cap err high. */
export const UNKNOWN_MODEL_PRICE: ModelPrice = { inputUsdPerMTok: 15, outputUsdPerMTok: 75 };

export function priceFor(model: string): { price: ModelPrice; known: boolean; label: string } {
  const hit = MODEL_PRICES.find(p => p.match.test(model.trim()));
  return hit ? { price: hit.price, known: true, label: hit.label } : { price: UNKNOWN_MODEL_PRICE, known: false, label: 'Unknown model: priced at the highest rate' };
}

/** Keeps sums free of float noise without losing sub-cent precision (display rounding is the UI's job). */
const round = (n: number) => Math.round(n * 1e9) / 1e9;

export function estimateCostAud(model: string, usage: LlmUsage): { aud: number; usd: number; priceKnown: boolean } {
  const { price, known } = priceFor(model);
  const usd = (usage.inputTokens * price.inputUsdPerMTok + usage.outputTokens * price.outputUsdPerMTok) / 1_000_000;
  return { usd: round(usd), aud: round(usd * USD_TO_AUD), priceKnown: known };
}

/** A high guess at the input tokens of a request: about 3 characters per token (real text is nearer 4) plus a fixed
 * allowance for the provider's tool-use overhead. */
export function estimateInputTokens(req: Pick<LlmRequest, 'system' | 'messages' | 'tools'>): number {
  return Math.ceil(JSON.stringify({ s: req.system, m: req.messages, t: req.tools }).length / 3) + 1000;
}

/** The most one call can cost, before it is made. */
export function worstCaseCallAud(model: string, req: Pick<LlmRequest, 'system' | 'messages' | 'tools'>, maxOutputTokens = LAB_MAX_OUTPUT_TOKENS): number {
  return estimateCostAud(model, { inputTokens: estimateInputTokens(req), outputTokens: maxOutputTokens }).aud;
}

/** The daily cap from server env only. Invalid or negative falls back to the default; 0 switches live tests off. */
export function labDailyCapAud(env: Record<string, string | undefined> = process.env): number {
  const raw = env.FRONT_OFFICE_LAB_DAILY_CAP_AUD?.trim();
  if (!raw) return DEFAULT_LAB_DAILY_CAP_AUD;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_LAB_DAILY_CAP_AUD;
}

/** The local day (YYYY-MM-DD in Australia/Perth) a timestamp falls on. */
export function labDay(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: LAB_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}

export interface LabUsageStore {
  /** Atomically adds `aud` to the day when spent plus `aud` stays within `capAud`; false (nothing added) otherwise. */
  reserve(day: string, aud: number, capAud: number): Promise<boolean>;
  /** Swaps a reservation for the actual estimated cost. */
  settle(day: string, reservedAud: number, actualAud: number): Promise<void>;
  /** Spent (including open reservations) on the day. */
  spent(day: string): Promise<number>;
  /** True when the store survives restarts and is shared between instances. */
  readonly persistent: boolean;
}

/** In-process store. reserve() checks and adds in one synchronous step, so concurrent turns in one process cannot both
 * pass the cap. Keeps the last few days only. */
export function createMemoryLabUsageStore(): LabUsageStore & { days: Map<string, number> } {
  const days = new Map<string, number>();
  const prune = () => { const keys = [...days.keys()].sort(); while (keys.length > 7) days.delete(keys.shift()!); };
  return {
    days, persistent: false,
    async reserve(day, aud, capAud) {
      const now = days.get(day) ?? 0;
      if (!(aud >= 0) || now + aud > capAud) return false;
      days.set(day, round(now + aud)); prune();
      return true;
    },
    async settle(day, reservedAud, actualAud) {
      days.set(day, Math.max(0, round((days.get(day) ?? 0) - reservedAud + Math.max(0, actualAud))));
    },
    async spent(day) { return days.get(day) ?? 0; },
  };
}

/** The process-wide default store (see the persistence note at the top). */
export const defaultLabUsageStore = createMemoryLabUsageStore();

export type LabUsageToday = {
  day: string; timeZone: typeof LAB_TIME_ZONE; spentAud: number; capAud: number; remainingAud: number;
  estimate: true; persistent: boolean; note: string;
};

export async function labUsageToday(deps: { env?: Record<string, string | undefined>; clock?: () => number; usage?: LabUsageStore } = {}): Promise<LabUsageToday> {
  const store = deps.usage ?? defaultLabUsageStore;
  const day = labDay((deps.clock ?? Date.now)());
  const capAud = labDailyCapAud(deps.env ?? process.env);
  const spentAud = round(await store.spent(day));
  return {
    day, timeZone: LAB_TIME_ZONE, spentAud, capAud, remainingAud: Math.max(0, round(capAud - spentAud)), estimate: true, persistent: store.persistent,
    note: `Estimated from reported tokens and a fixed price table (US$1 = A$${USD_TO_AUD}). ${store.persistent ? '' : 'Counted in server memory only: resets on restart (persistent store is task A-25).'}`.trim(),
  };
}

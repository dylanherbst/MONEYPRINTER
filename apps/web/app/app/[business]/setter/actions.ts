'use server';
// AI Setter test lab actions. Everything runs on the per-business SANDBOX: simulated Instagram, fake sender, nothing leaves the server.
import { availability, checkBusiness } from '../../../start/_server/runtime';
import { resetSandbox, sandbox } from '../../../start/_server/setter-runtime';
import { setterMetrics, type AgentConfig, type Offer, type KnowledgeItem } from '../../../../lib/aimp/setter/index';
import type { SetterView } from './view';

function sb(business: string) {
  if (!availability().available || !checkBusiness(business)) return null;
  return sandbox(business);
}

export async function loadSetterAction(business: string): Promise<SetterView | null> {
  const s = sb(business);
  return s ? view(s) : null;
}

function view(s: NonNullable<ReturnType<typeof sb>>): SetterView {
  const ws = s.ws;
  return {
    config: s.store.config(ws)!,
    agentName: s.agentName,
    killSwitch: s.store.killSwitch(ws),
    conversations: s.store.conversations(ws).map((c) => ({ ...c, lead: s.store.lead(ws, c.id), messages: s.store.messages(ws, c.id).map((m) => ({ id: m.id, direction: m.direction, author: m.author, text: m.text, status: m.status, error: m.error, notes: m.policyNotes ?? [], intent: m.decision?.intent ?? null, confidence: m.decision?.confidence ?? null })) })),
    metrics: setterMetrics(s.store, ws),
    audit: s.store.audits(ws).slice(-15).reverse(),
  };
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const https = (v: unknown) => { const u = str(v, 500); try { return u && new URL(u).protocol === 'https:' ? u : ''; } catch { return ''; } };

export async function saveConfigAction(business: string, raw: unknown): Promise<{ ok: boolean; message: string; view: SetterView | null }> {
  const s = sb(business);
  if (!s) return { ok: false, message: 'Not available here.', view: null };
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const cur = s.store.config(s.ws)!;
  const offers: Offer[] = (Array.isArray(o.offers) ? o.offers : []).slice(0, 10).map((x, i) => {
    const r = (x ?? {}) as Record<string, unknown>;
    return { id: `offer-${i + 1}`, name: str(r.name, 80), description: str(r.description, 300), priceMinor: Math.round(Number(r.price) * 100), currency: 'AUD', ctaUrl: https(r.ctaUrl), ctaKind: 'checkout' as const };
  }).filter((x) => x.name && Number.isInteger(x.priceMinor) && x.priceMinor > 0 && x.ctaUrl);
  const knowledge: KnowledgeItem[] = (Array.isArray(o.knowledge) ? o.knowledge : []).slice(0, 30).map((x, i) => {
    const r = (x ?? {}) as Record<string, unknown>;
    return { id: `faq-${i + 1}`, question: str(r.question, 200), answer: str(r.answer, 600) };
  }).filter((k) => k.question && k.answer);
  const mode = o.mode === 'auto' || o.mode === 'off' ? o.mode : 'draft_only';
  if (mode === 'auto' && o.confirmAuto !== true) return { ok: false, message: 'Tick the box to confirm automatic replies.', view: view(s) };
  const next: AgentConfig = {
    ...cur, mode, paused: o.paused === true, discloseAi: o.discloseAi === true, businessName: str(o.businessName, 80), idealCustomer: str(o.idealCustomer, 200), brandVoice: str(o.brandVoice, 120) || cur.brandVoice,
    qualifyingQuestion: str(o.qualifyingQuestion, 200), refundPolicy: str(o.refundPolicy, 400), bookingUrl: https(o.bookingUrl), offers, knowledge,
    prohibitedClaims: str(o.prohibitedClaims, 600).split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 20), updatedAt: new Date().toISOString(),
  };
  s.store.saveConfig(next);
  return { ok: true, message: 'Saved.', view: view(s) };
}

export async function simulateAction(business: string, text: unknown, person: unknown): Promise<{ result: string; view: SetterView | null }> {
  const s = sb(business);
  const t = str(text, 1000);
  if (!s || !t) return { result: 'Type a message first.', view: s ? view(s) : null };
  const who = person === 'b' ? '900000000000002' : '900000000000001';
  const r = await s.inbound(t, who);
  return { result: r.results.join(', '), view: view(s) };
}

export async function inboxAction(business: string, op: unknown): Promise<{ ok: boolean; message: string; view: SetterView | null }> {
  const s = sb(business);
  if (!s) return { ok: false, message: 'Not available here.', view: null };
  const o = (typeof op === 'object' && op !== null ? op : {}) as Record<string, unknown>;
  const id = str(o.id, 100);
  let ok = false;
  let message: string;
  if (o.kind === 'approve') { const r = await s.setter.approve(s.ws, id, typeof o.text === 'string' ? o.text : undefined); ok = r.ok; message = r.ok ? 'Sent (simulated).' : `Not sent: ${r.reason}`; }
  else if (o.kind === 'reject') { ok = s.setter.reject(s.ws, id).ok; message = ok ? 'Draft discarded.' : 'Not a draft.'; }
  else if (o.kind === 'takeover' || o.kind === 'release') { ok = s.setter.takeover(s.ws, id, o.kind === 'takeover').ok; message = ok ? (o.kind === 'takeover' ? 'You have taken over. The AI will not reply here.' : 'The AI can reply here again.') : 'Not found.'; }
  else if (o.kind === 'reply') { const r = await s.setter.humanReply(s.ws, id, str(o.text, 1000)); ok = r.ok; message = r.ok ? 'Sent (simulated).' : `Not sent: ${r.reason}`; }
  else if (o.kind === 'reset') { const f = resetSandbox(business); ok = !!f; return { ok, message: ok ? 'Test messages cleared. Your setup is kept.' : 'Could not reset.', view: f ? view(f) : null }; }
  else if (o.kind === 'kill') { s.store.setKillSwitch(s.ws, o.on === true); ok = true; message = o.on === true ? 'All sending stopped.' : 'Sending allowed again.'; }
  else message = 'Unknown action.';
  return { ok, message, view: view(s) };
}

// The model is a replaceable decision component. It gets only this tenant's verified facts and must answer in the structured schema.
// `ruleAgent` is a deterministic fallback used by the simulator, by tests, and when no AI key is set.
import type { AgentConfig, AgentDecision, DmMessage } from './types.ts';

export interface AgentInput { config: AgentConfig; history: Pick<DmMessage, 'direction' | 'text'>[]; latest: string }
export interface SetterAgent { name: string; decide(i: AgentInput): Promise<unknown> }

export const PROMPT_VERSION = 'setter-2026-11-22.1';

export function buildPrompt(i: AgentInput): { system: string; prompt: string } {
  const c = i.config;
  const facts = [
    ...c.offers.map((o) => `[${o.id}] OFFER ${o.name}: ${o.description} Price ${(o.priceMinor / 100).toFixed(2)} ${o.currency}. Link: ${o.ctaUrl}`),
    ...c.knowledge.map((k) => `[${k.id}] Q: ${k.question} A: ${k.answer}`),
    c.refundPolicy ? `[refund] Refund policy: ${c.refundPolicy}` : '',
    c.bookingUrl ? `[booking] Booking link: ${c.bookingUrl}` : '',
  ].filter(Boolean).join('\n');
  const system = [
    `You are the Instagram DM assistant for ${c.businessName}. Voice: ${c.brandVoice || 'friendly, short, natural'}.`,
    'Use ONLY the facts below. If a fact is missing, say you will check and set recommended_action to "handoff".',
    'Answer the question first. Ask at most one qualifying question. Never pressure, never invent prices, refunds, results or guarantees.',
    `Ideal customer: ${c.idealCustomer}. Qualifying question you may ask: ${c.qualifyingQuestion}.`,
    'Only offer a link that matches what the person asked about. Never ask for card details.',
    'Never claim to be a human. If asked whether you are a bot or a person, set recommended_action to "handoff".',
    'Reply ONLY with JSON: {"intent","lead_stage","response_text","confidence","knowledge_source_ids","recommended_action","handoff_reason","cta_id"}.',
    'intent/lead_stage one of: interested, needs_more_information, not_a_fit, booking_ready, purchase_ready, complaint, human_requested, opt_out.',
    'recommended_action one of: reply, handoff, ignore. knowledge_source_ids: the [ids] you used. cta_id: an offer id, "booking", or null.',
    `FACTS:\n${facts}`,
  ].join('\n');
  const prompt = [...i.history.slice(-10).map((m) => `${m.direction === 'in' ? 'Person' : 'Business'}: ${m.text}`), `Person: ${i.latest}`].join('\n');
  return { system, prompt };
}

/** Uses any text model behind the existing provider registry interface. */
export function llmAgent(llm: { generate(i: { prompt: string; system?: string }): Promise<{ text: string }> }, name = 'llm'): SetterAgent {
  return { name, async decide(i) { const p = buildPrompt(i); return (await llm.generate(p)).text; } };
}

const words = (s: string): Set<string> => new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? []);
const overlap = (a: string, b: string): number => { const x = words(a); let n = 0; for (const w of words(b)) if (w.length > 3 && x.has(w)) n++; return n; };

export const ruleAgent: SetterAgent = {
  name: 'rules',
  async decide({ config: c, latest }): Promise<AgentDecision> {
    const t = latest.toLowerCase();
    const base = { knowledge_source_ids: [] as string[], handoff_reason: null as string | null, cta_id: null as string | null };
    if (/\b(refund|scam|complain|angry|terrible|chargeback)\b/.test(t)) return { ...base, intent: 'complaint', lead_stage: 'complaint', response_text: '', confidence: 0.9, recommended_action: 'handoff', handoff_reason: 'complaint or refund' };
    if (/\b(not interested|no thanks|too expensive|can'?t afford)\b/.test(t)) return { ...base, intent: 'not_a_fit', lead_stage: 'not_a_fit', response_text: 'No worries at all, thanks for letting me know. Happy to help if anything changes.', confidence: 0.8, recommended_action: 'reply' };
    const offer = c.offers.map((o) => ({ o, s: overlap(t, `${o.name} ${o.description}`) })).sort((a, b) => b.s - a.s)[0];
    if (/\b(book|call|appointment|chat)\b/.test(t) && c.bookingUrl) return { ...base, intent: 'booking_ready', lead_stage: 'booking_ready', response_text: `Great, you can pick a time here: ${c.bookingUrl}`, confidence: 0.8, recommended_action: 'reply', cta_id: 'booking', knowledge_source_ids: ['booking'] };
    if (/\b(buy|price|cost|how much|link|sign up|purchase)\b/.test(t) && offer) {
      const o = offer.o;
      return { ...base, intent: 'purchase_ready', lead_stage: 'purchase_ready', response_text: `${o.name} is $${(o.priceMinor / 100).toFixed(o.priceMinor % 100 ? 2 : 0)} ${o.currency}. ${o.description} You can get it here: ${o.ctaUrl}`, confidence: 0.75, recommended_action: 'reply', cta_id: o.id, knowledge_source_ids: [o.id] };
    }
    const faq = c.knowledge.map((k) => ({ k, s: overlap(t, k.question) })).sort((a, b) => b.s - a.s)[0];
    if (faq && faq.s > 0) return { ...base, intent: 'needs_more_information', lead_stage: 'needs_more_information', response_text: faq.k.answer, confidence: 0.7, recommended_action: 'reply', knowledge_source_ids: [faq.k.id] };
    if (c.qualifyingQuestion) return { ...base, intent: 'interested', lead_stage: 'interested', response_text: `Thanks for reaching out! ${c.qualifyingQuestion}`, confidence: 0.6, recommended_action: 'reply' };
    return { ...base, intent: 'needs_more_information', lead_stage: 'needs_more_information', response_text: '', confidence: 0.2, recommended_action: 'handoff', handoff_reason: 'no matching fact' };
  },
};

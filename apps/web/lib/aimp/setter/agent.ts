// The model is a replaceable decision component. It gets only this tenant's verified facts and must answer in the structured schema.
// `ruleAgent` is a deterministic fallback used by the simulator, by tests, and when no AI key is set.
import type { AgentConfig, AgentDecision, DmMessage } from './types.ts';

export interface AgentInput { config: AgentConfig; history: Pick<DmMessage, 'direction' | 'text'>[]; latest: string; conversationId?: string }
export interface SetterAgent {
  name: string;
  /** True when each decision costs money (a real model): the pipeline then needs a credit before calling it and spends one after. */
  metered?: boolean;
  decide(i: AgentInput): Promise<unknown>;
}

export const PROMPT_VERSION = 'setter-2026-11-22.1';

export function buildPrompt(i: AgentInput): { system: string; prompt: string } {
  const c = i.config;
  const facts = [
    ...c.offers.map((o) => `[${o.id}] PRODUCT ${o.name}: ${o.description} Price $${(o.priceMinor / 100).toFixed(o.priceMinor % 100 ? 2 : 0)} ${o.currency}. Checkout link: ${o.ctaUrl}`),
    ...c.knowledge.map((k) => `[${k.id}] Q: ${k.question}\n    A: ${k.answer}`),
    c.refundPolicy ? `[refund] Refund policy: ${c.refundPolicy}` : '',
    c.bookingUrl ? `[booking] Booking link: ${c.bookingUrl}` : '',
  ].filter(Boolean).join('\n');
  const system = `You reply to Instagram DMs for ${c.businessName}, a small online store. You are its sales and support assistant, writing as the store.

WHO WE HELP: ${c.idealCustomer || 'our customers'}
VOICE: ${c.brandVoice || 'warm, casual, short'}. Write like the owner texting from their phone: 1 to 3 short sentences, contractions, no lists, no sign-offs, at most one exclamation mark. Mirror the person's tone. Never use phrases like "Thank you for reaching out", "I hope this helps" or "As an AI".

HOW TO SELL WELL
- Read the whole conversation first. Never ask something the person already answered, and never repeat your last message.
- Answer their actual question first, using ONLY the facts below.
- Ask at most one question per reply. A useful one is: "${c.qualifyingQuestion}". Ask it once at most in the whole conversation.
- Price or budget worries ("pricey", "not sure it fits my budget", "cheaper elsewhere"): acknowledge it kindly, then point to the real value and safety nets in the facts (free shipping, returns, warranty, what's included). No pressure, no discounts unless a fact offers one, no fake urgency.
- When they show buying intent, give the matching checkout link from the facts. Only give a link that matches what they asked about. If they decline, respect it and do not pitch again.
- Never invent prices, discounts, delivery dates, stock levels, results, health or sleep benefits, or guarantees. If the facts don't cover it, say you'll check and set recommended_action to "handoff".
- Order problems, complaints, refunds in progress, or anything legal/medical/financial: set recommended_action to "handoff".
- Never ask for card details.
- Never claim to be a human. If asked whether you are a bot or a real person, say honestly that you're the store's automated assistant and offer to get someone from the team.

FACTS (cite the [ids] you use):
${facts}

OUTPUT: reply with ONLY one JSON object, no other text:
{"intent": "...", "lead_stage": "...", "response_text": "...", "confidence": 0.0-1.0, "knowledge_source_ids": ["..."], "recommended_action": "reply" | "handoff" | "ignore", "handoff_reason": null or "...", "cta_id": null or a product id or "booking"}
intent and lead_stage are each one of: interested, needs_more_information, not_a_fit, booking_ready, purchase_ready, complaint, human_requested, opt_out.`;
  const prompt = [...i.history.slice(-10).map((m) => `${m.direction === 'in' ? 'Person' : 'Store'}: ${m.text}`), `Person: ${i.latest}`].join('\n');
  return { system, prompt };
}

/** Uses any text model behind the existing provider registry interface. */
export function llmAgent(llm: { generate(i: { prompt: string; system?: string }): Promise<{ text: string }> }, name = 'llm'): SetterAgent {
  return { name, async decide(i) { const p = buildPrompt(i); return (await llm.generate(p)).text; } };
}

const pick = (seed: string, options: string[]): string => { let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return options[h % options.length]!; };
const lcFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);
const price = (minor: number): string => `$${(minor / 100).toFixed(minor % 100 ? 2 : 0)}`;
const words = (s: string): Set<string> => new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? []);
const overlap = (a: string, b: string): number => { const x = words(a); let n = 0; for (const w of words(b)) if (w.length > 3 && x.has(w)) n++; return n; };

export const ruleAgent: SetterAgent = {
  name: 'rules',
  async decide({ config: c, latest, history }): Promise<AgentDecision> {
    const t = latest.toLowerCase();
    const alreadyAsked = !!c.qualifyingQuestion && history.some((m) => m.direction === 'out' && m.text.includes(c.qualifyingQuestion));
    const base = { knowledge_source_ids: [] as string[], handoff_reason: null as string | null, cta_id: null as string | null };
    if (/\b(scam|complain|angry|terrible|chargeback|never arrived|still waiting|where is my order)\b/.test(t)) return { ...base, intent: 'complaint', lead_stage: 'complaint', response_text: '', confidence: 0.9, recommended_action: 'handoff', handoff_reason: 'complaint or order problem' };
    const faq = c.knowledge.map((k) => ({ k, s: overlap(t, k.question) })).sort((a, b) => b.s - a.s)[0];
    const offer = c.offers.map((o) => ({ o, s: overlap(t, `${o.name} ${o.description}`) })).sort((a, b) => b.s - a.s)[0];
    const wantsBuy = /\b(buy|price|cost|how much|link|order|purchase|get one|i'?ll take)\b/.test(t);
    // A price objection is answered with the prepared comparison, not treated as a "no".
    const compare = c.knowledge.find((k) => k.id === 'faq-compare');
    if (/\b(expensive|pricey|cheaper|budget|afford|kmart|amazon|temu|worth it)\b/.test(t) && !/\bhow much\b/.test(t) && compare) return { ...base, intent: 'needs_more_information', lead_stage: 'needs_more_information', response_text: compare.answer, confidence: 0.75, recommended_action: 'reply', knowledge_source_ids: [compare.id] };
    if (/\b(not interested|no thanks|nah|maybe later)\b/.test(t)) return { ...base, intent: 'not_a_fit', lead_stage: 'not_a_fit', response_text: pick(t, ['All good, no pressure at all. Shout if anything changes.', 'Totally fair. If you ever want it down the track, just message me here.']), confidence: 0.8, recommended_action: 'reply' };
    if (/\b(book|call|appointment)\b/.test(t) && c.bookingUrl) return { ...base, intent: 'booking_ready', lead_stage: 'booking_ready', response_text: pick(t, [`Yep! Easiest is to grab a time that suits you here: ${c.bookingUrl}`, `For sure, you can pick a time here: ${c.bookingUrl}`]), confidence: 0.8, recommended_action: 'reply', cta_id: 'booking', knowledge_source_ids: ['booking'] };
    // A clear product question (2+ matching words) is answered before any pitch.
    if (faq && faq.s >= 2 && !(wantsBuy && (offer?.s ?? 0) >= faq.s)) return { ...base, intent: 'needs_more_information', lead_stage: 'needs_more_information', response_text: faq.k.answer, confidence: 0.75, recommended_action: 'reply', knowledge_source_ids: [faq.k.id] };
    if (wantsBuy && offer) {
      const o = /\b(2|two)[ -]?pack|bundle|both|two of\b/.test(t) ? c.offers.find((x) => /2-pack|bundle/i.test(x.name)) ?? offer.o : offer.o;
      return { ...base, intent: 'purchase_ready', lead_stage: 'purchase_ready', response_text: `It's ${price(o.priceMinor)} for the ${o.name}${o.description ? `, ${lcFirst(o.description).replace(/[.!]+$/, '')}` : ''}. ${pick(t, ["Here's the link if you want it:", 'You can grab it here:', 'Link is here whenever you want it:'])} ${o.ctaUrl}`, confidence: 0.75, recommended_action: 'reply', cta_id: o.id, knowledge_source_ids: [o.id] };
    }
    if (faq && faq.s > 0) return { ...base, intent: 'needs_more_information', lead_stage: 'needs_more_information', response_text: faq.k.answer, confidence: 0.7, recommended_action: 'reply', knowledge_source_ids: [faq.k.id] };
    if (c.qualifyingQuestion && !alreadyAsked) return { ...base, intent: 'interested', lead_stage: 'interested', response_text: `${pick(t, ['Hey! ', 'Hi! ', 'Hey, thanks for the message. '])}${c.qualifyingQuestion}`, confidence: 0.6, recommended_action: 'reply' };
    return { ...base, intent: 'needs_more_information', lead_stage: 'needs_more_information', response_text: '', confidence: 0.2, recommended_action: 'handoff', handoff_reason: 'no matching fact' };
  },
};

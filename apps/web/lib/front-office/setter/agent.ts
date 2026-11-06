// The AI Setter (tracker 1.1, 1.3, 1.6, 1.7). One turn: read the contact's full context, let the model ask the next
// qualification question or book, run the tools it calls against the real store and calendar, and return the SMS to send
// (already logged with the prompt version). Booking hands the contact to Sales with the full handoff object; an existing
// customer or a support question goes to the Receptionist; anything outside the config goes to a human.
import { bookSlot, offerTimes, SlotTaken } from '../booking';
import type { Offer } from '../booking';
import type { CalendarProvider } from '../calendar/google';
import { formatSlot } from '../calendar/slots';
import { checkedHandoff } from '../handoff';
import type { Agent, Handoff } from '../handoff';
import { scheduleReminders, startFollowUps } from '../jobs';
import type { Llm, LlmMessage, ToolResultBlock, ToolSpec, ToolUseBlock } from '../llm';
import type { ChannelAuth, Rpc } from '../orchestrator';
import { canTransition, isContactState } from '../state';
import type { ContactState } from '../state';
import type { SmsSender } from '../sms-send';
import type { SetterConfig } from './config';
import { SETTER_PROMPT_VERSION, setterSystemPrompt } from './prompt';

type Context = {
  contact: { id: string; name: string | null; phone: string | null; email: string | null; state: ContactState; optedOut: boolean; answers: Record<string, string> };
  messages: { direction: 'inbound' | 'outbound'; body: string; agent: string | null; at: string }[];
  appointment: { id: string; starts: string; ends: string; status: string } | null;
  handoffs: { from: string; owner: string; intent: string; summary: string }[];
};
export type SetterTurn = { reply: string | null; state: ContactState; booked: boolean; handedTo: Agent | null; tools: string[] };
export type SetterDeps = { llm: Llm; rpc: Rpc; auth: ChannelAuth; calendar: CalendarProvider | null; send: SmsSender; config: SetterConfig; now: number };

export const setterTools: ToolSpec[] = [
  { name: 'save_answers', description: 'Save qualification answers by question id, and the contact name or email if given.', input_schema: { type: 'object', properties: { answers: { type: 'object', additionalProperties: { type: 'string' } }, name: { type: 'string' }, email: { type: 'string' } }, required: ['answers'] } },
  { name: 'set_stage', description: 'Move the contact to qualifying, qualified, disqualified or nurture.', input_schema: { type: 'object', properties: { stage: { type: 'string', enum: ['qualifying', 'qualified', 'disqualified', 'nurture'] }, reason: { type: 'string' } }, required: ['stage', 'reason'] } },
  { name: 'offer_times', description: 'Get two or three open times from the live calendar. Only once the contact is qualified.', input_schema: { type: 'object', properties: {} } },
  { name: 'book_time', description: 'Book one of the times returned by offer_times, using its start value.', input_schema: { type: 'object', properties: { start: { type: 'string' } }, required: ['start'] } },
  { name: 'handoff_receptionist', description: 'Existing customer, support, billing or complaint: hand to the Receptionist.', input_schema: { type: 'object', properties: { intent: { type: 'string' }, summary: { type: 'string' } }, required: ['intent', 'summary'] } },
  { name: 'escalate_human', description: 'Discounts, custom deals, legal or refund questions, or anything not in the facts: hand to a person.', input_schema: { type: 'object', properties: { intent: { type: 'string' }, summary: { type: 'string' } }, required: ['intent', 'summary'] } },
];

const str = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const ACTIVE_STATES: readonly ContactState[] = ['new', 'contacted', 'qualifying', 'qualified', 'nurture', 'no-show', 'disqualified'];

/** Conversation as alternating user/assistant turns, newest last (the Messages API needs a user turn first and last). */
export function transcript(messages: Context['messages']): LlmMessage[] {
  const out: LlmMessage[] = [];
  for (const m of messages) {
    const role = m.direction === 'inbound' ? 'user' : 'assistant';
    const last = out.at(-1);
    if (last && last.role === role) last.content = `${last.content as string}\n${m.body}`;
    else out.push({ role, content: m.body || '(empty message)' });
  }
  if (out[0]?.role === 'assistant') out.unshift({ role: 'user', content: '(The business messaged first.)' });
  if (out.at(-1)?.role !== 'user') out.push({ role: 'user', content: '(No new message from the contact.)' });
  return out;
}

export async function runSetterTurn(contactId: string, d: SetterDeps): Promise<SetterTurn> {
  const a = { channel: d.auth.channel, channel_key: d.auth.key };
  const ctx = await d.rpc('fo_contact_context', { ...a, contact: contactId }) as Context;
  const used: string[] = [];
  let state = ctx.contact.state, booked = false, handedTo: Agent | null = null, offers: Offer[] = [], bookedReply: string | null = null;
  if (ctx.contact.optedOut || !ACTIVE_STATES.includes(state)) return { reply: null, state, booked, handedTo, tools: used };

  const contactLine = [
    `Contact stage: ${state}.`,
    `Name: ${ctx.contact.name ?? 'unknown'}. Email: ${ctx.contact.email ?? 'unknown'}.`,
    `Answers so far: ${Object.keys(ctx.contact.answers).length ? JSON.stringify(ctx.contact.answers) : 'none'}.`,
    ctx.appointment ? `Already booked: ${formatSlot(Date.parse(ctx.appointment.starts), d.config.availability.timeZone)}.` : '',
    ctx.handoffs.length ? `Earlier handoffs: ${ctx.handoffs.map(h => `${h.from} to ${h.owner}: ${h.intent}`).join('; ')}.` : '',
  ].filter(Boolean).join('\n');
  const system = setterSystemPrompt(d.config, formatSlot(d.now, d.config.availability.timeZone)) + '\n\n' + contactLine;
  const messages = transcript(ctx.messages);

  async function moveTo(target: ContactState, reason: string) {
    if (state === target) return;
    // Pass through qualifying when the model jumps straight from a fresh lead to qualified.
    if (!canTransition(state, target) && canTransition(state, 'qualifying') && canTransition('qualifying', target)) await moveTo('qualifying', reason);
    if (!canTransition(state, target)) throw new Error(`Cannot move from ${state} to ${target}.`);
    state = await d.rpc('fo_set_state', { ...a, contact: contactId, new_state: target, agent_name: 'setter', reason: reason.slice(0, 500) }) as ContactState;
  }
  async function handoff(owner: Agent, intent: string, summary: string, nextAction: string) {
    const h: Handoff = checkedHandoff({
      contact: { id: contactId, name: ctx.contact.name, phone: ctx.contact.phone, email: ctx.contact.email, state },
      channel: 'sms', intent: intent || 'follow up', answers: ctx.contact.answers, summary: summary || 'See the conversation.', nextAction, from: 'setter', owner,
    });
    await d.rpc('fo_record_handoff', { ...a, contact: contactId, handoff: h });
    handedTo = owner;
  }

  async function run(t: ToolUseBlock): Promise<string> {
    used.push(t.name);
    const input = t.input ?? {};
    switch (t.name) {
      case 'save_answers': {
        const answers: Record<string, string> = {};
        const ids = new Set(d.config.questions.map(q => q.id));
        for (const [k, v] of Object.entries((input.answers ?? {}) as Record<string, unknown>)) if (ids.has(k) && typeof v === 'string' && v.trim()) answers[k] = v.trim().slice(0, 1000);
        const email = str(input.email, 254);
        const merged = await d.rpc('fo_save_answers', { ...a, contact: contactId, new_answers: answers, contact_name: str(input.name, 160) || null, contact_email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null }) as Record<string, string>;
        ctx.contact.answers = merged ?? { ...ctx.contact.answers, ...answers };
        if (str(input.name, 160)) ctx.contact.name = str(input.name, 160);
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ctx.contact.email = email.toLowerCase();
        const missing = d.config.questions.filter(q => q.required && !ctx.contact.answers[q.id]).map(q => q.id);
        return missing.length ? `Saved. Still needed: ${missing.join(', ')}.` : 'Saved. All required answers are in.';
      }
      case 'set_stage': {
        const stage = input.stage;
        if (!isContactState(stage) || !['qualifying', 'qualified', 'disqualified', 'nurture'].includes(stage)) return 'Unknown stage.';
        if (stage === 'qualified') {
          const missing = d.config.questions.filter(q => q.required && !ctx.contact.answers[q.id]).map(q => q.id);
          if (missing.length) return `Not yet: save these answers first: ${missing.join(', ')}.`;
        }
        await moveTo(stage, str(input.reason, 500) || stage);
        return `Stage is now ${state}.`;
      }
      case 'offer_times': {
        if (state !== 'qualified' && state !== 'no-show' && state !== 'nurture') return 'Qualify the contact first (set_stage qualified).';
        if (!d.calendar) { await handoff('human', 'book a call', 'Calendar not connected; please book this qualified lead by hand.', 'Call the lead to book'); return 'The calendar is not connected. Tell the contact a person will text them a time today.'; }
        offers = await offerTimes(d.calendar, d.config.availability, d.now);
        return offers.length ? JSON.stringify(offers.map(o => ({ label: o.label, start: new Date(o.start).toISOString() }))) : 'No open times in the next days. Say a person will be in touch.';
      }
      case 'book_time': {
        const start = Date.parse(str(input.start, 40));
        if (!d.calendar) return 'The calendar is not connected.';
        if (!offers.length) offers = await offerTimes(d.calendar, d.config.availability, d.now, 12);
        if (!offers.some(o => o.start === start)) return 'That is not one of the offered times. Call offer_times and use a start value from it.';
        if (state !== 'qualified') await moveTo('qualified', 'Picked a time');
        try {
          const r = await bookSlot({ calendar: d.calendar, rpc: d.rpc, auth: d.auth, send: async () => ({ sent: false, sid: null }), availability: d.config.availability, contact: ctx.contact, start, now: d.now, businessName: d.config.businessName, where: d.config.where, meetingTitle: d.config.meetingTitle });
          state = 'booked'; booked = true; bookedReply = r.confirmation || null;
          await handoff('sales', 'run the booked call', `Booked ${formatSlot(start, d.config.availability.timeZone)}. ` + (Object.entries(ctx.contact.answers).map(([k, v]) => `${k}: ${v}`).join('; ') || 'No answers saved.'), `Run the ${d.config.meetingTitle} at ${new Date(start).toISOString()}`);
          await scheduleReminders(d.rpc, d.auth, contactId, r.appointment, start, d.now);
          return 'Booked. The confirmation text is sent automatically; you do not need to write one.';
        } catch (e) {
          if (e instanceof SlotTaken) { offers = []; return 'That time was just taken. Call offer_times again and offer the new times.'; }
          throw e;
        }
      }
      case 'handoff_receptionist':
        await handoff('receptionist', str(input.intent, 200), str(input.summary, 4000), 'Answer the customer');
        return 'Handed to the Receptionist. Tell the contact the team will help them shortly.';
      case 'escalate_human':
        await handoff('human', str(input.intent, 200), str(input.summary, 4000), 'A person replies to the contact');
        return 'A person has been asked to follow up. Tell the contact someone will be in touch soon. Do not promise anything else.';
      default:
        return 'Unknown tool.';
    }
  }

  let reply = '';
  for (let round = 0; round < 6; round++) {
    const res = await d.llm({ system, messages, tools: setterTools });
    messages.push({ role: 'assistant', content: res.content });
    const calls = res.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
    reply = res.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join(' ').trim();
    if (!calls.length || res.stopReason !== 'tool_use') break;
    const results: ToolResultBlock[] = [];
    for (const c of calls) {
      try { results.push({ type: 'tool_result', tool_use_id: c.id, content: await run(c) }); }
      catch (e) { results.push({ type: 'tool_result', tool_use_id: c.id, content: e instanceof Error ? e.message : 'Tool failed.', is_error: true }); }
    }
    messages.push({ role: 'user', content: results });
    if (booked) break;
  }
  // After a booking the logged confirmation is the reply; otherwise the model's text (capped to two SMS).
  let text = booked ? bookedReply : (reply.replace(/\s+/g, ' ').trim().slice(0, 320) || null);
  if (text && !booked) await d.rpc('fo_log_outbound', { ...a, contact: contactId, message: text, agent_name: 'setter', prompt: SETTER_PROMPT_VERSION });
  if (text && !booked && !handedTo && !['booked', 'disqualified', 'customer'].includes(state)) await startFollowUps(d.rpc, d.auth, contactId, d.now);
  if (!text) text = null;
  return { reply: text, state, booked, handedTo, tools: used };
}

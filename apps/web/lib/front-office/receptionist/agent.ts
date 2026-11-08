// The AI Receptionist (phone). One caller turn: stream what to say, running the tools the model calls against the real
// store and calendar on the way. Transfers and hang-ups are returned as actions for the voice platform (Vapi) to carry
// out. Facts come only from the business's own FAQ (settings); anything else becomes a message or a transfer.
import { bookSlot, cancelBooking, offerTimes, rescheduleSlot, SlotTaken } from '../booking';
import type { Offer } from '../booking';
import type { CalendarProvider } from '../calendar/google';
import { formatSlot } from '../calendar/slots';
import type { EmailSender } from '../email';
import { checkedHandoff } from '../handoff';
import type { Agent } from '../handoff';
import { scheduleReminders } from '../jobs';
import type { LlmMessage, StreamLlm, ToolResultBlock, ToolSpec, ToolUseBlock } from '../llm';
import type { ChannelAuth, Rpc } from '../orchestrator';
import { availabilityFor } from '../settings';
import type { AgentSettings } from '../settings';
import { canTransition, isContactState } from '../state';
import type { ContactState } from '../state';
import type { SmsSender } from '../sms-send';
import { RECEPTIONIST_PROMPT_VERSION, receptionistSystemPrompt } from './prompt';

export type VoiceOut = { type: 'text'; text: string } | { type: 'transfer'; number: string } | { type: 'end' };
export type CallerTurn = { role: 'user' | 'assistant'; content: string };
export type ReceptionistDeps = {
  llm: StreamLlm; rpc: Rpc; auth: ChannelAuth; calendar: CalendarProvider | null; send: SmsSender; email: EmailSender;
  settings: AgentSettings; now: number;
  call: { id: string | null; caller: string | null; contact: string | null };
  conversation: CallerTurn[];
};
export type Outcome = 'faq' | 'faq-miss' | 'qualified' | 'booked' | 'rescheduled' | 'cancelled' | 'message' | 'transfer';
export type TurnSummary = { said: string; tools: string[]; outcomes: Outcome[]; action: 'transfer' | 'end' | null };

type Ctx = {
  contact: { id: string; name: string | null; phone: string | null; email: string | null; state: ContactState; optedOut: boolean; answers: Record<string, string> };
  appointment: { id: string; starts: string; ends: string; status: string } | null;
};

const phoneProp = { type: 'string', description: 'Caller mobile in E.164, e.g. +61412345678. Only if their number is withheld or they gave another one.' };
export const receptionistTools: ToolSpec[] = [
  { name: 'answer_faq', description: 'Look up the business’s own answer to a factual question (prices, hours, classes, location, policies). Say only what it returns.', input_schema: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] } },
  { name: 'qualify', description: 'Save the caller’s answers to the qualifying questions by question id, and their name, mobile or email if given.', input_schema: { type: 'object', properties: { answers: { type: 'object', additionalProperties: { type: 'string' } }, name: { type: 'string' }, phone: phoneProp, email: { type: 'string' } }, required: ['answers'] } },
  { name: 'check_availability', description: 'Get two or three open times from the live calendar.', input_schema: { type: 'object', properties: {} } },
  { name: 'book', description: 'Book one of the times from check_availability, using its start value.', input_schema: { type: 'object', properties: { start: { type: 'string' }, phone: phoneProp }, required: ['start'] } },
  { name: 'reschedule', description: 'Move the caller’s existing booking to one of the times from check_availability.', input_schema: { type: 'object', properties: { start: { type: 'string' } }, required: ['start'] } },
  { name: 'cancel', description: 'Cancel the caller’s existing booking, after they confirm.', input_schema: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] } },
  { name: 'take_message', description: 'Take a message for the team, who will call back.', input_schema: { type: 'object', properties: { message: { type: 'string' }, name: { type: 'string' }, phone: phoneProp, urgent: { type: 'boolean' } }, required: ['message'] } },
  { name: 'transfer', description: 'Put the caller through to a person at the business (urgent, complaint, billing, or they ask for a person).', input_schema: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] } },
  { name: 'end_call', description: 'Hang up, after saying goodbye.', input_schema: { type: 'object', properties: {} } },
];

const STOP = new Set('the and for are you your our with what how much does can have when where which this that from about there their them they is it to of in on at a an do i we be or if my me any'.split(' '));
const words = (t: string) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
/** The business's FAQ entries that best match a question (word overlap), best first. Empty: nothing on file. */
export function matchFaqs(question: string, faqs: AgentSettings['faqs'], max = 2) {
  const q = words(question);
  return faqs.map(f => { const fw = words(f.q + ' ' + f.a); let n = 0; for (const w of q) if (fw.has(w)) n++; return { f, n: n + (words(f.q).size && [...words(f.q)].every(w => q.has(w)) ? 2 : 0) }; })
    .filter(x => x.n > 0).sort((a, b) => b.n - a.n).slice(0, max).map(x => x.f);
}

/** Vapi's conversation as Messages API turns: user first and last, same-role turns merged. */
export function callTranscript(turns: CallerTurn[]): LlmMessage[] {
  const out: LlmMessage[] = [];
  for (const t of turns) {
    const text = t.content.trim();
    if (!text) continue;
    const last = out.at(-1);
    if (last && last.role === t.role) last.content = `${last.content as string}\n${text}`;
    else out.push({ role: t.role, content: text });
  }
  if (out[0]?.role !== 'user') out.unshift({ role: 'user', content: '(The call connected.)' });
  if (out.at(-1)?.role !== 'user') out.push({ role: 'user', content: '(The caller is silent.)' });
  return out;
}

const str = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const cleanPhone = (v: unknown) => str(v, 24).replace(/[\s()-]/g, '').replace(/^0(?=[2-478]\d{8}$)/, '+61');
const E164 = /^\+[1-9][0-9]{6,14}$/;

/** Everything the Receptionist can do on one call, against the real store and calendar. Used by the streamed turn and by
 * Vapi tool-call webhooks (when tools are configured on the Vapi side instead). */
export async function receptionistSession(d: Omit<ReceptionistDeps, 'llm' | 'conversation'>) {
  const s = d.settings, tz = s.timeZone, availability = availabilityFor(s);
  const a = { channel: d.auth.channel, channel_key: d.auth.key };
  const used: string[] = [], outcomes: Outcome[] = [];
  let contactId = d.call.contact, ctx: Ctx | null = null, offers: Offer[] = [], action: TurnSummary['action'] = null, transferTo = '';
  const load = async () => { ctx = contactId ? await d.rpc('fo_contact_context', { ...a, contact: contactId }) as Ctx : null; };
  await load();
  const outcome = async (o: Outcome) => {
    if (!outcomes.includes(o)) outcomes.push(o);
    if (d.call.id) await d.rpc('fo_voice_outcome', { ...a, call_id: d.call.id, outcome: o }).catch(() => undefined);
  };
  /** The caller as a contact: from the call, or from a number they gave. */
  async function ensureContact(phoneArg: unknown, name?: string): Promise<string | null> {
    const phone = cleanPhone(phoneArg);
    if (phone && E164.test(phone) && d.call.id && (!ctx || ctx.contact.phone !== phone)) {
      contactId = await d.rpc('fo_voice_contact', { ...a, call_id: d.call.id, phone_number: phone, contact_name: name ?? null }) as string;
      await load();
    }
    return contactId;
  }
  async function moveTo(target: ContactState, reason: string) {
    const c = ctx as Ctx | null;
    if (!c || c.contact.state === target) return;
    if (!canTransition(c.contact.state, target) && canTransition(c.contact.state, 'qualifying') && canTransition('qualifying', target)) await moveTo('qualifying', reason);
    if (!canTransition(c.contact.state, target)) throw new Error(`Cannot move from ${c.contact.state} to ${target}.`);
    const next = await d.rpc('fo_set_state', { ...a, contact: c.contact.id, new_state: target, agent_name: 'receptionist', reason: reason.slice(0, 500) });
    c.contact.state = isContactState(next) ? next : target;
  }
  async function handoff(owner: Agent, intent: string, summary: string, nextAction: string) {
    const c = ctx as Ctx | null;
    if (!c) return;
    const h = checkedHandoff({ contact: { id: c.contact.id, name: c.contact.name, phone: c.contact.phone, email: c.contact.email, state: c.contact.state }, channel: 'voice', intent: intent || 'call back', answers: c.contact.answers, summary: summary || 'See the call.', nextAction, from: 'receptionist', owner });
    await d.rpc('fo_record_handoff', { ...a, contact: c.contact.id, handoff: h });
  }
  const missingAnswers = () => s.questions.filter(q => q.required && !(ctx as Ctx | null)?.contact.answers[q.id]).map(q => q.id);

  async function run(t: ToolUseBlock): Promise<string> {
    used.push(t.name);
    const input = t.input ?? {};
    switch (t.name) {
      case 'answer_faq': {
        const hits = matchFaqs(str(input.question, 300), s.faqs);
        await outcome(hits.length ? 'faq' : 'faq-miss');
        return hits.length ? JSON.stringify(hits.map(f => ({ question: f.q, answer: f.a }))) : 'No answer on file. Say you do not have that in front of you and offer to take a message or put them through.';
      }
      case 'qualify': {
        await ensureContact(input.phone, str(input.name, 160) || undefined);
        if (!ctx) return 'I need their mobile number first, so the team can reach them. Ask for it and pass it as phone.';
        const c = ctx as Ctx;
        const ids = new Set(s.questions.map(q => q.id)), answers: Record<string, string> = {};
        for (const [k, v] of Object.entries((input.answers ?? {}) as Record<string, unknown>)) if (ids.has(k) && typeof v === 'string' && v.trim()) answers[k] = v.trim().slice(0, 1000);
        const email = str(input.email, 254), okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const r = await d.rpc('fo_save_details', { ...a, contact: c.contact.id, new_answers: answers, contact_name: str(input.name, 160) || null, contact_email: okEmail ? email : null, contact_phone: null }) as { answers?: Record<string, string> } | null;
        c.contact.answers = r?.answers ?? { ...c.contact.answers, ...answers };
        if (str(input.name, 160)) c.contact.name = str(input.name, 160);
        const missing = missingAnswers();
        if (!missing.length && ['new', 'contacted', 'qualifying', 'nurture', 'disqualified'].includes(c.contact.state)) { await moveTo('qualified', 'Answered the qualifying questions on a call'); await outcome('qualified'); }
        else if (missing.length && ['new', 'contacted', 'nurture'].includes(c.contact.state)) await moveTo('qualifying', 'Qualifying on a call');
        return missing.length ? `Saved. Still to ask: ${missing.join(', ')}.` : 'Saved. All required answers are in.';
      }
      case 'check_availability': {
        if (!d.calendar) return 'The calendar is not connected. Offer to take a message so the team can book them.';
        if (!Object.keys(s.hours).length) return 'Booking hours are not set up yet. Offer to take a message so the team can book them.';
        offers = await offerTimes(d.calendar, availability, d.now);
        return offers.length ? JSON.stringify(offers.map(o => ({ label: o.label, start: new Date(o.start).toISOString() }))) : 'No open times in the next two weeks. Offer to take a message.';
      }
      case 'book': {
        await ensureContact(input.phone);
        if (!ctx) return 'Ask for their mobile number first and pass it as phone.';
        const c = ctx as Ctx;
        if (!d.calendar) return 'The calendar is not connected. Offer to take a message.';
        if (c.appointment) return `They already have a booking on ${formatSlot(Date.parse(c.appointment.starts), tz)}. Offer to move it instead.`;
        const missing = missingAnswers();
        if (missing.length) return `Ask these first and save them with qualify: ${missing.join(', ')}.`;
        const start = Date.parse(str(input.start, 40));
        if (!offers.length) offers = await offerTimes(d.calendar, availability, d.now, 12);
        if (!offers.some(o => o.start === start)) return 'That is not one of the open times. Call check_availability and use a start value from it.';
        if (c.contact.state !== 'qualified') await moveTo('qualified', 'Booking on a call');
        try {
          const r = await bookSlot({ calendar: d.calendar, rpc: d.rpc, auth: d.auth, send: d.send, availability, contact: c.contact, start, now: d.now, businessName: s.businessName, where: s.bookingWhere, meetingTitle: s.bookingType });
          c.contact.state = 'booked';
          await scheduleReminders(d.rpc, d.auth, c.contact.id, r.appointment, start, d.now);
          await outcome('booked');
          return `Booked for ${formatSlot(start, tz)}. A confirmation text is on its way. Tell them, then ask if there is anything else.`;
        } catch (e) {
          if (e instanceof SlotTaken) { offers = []; return 'That time was just taken. Call check_availability again.'; }
          throw e;
        }
      }
      case 'reschedule': {
        const c = ctx as Ctx | null;
        if (!c?.appointment) return 'I cannot find a booking for this caller. Offer to book a new time or take a message.';
        if (!d.calendar) return 'The calendar is not connected. Offer to take a message.';
        const start = Date.parse(str(input.start, 40));
        if (!offers.length) offers = await offerTimes(d.calendar, availability, d.now, 12);
        if (!offers.some(o => o.start === start)) return 'That is not one of the open times. Call check_availability and use a start value from it.';
        try {
          await rescheduleSlot({ calendar: d.calendar, rpc: d.rpc, auth: d.auth, send: d.send, availability, contact: c.contact, appointment: c.appointment, start, now: d.now, businessName: s.businessName, where: s.bookingWhere });
          await scheduleReminders(d.rpc, d.auth, c.contact.id, c.appointment.id, start, d.now);
          c.appointment = { ...c.appointment, starts: new Date(start).toISOString() };
          await outcome('rescheduled');
          return `Moved to ${formatSlot(start, tz)}. A text confirming it is on its way.`;
        } catch (e) {
          if (e instanceof SlotTaken) { offers = []; return 'That time was just taken. Call check_availability again.'; }
          throw e;
        }
      }
      case 'cancel': {
        const c = ctx as Ctx | null;
        if (!c?.appointment) return 'I cannot find a booking for this caller.';
        await cancelBooking({ calendar: d.calendar, rpc: d.rpc, auth: d.auth, send: d.send, contact: c.contact, appointment: c.appointment, reason: str(input.reason, 400) || 'Cancelled on a call', businessName: s.businessName, timeZone: tz });
        c.appointment = null; c.contact.state = 'qualified';
        await outcome('cancelled');
        return 'Cancelled. A text confirming it is on its way. Offer to book another time.';
      }
      case 'take_message': {
        const name = str(input.name, 160);
        await ensureContact(input.phone, name || undefined);
        const c = ctx as Ctx | null;
        const msg = str(input.message, 1500) || 'Please call back.';
        const from = c?.contact.phone ?? d.call.caller ?? 'number withheld';
        const urgent = input.urgent === true;
        await handoff('human', urgent ? 'urgent call back' : 'call back', `Phone message${urgent ? ' (urgent)' : ''} from ${name || c?.contact.name || 'a caller'} on ${from}: ${msg}`, 'Call the caller back');
        const note = `${s.businessName} AI receptionist: ${urgent ? 'URGENT ' : ''}message from ${name || c?.contact.name || 'a caller'} (${from}): ${msg}`.slice(0, 600);
        // Staff notifications go out only when live sending is on (the senders enforce FRONT_OFFICE_SEND_LIVE).
        if (s.staffPhone) await d.send(s.staffPhone, note.slice(0, 320)).catch(() => undefined);
        if (s.staffEmail) await d.email(s.staffEmail, `${urgent ? 'Urgent: ' : ''}phone message for ${s.businessName}`, note).catch(() => undefined);
        await outcome('message');
        return from === 'number withheld' ? 'Message taken, but there is no number to call back on. Ask for their mobile if they want a call back.' : 'Message taken. Tell them the team will call them back.';
      }
      case 'transfer': {
        if (!s.transferNumber) return 'No one is available to take calls right now. Offer to take a message instead.';
        await handoff('human', 'call transferred', `Transferred to the team: ${str(input.reason, 400) || 'caller asked for a person'}.`, 'Take the transferred call');
        await outcome('transfer');
        transferTo = s.transferNumber; action = 'transfer';
        return 'Transferring now. Say one short sentence, like "Putting you through now."';
      }
      case 'end_call':
        if (!action) action = 'end';
        return 'Ending the call after your goodbye.';
      default:
        return 'Unknown tool.';
    }
  }

  return {
    run, outcomes, used,
    get ctx() { return ctx as Ctx | null; },
    get action() { return action; },
    get transferTo() { return transferTo; },
  };
}

export async function* runReceptionistTurn(d: ReceptionistDeps): AsyncGenerator<VoiceOut, TurnSummary> {
  const s = d.settings, tz = s.timeZone;
  const a = { channel: d.auth.channel, channel_key: d.auth.key };
  const session = await receptionistSession(d);
  const c0 = session.ctx;
  const contactLine = [
    c0 ? `Caller on record: ${c0.contact.name ?? 'name unknown'}, stage ${c0.contact.state}.` : (d.call.caller ? 'New caller.' : 'Caller’s number is withheld.'),
    c0 && Object.keys(c0.contact.answers).length ? `Answers on file: ${JSON.stringify(c0.contact.answers)}.` : '',
    c0?.appointment ? `They have a booking on ${formatSlot(Date.parse(c0.appointment.starts), tz)}.` : '',
    s.faqs.length ? '' : 'The business has not added any FAQ answers yet.',
    s.transferNumber ? '' : 'Transfers are not set up: take a message instead.',
  ].filter(Boolean).join('\n');
  const system = receptionistSystemPrompt(s, formatSlot(d.now, tz), contactLine);
  const messages = callTranscript(d.conversation);
  let said = '';

  for (let round = 0; round < 5 && !session.action; round++) {
    const calls: ToolUseBlock[] = [];
    let text = '', stop = 'end_turn';
    for await (const ev of d.llm({ system, messages, tools: receptionistTools, maxTokens: 300 })) {
      if (ev.type === 'text') { text += ev.text; said += ev.text; yield { type: 'text', text: ev.text }; }
      else if (ev.type === 'tool') calls.push(ev.block);
      else stop = ev.reason;
    }
    messages.push({ role: 'assistant', content: [...(text ? [{ type: 'text' as const, text }] : []), ...calls] });
    if (!calls.length || stop !== 'tool_use') break;
    const results: ToolResultBlock[] = [];
    for (const c of calls) {
      try { results.push({ type: 'tool_result', tool_use_id: c.id, content: await session.run(c) }); }
      catch (e) { results.push({ type: 'tool_result', tool_use_id: c.id, content: (e instanceof Error ? e.message : 'That did not work.') + ' Apologise and offer to take a message.', is_error: true }); }
    }
    messages.push({ role: 'user', content: results });
    if (session.action) {
      // One last short line before the transfer or hang-up, if the model has not said goodbye yet.
      if (!text.trim()) {
        for await (const ev of d.llm({ system, messages, tools: receptionistTools, maxTokens: 80 })) if (ev.type === 'text') { said += ev.text; yield { type: 'text', text: ev.text }; }
      }
    }
  }
  if (said.trim() && d.call.id) await d.rpc('fo_voice_reply', { ...a, call_id: d.call.id, message: said.trim(), prompt: RECEPTIONIST_PROMPT_VERSION }).catch(() => undefined);
  if (session.action === 'transfer') yield { type: 'transfer', number: session.transferTo };
  if (session.action === 'end') yield { type: 'end' };
  return { said: said.trim(), tools: session.used, outcomes: session.outcomes, action: session.action };
}

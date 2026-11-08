// Per-business agent settings (multi-tenant): what the AI Setter and AI Receptionist say and do for one workspace.
// Stored in public.fo_agent_settings (owner edits at /tools/front-office-settings); webhooks read them with their
// channel key (fo_channel_settings). Anything missing falls back to the template, so a business can start with a name.
import { checkedAvailability } from './calendar/slots';
import type { Availability } from './calendar/slots';
import type { ChannelAuth, Rpc } from './orchestrator';
import { checkedSetterConfig, ventraSetterConfig } from './setter/config';
import type { QualificationQuestion, SetterConfig } from './setter/config';
import { gymQuestions, gymTemplate } from './templates/gym';
import { ventraTemplate } from './templates/ventra';

export const templates = ['gym', 'ventra', 'custom'] as const;
export type TemplateId = typeof templates[number];
export type Faq = { q: string; a: string };
/** Weekly booking hours, keyed "0" (Sunday) to "6", each window "HH:MM" to "HH:MM" in timeZone. */
export type Hours = Partial<Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', [string, string][]>>;
export type AgentSettings = {
  template: TemplateId;
  businessName: string;
  /** What the AI books or sells, in a sentence or two. */
  offer: string;
  idealCustomer: string;
  notAFit: string;
  bookingType: string;
  bookingWhere: string;
  bookingMinutes: number;
  timeZone: string;
  hours: Hours;
  questions: QualificationQuestion[];
  /** Written by the business. The AI answers factual questions from these only. */
  faqs: Faq[];
  staffPhone: string | null;
  staffEmail: string | null;
  /** Where the Receptionist puts urgent callers through. None: it takes a message instead. */
  transferNumber: string | null;
  greeting: string;
  aiDisclosure: string;
  /** Read at the start of every call when set (for example when Vapi records calls). Empty: not read. */
  recordingNotice: string;
  setterOn: boolean;
  receptionistOn: boolean;
  voiceOn: boolean;
};

const E164 = /^\+[1-9][0-9]{6,14}$/, EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, HHMM = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
const s = (v: unknown, field: string, max: number, required = false): string => {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') throw new Error(`${field} must be text.`);
  const t = v.trim();
  if (required && !t) throw new Error(`${field} is required.`);
  if (t.length > max) throw new Error(`${field} must be ${max} characters or fewer.`);
  return t;
};
const optional = (v: unknown, field: string, re: RegExp, hint: string): string | null => {
  const t = s(v, field, 254).replace(field.includes('phone') || field.includes('number') ? /[\s()-]/g : /$^/, '');
  if (!t) return null;
  if (!re.test(t)) throw new Error(`${field} ${hint}`);
  return field.includes('mail') ? t.toLowerCase() : t;
};

/** Validate settings from the owner or the database. Throws a plain-English message on the first problem. */
export function checkedAgentSettings(x: unknown): AgentSettings {
  if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Error('Settings must be an object.');
  const o = x as Record<string, unknown>;
  if (!templates.includes(o.template as TemplateId)) throw new Error('Choose a template: gym, ventra or custom.');
  const questions = Array.isArray(o.questions) ? o.questions : [];
  if (questions.length < 3 || questions.length > 5) throw new Error('Use 3 to 5 qualifying questions.');
  const ids = new Set<string>();
  const qs: QualificationQuestion[] = questions.map((q, i) => {
    const r = (q ?? {}) as Record<string, unknown>;
    const id = s(r.id, `Question ${i + 1} id`, 40, true);
    if (!/^[a-z][a-z0-9_]{1,39}$/.test(id) || ids.has(id)) throw new Error(`Question ${i + 1} id must be unique, lower case letters, numbers or _.`);
    ids.add(id);
    return { id, ask: s(r.ask, `Question ${i + 1}`, 300, true), required: r.required !== false };
  });
  if (!qs.some(q => q.required)) throw new Error('Make at least one question required.');
  const faqsIn = Array.isArray(o.faqs) ? o.faqs : [];
  if (faqsIn.length > 40) throw new Error('Use 40 FAQs or fewer.');
  const faqs = faqsIn.map((f, i) => { const r = (f ?? {}) as Record<string, unknown>; return { q: s(r.q, `FAQ ${i + 1} question`, 200, true), a: s(r.a, `FAQ ${i + 1} answer`, 600, true) }; });
  const hoursIn = (o.hours && typeof o.hours === 'object' && !Array.isArray(o.hours) ? o.hours : {}) as Record<string, unknown>;
  const hours: Hours = {};
  for (const [day, windows] of Object.entries(hoursIn)) {
    if (!/^[0-6]$/.test(day)) throw new Error('Hours use days 0 (Sunday) to 6 (Saturday).');
    if (!Array.isArray(windows) || windows.length > 4) throw new Error('Use up to 4 time windows a day.');
    const list = windows.map(w => {
      if (!Array.isArray(w) || w.length !== 2 || !HHMM.test(String(w[0])) || !HHMM.test(String(w[1]))) throw new Error('Hours must be HH:MM to HH:MM.');
      if (String(w[1]) <= String(w[0])) throw new Error(`Window ${w[0]}-${w[1]} must end after it starts.`);
      return [String(w[0]), String(w[1])] as [string, string];
    });
    if (list.length) hours[day as keyof Hours] = list;
  }
  const bookingMinutes = Number(o.bookingMinutes);
  if (!Number.isInteger(bookingMinutes) || bookingMinutes < 10 || bookingMinutes > 240) throw new Error('Booking length must be 10 to 240 minutes.');
  const timeZone = s(o.timeZone, 'Time zone', 60, true);
  checkedAvailability({ timeZone, weekly: {}, slotMinutes: bookingMinutes, bufferMinutes: 0, minNoticeMinutes: 0, horizonDays: 14 });
  return {
    template: o.template as TemplateId,
    businessName: s(o.businessName, 'Business name', 160, true),
    offer: s(o.offer, 'What you book or sell', 600, true),
    idealCustomer: s(o.idealCustomer, 'Good fit', 400),
    notAFit: s(o.notAFit, 'Not a fit', 400),
    bookingType: s(o.bookingType, 'Booking type', 80, true),
    bookingWhere: s(o.bookingWhere, 'Where the booking happens', 80, true),
    bookingMinutes, timeZone, hours, questions: qs, faqs,
    staffPhone: optional(o.staffPhone, 'Staff phone', E164, 'must be a mobile like +61412345678.'),
    staffEmail: optional(o.staffEmail, 'Staff email', EMAIL, 'is not a valid email.'),
    transferNumber: optional(o.transferNumber, 'Transfer number', E164, 'must be a number like +61812345678.'),
    greeting: s(o.greeting, 'Greeting', 200, true),
    aiDisclosure: s(o.aiDisclosure, 'AI disclosure', 200, true),
    recordingNotice: s(o.recordingNotice, 'Recording notice', 300),
    setterOn: o.setterOn !== false, receptionistOn: o.receptionistOn !== false, voiceOn: o.voiceOn === true,
  };
}

const fill = (t: string, business: string) => t.replace(/\{business\}/g, business);
const hoursFromWeekly = (w: Availability['weekly']): Hours => Object.fromEntries(Object.entries(w).map(([d, ws]) => [d, (ws ?? []).map(x => [x[0], x[1]])])) as Hours;

/** Starting settings for a new business. Gym: FAQs and hours empty on purpose (only the gym can state them). */
export function templateSettings(template: TemplateId, businessName = ''): AgentSettings {
  if (template === 'ventra') {
    const v = ventraTemplate;
    return {
      template, businessName: businessName || v.businessName, offer: v.offer, idealCustomer: v.idealCustomer, notAFit: v.notAFit,
      bookingType: v.bookingType, bookingWhere: v.bookingWhere, bookingMinutes: v.bookingMinutes, timeZone: v.timeZone,
      hours: hoursFromWeekly(v.weekly), questions: v.questions.map(q => ({ ...q })), faqs: v.facts.map(f => ({ q: 'About Ventra', a: f })),
      staffPhone: null, staffEmail: null, transferNumber: null, greeting: v.greeting, aiDisclosure: v.aiDisclosure, recordingNotice: '',
      setterOn: true, receptionistOn: true, voiceOn: false,
    };
  }
  const g = gymTemplate;
  return {
    template, businessName, offer: g.offer, idealCustomer: g.idealCustomer, notAFit: g.notAFit,
    bookingType: g.bookingType, bookingWhere: g.bookingWhere, bookingMinutes: g.bookingMinutes, timeZone: 'Australia/Perth',
    hours: {}, questions: gymQuestions.map(q => ({ ...q })), faqs: [],
    staffPhone: null, staffEmail: null, transferNumber: null, greeting: g.greeting, aiDisclosure: g.aiDisclosure, recordingNotice: '',
    setterOn: true, receptionistOn: true, voiceOn: false,
  };
}

export function availabilityFor(st: AgentSettings): Availability {
  const weekly: Availability['weekly'] = {};
  for (const [d, ws] of Object.entries(st.hours)) weekly[Number(d) as 0] = ws;
  return checkedAvailability({ timeZone: st.timeZone, weekly, slotMinutes: st.bookingMinutes, bufferMinutes: 15, minNoticeMinutes: 120, horizonDays: 14 });
}

/** The Setter's config for this business: its own words and questions, the template's follow-up texts. */
export function setterConfigFor(st: AgentSettings): SetterConfig {
  const t = st.template === 'ventra' ? ventraTemplate : gymTemplate;
  const b = st.businessName;
  return checkedSetterConfig({
    businessName: b, offer: st.offer, idealCustomer: st.idealCustomer || 'People who want what we offer.', notAFit: st.notAFit || 'Spam, job seekers and sales pitches.',
    questions: st.questions, meetingTitle: st.bookingType, where: st.bookingWhere, availability: availabilityFor(st),
    facts: st.faqs.map(f => `${f.q} ${f.a}`),
    followUps: t.followUps.map(x => fill(x, b)), reminder24h: fill(t.reminder24h, b), reminder2h: fill(t.reminder2h, b), noShowRescue: t.noShowRescue.map(x => fill(x, b)),
  });
}

/** This channel's business settings, or null (not saved yet, invalid, or the database is unreachable). */
export async function loadAgentSettings(rpc: Rpc, auth: ChannelAuth): Promise<AgentSettings | null> {
  try {
    const raw = await rpc('fo_channel_settings', { channel: auth.channel, channel_key: auth.key });
    return raw ? checkedAgentSettings(raw) : null;
  } catch { return null; }
}

/** What the Setter runs with on this channel. No saved settings: Ventra's own config (customer zero). */
export async function loadSetter(rpc: Rpc, auth: ChannelAuth, fallback: SetterConfig = ventraSetterConfig): Promise<{ config: SetterConfig; on: boolean; settings: AgentSettings | null }> {
  const st = await loadAgentSettings(rpc, auth);
  if (!st) return { config: fallback, on: true, settings: null };
  try { return { config: setterConfigFor(st), on: st.setterOn, settings: st }; } catch { return { config: fallback, on: st.setterOn, settings: st }; }
}

// Scheduled touches (tracker 1.4, 1.5): the follow-up ladder, pre-call reminders and the no-show rescue. Jobs live in
// fo_jobs; an inbound reply cancels pending follow-ups and rescues in the database, so a lead who answers never gets a
// nudge. Every text is logged with its prompt version before it is sent.
import { timingSafeEqual } from 'node:crypto';
import { formatSlot } from './calendar/slots';
import type { ChannelAuth, Rpc } from './orchestrator';
import { fillTemplate } from './setter/config';
import type { SetterConfig } from './setter/config';
import type { SmsSender } from './sms-send';
import type { EmailSender } from './email';

const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;
/** Gap before each follow-up: touches at 5 min, 1 h, 1 d, 3 d, 7 d after going quiet, then monthly. */
export const ladderGaps = [5 * MIN, 55 * MIN, 23 * HOUR, 2 * DAY, 4 * DAY];
export const MONTHLY = 30 * DAY, LADDER_MAX_STEP = 10;
export const rescueGaps = [15 * MIN, DAY];
export const FOLLOW_UP_PROMPT = 'setter/follow-up@1', REMINDER_PROMPT = 'setter/reminder@1', RESCUE_PROMPT = 'setter/no-show-rescue@1';
const iso = (t: number) => new Date(t).toISOString();
const done = new Set(['booked', 'disqualified', 'customer']);

export const gapBefore = (step: number) => step <= ladderGaps.length ? ladderGaps[step - 1] : MONTHLY;

export async function startFollowUps(rpc: Rpc, auth: ChannelAuth, contact: string, now: number) {
  return rpc('fo_schedule_job', { channel: auth.channel, channel_key: auth.key, contact, job_kind: 'follow-up', job_step: 1, due: iso(now + gapBefore(1)), appointment: null });
}
export async function scheduleReminders(rpc: Rpc, auth: ChannelAuth, contact: string, appointment: string, start: number, now: number) {
  for (const [kind, before] of [['reminder-24h', DAY], ['reminder-2h', 2 * HOUR]] as const) {
    if (start - before > now + 5 * MIN) await rpc('fo_schedule_job', { channel: auth.channel, channel_key: auth.key, contact, job_kind: kind, job_step: 1, due: iso(start - before), appointment });
  }
}
/** Sales or a human marks a missed call: the contact moves to no-show and the rescue starts. */
export async function markNoShow(rpc: Rpc, auth: ChannelAuth, contact: string, now: number, by: 'sales' | 'human' = 'human') {
  await rpc('fo_set_state', { channel: auth.channel, channel_key: auth.key, contact, new_state: 'no-show', agent_name: by, reason: 'Missed the booked call' });
  await rpc('fo_schedule_job', { channel: auth.channel, channel_key: auth.key, contact, job_kind: 'no-show-rescue', job_step: 1, due: iso(now + rescueGaps[0]), appointment: null });
}

type Job = { id: string; contact: string; kind: 'follow-up' | 'reminder-24h' | 'reminder-2h' | 'no-show-rescue'; step: number; appointment: string | null };
type Ctx = { contact: { name: string | null; phone: string | null; email: string | null; state: string; optedOut: boolean }; appointment: { id: string; starts: string } | null };
export type JobOutcome = { id: string; kind: Job['kind']; outcome: 'done' | 'cancelled' | 'failed'; note: string; sent: boolean };

/** Texts go by SMS when the contact has a mobile, otherwise by email when an email sender is given. */
/** config: the business's Setter texts, or a loader that is only called when there are jobs to run. */
export async function runDueJobs(input: { rpc: Rpc; auth: ChannelAuth; send: SmsSender; email?: EmailSender; config: SetterConfig | (() => Promise<SetterConfig>); now: number; max?: number }): Promise<JobOutcome[]> {
  const a = { channel: input.auth.channel, channel_key: input.auth.key };
  const jobs = await input.rpc('fo_claim_jobs', { ...a, max_jobs: input.max ?? 25 }) as Job[];
  if (!jobs.length) return [];
  const i = { ...input, config: typeof input.config === 'function' ? await input.config() : input.config };
  const out: JobOutcome[] = [];
  for (const job of jobs) {
    let outcome: JobOutcome['outcome'] = 'done', note = 'Sent', sent = false;
    try {
      const ctx = await i.rpc('fo_contact_context', { ...a, contact: job.contact }) as Ctx;
      let text: string | null = null, prompt = FOLLOW_UP_PROMPT, next: { step: number; gap: number; kind: Job['kind'] } | null = null;
      const reachable = !!ctx.contact.phone || (!!ctx.contact.email && !!i.email);
      if (ctx.contact.optedOut || !reachable) { outcome = 'cancelled'; note = 'Opted out or no way to reach them'; }
      else if (job.kind === 'follow-up') {
        if (done.has(ctx.contact.state)) { outcome = 'cancelled'; note = `Contact is ${ctx.contact.state}`; }
        else {
          text = fillTemplate(i.config.followUps[Math.min(job.step - 1, i.config.followUps.length - 1)], { name: ctx.contact.name });
          if (job.step < LADDER_MAX_STEP) next = { step: job.step + 1, gap: gapBefore(job.step + 1), kind: 'follow-up' };
        }
      } else if (job.kind === 'no-show-rescue') {
        if (ctx.contact.state !== 'no-show') { outcome = 'cancelled'; note = `Contact is ${ctx.contact.state}`; }
        else {
          prompt = RESCUE_PROMPT;
          text = fillTemplate(i.config.noShowRescue[job.step - 1] ?? i.config.noShowRescue.at(-1)!, { name: ctx.contact.name });
          if (job.step < Math.min(i.config.noShowRescue.length, rescueGaps.length)) next = { step: job.step + 1, gap: rescueGaps[job.step], kind: 'no-show-rescue' };
        }
      } else {
        if (!ctx.appointment || ctx.appointment.id !== job.appointment || ctx.contact.state !== 'booked') { outcome = 'cancelled'; note = 'Appointment no longer booked'; }
        else {
          prompt = REMINDER_PROMPT;
          const time = formatSlot(Date.parse(ctx.appointment.starts), i.config.availability.timeZone);
          text = fillTemplate(job.kind === 'reminder-24h' ? i.config.reminder24h : i.config.reminder2h, { name: ctx.contact.name, meeting: i.config.meetingTitle, time });
        }
      }
      if (text) {
        await i.rpc('fo_log_outbound', { ...a, contact: job.contact, message: text, agent_name: 'setter', prompt });
        sent = ctx.contact.phone ? (await i.send(ctx.contact.phone, text)).sent : (await i.email!(ctx.contact.email as string, `${i.config.businessName}: ${job.kind.startsWith('reminder') ? 'your booking' : 'following up'}`, text)).sent;
        note = sent ? 'Sent' : 'Logged (live sending off)';
        if (next) await i.rpc('fo_schedule_job', { ...a, contact: job.contact, job_kind: next.kind, job_step: next.step, due: iso(i.now + next.gap), appointment: null });
      }
    } catch (e) {
      outcome = 'failed'; note = e instanceof Error ? e.message.slice(0, 200) : 'Failed';
    }
    await i.rpc('fo_finish_job', { ...a, job: job.id, outcome, note });
    out.push({ id: job.id, kind: job.kind, outcome, note, sent });
  }
  return out;
}

/** Constant-time check of the runner's Authorization: Bearer header. */
export function bearerMatches(header: string | null, secret: string): boolean {
  const got = Buffer.from(header?.match(/^Bearer (.+)$/)?.[1] ?? ''), want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Every channel the runner should work through. Jobs belong to the channel the lead came in on, so each configured
 * channel (SMS, website chat, email, voice) is claimed separately. Invalid or missing pairs are skipped; duplicates removed. */
export function runnerChannels(env: Record<string, string | undefined>): { name: string; auth: ChannelAuth }[] {
  const pairs: [string, string, string][] = [['sms', 'FRONT_OFFICE_CHANNEL_ID', 'FRONT_OFFICE_CHANNEL_KEY'], ['web-chat', 'FRONT_OFFICE_CHAT_CHANNEL_ID', 'FRONT_OFFICE_CHAT_CHANNEL_KEY'], ['email', 'FRONT_OFFICE_EMAIL_CHANNEL_ID', 'FRONT_OFFICE_EMAIL_CHANNEL_KEY'], ['voice', 'FRONT_OFFICE_VOICE_CHANNEL_ID', 'FRONT_OFFICE_VOICE_CHANNEL_KEY']];
  const out: { name: string; auth: ChannelAuth }[] = [];
  for (const [name, idKey, keyKey] of pairs) {
    const channel = (env[idKey] ?? '').trim(), key = (env[keyKey] ?? '').trim();
    if (UUID_RE.test(channel) && key.length >= 32 && !out.some(o => o.auth.channel === channel)) out.push({ name, auth: { channel, key } });
  }
  return out;
}

/** Runner secrets that are long enough to trust: Vercel Cron's CRON_SECRET and our own FRONT_OFFICE_CRON_SECRET. */
export function runnerSecrets(env: Record<string, string | undefined>): string[] {
  return [env.CRON_SECRET, env.FRONT_OFFICE_CRON_SECRET].map(s => (s ?? '').trim()).filter(s => s.length >= 32);
}

/** True when the Authorization header carries any configured runner secret (each compared in constant time). */
export function runnerAuthorized(header: string | null, secrets: string[]): boolean {
  let ok = false;
  for (const s of secrets) if (bearerMatches(header, s)) ok = true;
  return ok;
}

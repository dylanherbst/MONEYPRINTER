// The orchestrator (tracker 0.2): every inbound event comes through here. It records the event against the one shared
// contact record, applies opt-out, decides which agent owns the contact, and logs the dispatch. Agents (Phase 1+) plug in
// behind routeByState; until then the contact is recorded and routed, and only system messages are sent.
import { isOptIn, isOptOut, OPT_OUT_CONFIRMATION, OPT_OUT_PROMPT_VERSION } from './opt-out';
import { routeByState } from './router';
import type { Route } from './router';
import { isContactState } from './state';
import type { ContactState } from './state';
import type { InboundSms } from './twilio';

/** A Supabase-style RPC call: resolves with data or rejects with an Error. */
export type Rpc = (fn: string, args: Record<string, unknown>) => Promise<unknown>;
export type ChannelAuth = { channel: string; key: string };
export type InboundResult = {
  contact: string; state: ContactState; created: boolean; duplicate: boolean; optedOut: boolean;
  route: Route; reply: string | null;
};

export const OPT_IN_CONFIRMATION = 'You are subscribed again. Reply STOP at any time to opt out.';
export const OPT_IN_PROMPT_VERSION = 'system/opt-in-confirmation@1';

export async function handleInboundSms(rpc: Rpc, auth: ChannelAuth, sms: InboundSms): Promise<InboundResult> {
  const optOut = isOptOut(sms.body), optIn = !optOut && isOptIn(sms.body);
  const raw = await rpc('fo_ingest_sms', {
    channel: auth.channel, channel_key: auth.key, from_number: sms.from, to_number: sms.to,
    message: sms.body, msg_id: sms.messageSid, opt_out: optOut, opt_in: optIn,
  }) as Record<string, unknown>;
  if (!raw || typeof raw.contact !== 'string' || !isContactState(raw.state)) throw new Error('Unexpected ingest result.');
  const base = { contact: raw.contact, state: raw.state, created: raw.created === true, duplicate: raw.duplicate === true, optedOut: raw.optedOut === true };
  const route = routeByState(base.state, base.optedOut);
  // A Twilio retry of a message already handled: answer the same way, record nothing twice.
  if (base.duplicate) return { ...base, route, reply: null };
  if (route.agent) await rpc('fo_log_dispatch', { channel: auth.channel, channel_key: auth.key, contact: base.contact, agent_name: route.agent, reason: route.reason });
  let reply: string | null = null;
  if (optOut && base.optedOut) reply = OPT_OUT_CONFIRMATION;
  else if (optIn && !base.optedOut) reply = OPT_IN_CONFIRMATION;
  if (reply) {
    // Logged before it is sent (tracker 0.6).
    await rpc('fo_log_outbound', { channel: auth.channel, channel_key: auth.key, contact: base.contact, message: reply, agent_name: 'system', prompt: reply === OPT_OUT_CONFIRMATION ? OPT_OUT_PROMPT_VERSION : OPT_IN_PROMPT_VERSION });
  }
  return { ...base, route, reply };
}

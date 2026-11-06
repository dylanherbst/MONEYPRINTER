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

/** Agents that can take a turn after the dispatch. Each is called at most once per new inbound message. */
/** sales: called for booked contacts; not passed by any live route until the owner approves the Sales agent. */
export type AgentHooks = { setter?: (contact: string) => void; sales?: (contact: string) => void };

export async function handleInboundSms(rpc: Rpc, auth: ChannelAuth, sms: InboundSms, agents: AgentHooks = {}): Promise<InboundResult> {
  return handleInbound(rpc, auth, { via: 'sms', sender: sms.from, to: sms.to, body: sms.body, messageId: sms.messageSid }, agents);
}

/** One inbound message on any channel: SMS (fo_ingest_sms), web chat or email (fo_ingest). */
/** checkText: the words checked for STOP/START when the stored body has extra framing (an email's subject line). */
export type InboundMessage = { via: 'sms' | 'web-chat' | 'email' | 'instagram' | 'messenger'; sender: string; to?: string; body: string; messageId: string; checkText?: string };
export async function handleInbound(rpc: Rpc, auth: ChannelAuth, m: InboundMessage, agents: AgentHooks = {}): Promise<InboundResult> {
  const words = m.checkText ?? m.body;
  const optOut = isOptOut(words), optIn = !optOut && isOptIn(words);
  const raw = (m.via === 'sms'
    ? await rpc('fo_ingest_sms', { channel: auth.channel, channel_key: auth.key, from_number: m.sender, to_number: m.to, message: m.body, msg_id: m.messageId, opt_out: optOut, opt_in: optIn })
    : await rpc('fo_ingest', { channel: auth.channel, channel_key: auth.key, sender: m.sender, message: m.body, msg_id: m.messageId, opt_out: optOut, opt_in: optIn })) as Record<string, unknown>;
  if (!raw || typeof raw.contact !== 'string' || !isContactState(raw.state)) throw new Error('Unexpected ingest result.');
  const base = { contact: raw.contact, state: raw.state, created: raw.created === true, duplicate: raw.duplicate === true, optedOut: raw.optedOut === true };
  const route = routeByState(base.state, base.optedOut);
  // A retry of a message already handled: answer the same way, record nothing twice.
  if (base.duplicate) return { ...base, route, reply: null };
  if (route.agent) await rpc('fo_log_dispatch', { channel: auth.channel, channel_key: auth.key, contact: base.contact, agent_name: route.agent, reason: route.reason });
  let reply: string | null = null;
  if (optOut && base.optedOut) reply = OPT_OUT_CONFIRMATION;
  else if (optIn && !base.optedOut) reply = OPT_IN_CONFIRMATION;
  if (reply) {
    // Logged before it is sent (tracker 0.6).
    await rpc('fo_log_outbound', { channel: auth.channel, channel_key: auth.key, contact: base.contact, message: reply, agent_name: 'system', prompt: reply === OPT_OUT_CONFIRMATION ? OPT_OUT_PROMPT_VERSION : OPT_IN_PROMPT_VERSION });
  }
  // System replies (opt-out, opt-in) end the turn; otherwise the owning agent replies on its own.
  if (!reply && route.agent === 'setter' && agents.setter) agents.setter(base.contact);
  if (!reply && route.agent === 'sales' && agents.sales) agents.sales(base.contact);
  return { ...base, route, reply };
}

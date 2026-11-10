import { createSupabaseClient } from '../../../../lib/supabase/client';
import { apiReply } from '../../../../lib/workspace-route';
import type { OpenedWorkspace } from '../../../../lib/workspace-route';
import { createSupabasePendingActionStore, PendingActionError } from '../../../../lib/front-office/pending-actions';
import type { ActionExecutor, PendingActionRecord, PendingActionStore } from '../../../../lib/front-office/pending-actions';
import type { Rpc } from '../../../../lib/front-office/orchestrator';
import { createJobsExecutor, runnerChannels } from '../../../../lib/front-office/jobs';
import { createSetterExecutor } from '../../../../lib/front-office/setter/actions';
import { loadSetter } from '../../../../lib/front-office/settings';
import { senderFromEnv } from '../../../../lib/front-office/sms-send';
import { googleCalendar, googleConfigFromEnv } from '../../../../lib/front-office/calendar/google';

// Shared by the approval-queue routes (task A-21). Not a route file: Next only treats route.ts as a route.

/** The owner's or member's queue, read and decided under their own session (RLS and the fo_* checks apply). */
export function memberStore(ws: OpenedWorkspace): PendingActionStore {
  const rpc: Rpc = async (fn, args) => { const r = await ws.db.rpc(fn, args); if (r.error) throw new Error(r.error.message); return r.data; };
  return createSupabasePendingActionStore({ rpc, workspaceId: ws.workspace });
}

/** What the owner sees for one item. The idempotency key and channel id stay on the server; an invalid payload is hidden. */
export function publicItem(a: PendingActionRecord) {
  return {
    id: a.id, product: a.product, contactId: a.contactId, callId: a.callId, mode: a.mode, payload: a.invalid ? null : a.payload,
    summary: a.summary, status: a.status, createdAt: a.createdAt, expiresAt: a.expiresAt, decidedAt: a.decidedAt, decidedBy: a.decidedBy,
    note: a.note, committedAt: a.committedAt, invalid: a.invalid,
  };
}

/** Maps a queue error to a safe reply. Not found and another business's item get the same generic 403. */
export function queueError(e: unknown) {
  if (e instanceof PendingActionError) {
    if (e.code === 'forbidden' || e.code === 'not_found') return apiReply('no_workspace_access', 'Workspace access is unavailable.');
    if (e.code === 'invalid') return apiReply('invalid_request', 'Invalid request.');
    if (e.code === 'conflict') return apiReply('conflict', e.message);
  }
  return apiReply('storage_unavailable', 'The approval queue is not available right now.');
}

/** Why an approved item cannot be performed from here right now (so it stays pending), or null when it can. */
export function cannotPerform(a: PendingActionRecord, env: Record<string, string | undefined>): string | null {
  if (a.product !== 'setter') return 'Approving Receptionist actions from here is not switched on yet. The item is still waiting.';
  if (a.invalid) return null; // approving closes it as failed; it is never performed
  if (!runnerChannels(env).some(c => c.auth.channel === a.channelId)) return 'The channel this action came from is not connected here, so it cannot be performed yet. The item is still waiting.';
  return null;
}

/** Performs an approved Setter item through the same executor as a direct action, on the channel it came from.
 * Texts go through senderFromEnv(): a dry run unless FRONT_OFFICE_SEND_LIVE is on. */
export function approvalExecutor(env: Record<string, string | undefined>): ActionExecutor {
  return async action => {
    const c = runnerChannels(env).find(x => x.auth.channel === action.channelId);
    if (!c) return { ok: false, note: 'The channel for this action is not connected, so nothing was done.' };
    const db = createSupabaseClient();
    const rpc: Rpc = async (fn, args) => { const r = await db.rpc(fn, args); if (r.error) throw new Error(r.error.message); return r.data; };
    const gcal = googleConfigFromEnv(env);
    const config = (await loadSetter(rpc, c.auth)).config;
    const setter = createSetterExecutor({ rpc, auth: c.auth, calendar: gcal ? googleCalendar(gcal) : null, config, now: Date.now(), send: senderFromEnv(env) });
    return createJobsExecutor(setter)(action);
  };
}

'use server';
// Server actions for the Setter Test Lab. The lab state lives in the browser and comes back with each call; it holds
// only the in-memory tables of this one test conversation. Nothing is sent, booked in a real calendar or stored.
// Scripted model only: anyone can call these actions without signing in, so no paid model is ever reachable from here.
// Any model choice sent by the client is ignored.
import { checkedLab, decideLabAction, newLab, runLabTurn } from '../../../lib/front-office/setter/lab';
import type { LabState } from '../../../lib/front-office/setter/lab';
import { isOperatingMode } from '../../../lib/front-office/contracts';
import type { OperatingMode } from '../../../lib/front-office/contracts';

export type LabResult = { state: LabState | null; error: string | null };
const fail = (e: unknown): LabResult => ({ state: null, error: e instanceof Error ? e.message.slice(0, 300) : 'The lab failed.' });

export async function startLab(mode: OperatingMode): Promise<LabResult> {
  return { state: newLab(isOperatingMode(mode) ? mode : 'owner_approval'), error: null };
}

export async function sendMessage(state: LabState, message: string, mode: OperatingMode): Promise<LabResult> {
  try {
    const s = checkedLab(state);
    return { state: await runLabTurn(s, { message: typeof message === 'string' ? message : '', mode: isOperatingMode(mode) ? mode : s.mode }), error: null };
  } catch (e) { return fail(e); }
}

export async function decideAction(state: LabState, id: string, decision: 'approve' | 'reject'): Promise<LabResult> {
  try {
    if (decision !== 'approve' && decision !== 'reject') throw new Error('Decision must be approve or reject.');
    return { state: await decideLabAction(checkedLab(state), typeof id === 'string' ? id : '', decision), error: null };
  } catch (e) { return fail(e); }
}

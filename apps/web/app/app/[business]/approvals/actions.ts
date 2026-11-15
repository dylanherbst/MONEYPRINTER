'use server';
// The one server action this page adds. It holds no rules: `runApprovalsOp` (see _server/approvals-guard.ts) checks the request and
// calls the automation service's decide / setMode / setCap. The workspace and the actor are the server's own constants; the op from
// the browser only names an approval, a decision, an area, a mode or a number.
import { automationSource } from './_server/source';
import { runApprovalsOp } from './_server/approvals-guard';
import type { ApprovalsReply } from './_server/approvals-guard';
import { availability, OWNER, runtime, WORKSPACE } from '../../../start/_server/runtime';

export async function approvalsAction(businessId: string, rawOp: unknown): Promise<ApprovalsReply> {
  return runApprovalsOp({ availability: availability(), rt: runtime, deps: { automation: automationSource(), workspaceId: WORKSPACE, actorUserId: OWNER } }, businessId, rawOp);
}

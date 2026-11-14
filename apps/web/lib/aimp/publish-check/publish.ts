// publishWithCheck (AMP-035, D03): publish through the real site-versions API, smoke-test what went live, and undo it if the test fails.
// Undo rule: previously published version -> roll back to it; nothing was published before -> pause (the store goes back to unpublished).
// A failed undo is never swallowed: the result says the store may still be live and what to do.
import type { Actor, SiteVersionStore } from '../site-versions/store.ts';
import { describeFailures, runPublishCheck, type CheckFail, type CheckPass, type PublishCheckDeps } from './check.ts';

export type PublishSiteApi = Pick<SiteVersionStore, 'publish' | 'rollback' | 'pause' | 'history' | 'resolvePublished'>;

export interface PublishWithCheckDeps {
  versions: PublishSiteApi;
  check: PublishCheckDeps;
}
export interface PublishWithCheckInput {
  actor: Actor;
  businessId: string;
  storeSlug: string;
  note?: string;
  expectedRevision?: number;
}

export type PublishOutcome = 'published' | 'rolled_back' | 'unpublished' | 'rollback_failed' | 'not_published' | 'unchanged_check_failed';
export type PublishWithCheckResult =
  | { ok: true; outcome: 'published'; version: number; checks: CheckPass[]; skipped: CheckPass[] }
  | { ok: false; outcome: Exclude<PublishOutcome, 'published'>; message: string; failed: CheckFail[]; version?: number; rolledBackTo?: number; rollbackErrors?: string[] };

const stop = (outcome: 'not_published', message: string, errors: string[] = []): PublishWithCheckResult =>
  ({ ok: false, outcome, message: [message, ...errors].join(' '), failed: [{ check: 'publish', reason: message }] });

export async function publishWithCheck(deps: PublishWithCheckDeps, input: PublishWithCheckInput): Promise<PublishWithCheckResult> {
  const { versions } = deps;
  const { actor, businessId, storeSlug } = input;

  const before = await versions.history(actor, storeSlug);
  if (!before.ok) return stop('not_published', 'Nothing was published.', before.errors);
  const previous = before.value.liveVersion;
  // Paused (by the owner, or by us after a failed first publish): a new version would not be visible, so the check could not mean anything.
  if (before.value.paused) return stop('not_published', 'Your store is paused, so nothing was published. Resume it, then publish again.');

  const pub = await versions.publish(actor, storeSlug, { note: input.note, expectedRevision: input.expectedRevision });
  if (!pub.ok) return stop('not_published', 'Nothing was published and your live store has not changed.', pub.errors);
  const unchanged = pub.value.unchanged === true;
  const version = pub.value.version;

  let result;
  try { result = await runPublishCheck(deps.check, { workspaceId: actor.workspaceId, businessId, storeSlug, versionId: version }); }
  catch { result = { ok: false as const, failed: [{ check: 'check', reason: 'The publish check could not run.' }], checks: [], skipped: [] }; }
  if (result.ok) return { ok: true, outcome: 'published', version, checks: result.checks, skipped: result.skipped };

  const why = describeFailures(result.failed);
  // Publishing changed nothing (the draft equalled the live version): there is nothing of ours to undo.
  if (unchanged) {
    return { ok: false, outcome: 'unchanged_check_failed', version, failed: result.failed, message: `Nothing new was published, but the live store has a problem. ${why}` };
  }

  if (previous !== null) {
    const rb = await versions.rollback(actor, storeSlug, previous, { note: `Automatic rollback: version ${version} failed its publish check` });
    if (rb.ok) {
      const now = await versions.resolvePublished(storeSlug);
      if (now.status === 'live') {
        return { ok: false, outcome: 'rolled_back', version, rolledBackTo: previous, failed: result.failed, message: `Publishing was undone and version ${previous} is live again. ${why}` };
      }
      return rollbackFailed(version, result.failed, why, ['The earlier version did not come back after the rollback.']);
    }
    return rollbackFailed(version, result.failed, why, rb.errors);
  }

  const p = await versions.pause(actor, storeSlug);
  if (p.ok) {
    const now = await versions.resolvePublished(storeSlug);
    if (now.status === 'paused') {
      return { ok: false, outcome: 'unpublished', version, failed: result.failed, message: `Publishing was undone and your store is not public (it is paused). Fix the problem, resume the store and publish again. ${why}` };
    }
    return rollbackFailed(version, result.failed, why, ['The store is still reachable after it was paused.']);
  }
  return rollbackFailed(version, result.failed, why, p.errors);
}

function rollbackFailed(version: number, failed: CheckFail[], why: string, errors: string[]): PublishWithCheckResult {
  return {
    ok: false, outcome: 'rollback_failed', version, failed, rollbackErrors: errors,
    message: `Version ${version} failed its check and could NOT be taken down automatically, so it may still be live. Pause the store or restore an earlier version now. ${why}`,
  };
}

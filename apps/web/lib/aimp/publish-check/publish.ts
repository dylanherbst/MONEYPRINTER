// publishWithCheck (AMP-035, D03; fixes AMP-098): publish through the real site-versions API, smoke-test what went live, and undo it if the test fails.
// Undo rule: previously published version -> roll back to it; nothing was published before -> pause (the store goes back to unpublished).
// A failed undo is never swallowed: the result says the store may still be live and what to do. Nothing in here throws to the caller.
// One publish per store at a time (in this process), and the undo only touches the store while OUR version is still the live one.
// Crash safety: every version published here carries PUBLISH_MARK in its note. If a run died after a failed check but before the
// undo, a retry sees the unchanged, marked, failing live version and undoes it instead of leaving it live.
import type { Actor, FailCode, SiteVersionStore } from '../site-versions/store.ts';
import { describeFailures, runPublishCheck, type CheckFail, type CheckPass, type PublishCheckDeps } from './check.ts';

export type PublishSiteApi = Pick<SiteVersionStore, 'publish' | 'rollback' | 'pause' | 'history' | 'resolvePublished' | 'getVersion'>;

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

/** Written into the note of every version this module publishes, so a retry can tell it is one of ours. */
export const PUBLISH_MARK = '[publish-check]';
const NOTE_MAX = 200;

export type PublishOutcome = 'published' | 'rolled_back' | 'unpublished' | 'rollback_failed' | 'not_published' | 'unchanged_check_failed';
export type PublishWithCheckResult =
  | { ok: true; outcome: 'published'; version: number; checks: CheckPass[]; skipped: CheckPass[] }
  | {
    ok: false; outcome: Exclude<PublishOutcome, 'published'>; message: string; failed: CheckFail[];
    /** What did pass and what was not tested, kept so the owner can see the whole picture, not only the failures. */
    checks: CheckPass[]; skipped: CheckPass[];
    version?: number; rolledBackTo?: number; rollbackErrors?: string[];
    /** true: nothing is wrong with the store, trying again later can work (conflict, "please try again"). */
    retryable: boolean;
  };

const RETRYABLE: FailCode[] = ['conflict', 'failed'];

const stop = (message: string, errors: string[] = [], retryable = false): PublishWithCheckResult =>
  ({ ok: false, outcome: 'not_published', message: [message, ...errors].join(' '), failed: [{ check: 'publish', reason: message }], checks: [], skipped: [], retryable });

// One publish per store at a time: the next one starts when the previous has fully finished (including its undo).
const queues = new Map<string, Promise<void>>();
async function exclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const before = queues.get(key) ?? Promise.resolve();
  const run = before.then(fn);
  const tail = run.then(() => undefined, () => undefined);
  queues.set(key, tail);
  try { return await run; } finally { if (queues.get(key) === tail) queues.delete(key); }
}

function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}

export async function publishWithCheck(deps: PublishWithCheckDeps, input: PublishWithCheckInput): Promise<PublishWithCheckResult> {
  try {
    const key = `${input?.actor?.workspaceId ?? ''}/${input?.storeSlug ?? ''}`;
    return await exclusive(key, () => publishOnce(deps, input));
  } catch {
    // publishOnce handles its own failures; this is the last line so the caller never sees a throw.
    return stop('Publishing stopped unexpectedly, so the store may or may not have changed. Check the live store before publishing again.', [], true);
  }
}

async function publishOnce(deps: PublishWithCheckDeps, input: PublishWithCheckInput): Promise<PublishWithCheckResult> {
  const { versions } = deps;
  const { actor, businessId, storeSlug } = input;

  const userNote = (input.note ?? '').trim();
  const note = userNote ? `${userNote} ${PUBLISH_MARK}` : PUBLISH_MARK;
  if (note.length > NOTE_MAX) return stop(`The note must be at most ${NOTE_MAX - PUBLISH_MARK.length - 1} characters. Nothing was published.`);

  let before;
  try { before = await versions.history(actor, storeSlug); } catch { return stop('Nothing was published: the store could not be read. Please try again.', [], true); }
  if (!before.ok) return stop('Nothing was published.', before.errors, RETRYABLE.includes(before.code));
  const previous = before.value.liveVersion;
  // Paused (by the owner, or by us after a failed first publish): a new version would not be visible, so the check could not mean anything.
  if (before.value.paused) return stop('Your store is paused, so nothing was published. Resume it, then publish again.');

  let pub;
  try { pub = await versions.publish(actor, storeSlug, { note, expectedRevision: input.expectedRevision }); }
  catch { return stop('Publishing stopped unexpectedly, so the store may or may not have changed. Please try again.', [], true); }
  if (!pub.ok) return stop('Nothing was published and your live store has not changed.', pub.errors, RETRYABLE.includes(pub.code));
  const unchanged = pub.value.unchanged === true;
  const version = pub.value.version;

  let result;
  try { result = await runPublishCheck(deps.check, { workspaceId: actor.workspaceId, businessId, storeSlug, versionId: version }); }
  catch { result = { ok: false as const, failed: [{ check: 'check', reason: 'The publish check could not run.' }], checks: [], skipped: [] }; }
  if (result.ok) return { ok: true, outcome: 'published', version, checks: result.checks, skipped: result.skipped };

  const why = describeFailures(result.failed);
  const lists = { failed: result.failed, checks: result.checks, skipped: result.skipped, retryable: false };

  // Which version should the store go back to? A normal run: the one that was live before. A retry (draft equals live):
  // the live version is already published, so it is ours to undo only if an earlier run of this check published it (its note says so).
  let target: number | null = previous;
  if (unchanged) {
    const ours = pub.value.source.kind === 'publish' && pub.value.note.includes(PUBLISH_MARK);
    if (!ours) {
      // Publishing changed nothing and we did not publish this version: there is nothing of ours to undo.
      return { ok: false, outcome: 'unchanged_check_failed', version, ...lists, message: `Nothing new was published, but the live store has a problem. ${why}` };
    }
    target = version > 1 ? version - 1 : null;
  }

  const fail = (errors: string[], superseded = false): PublishWithCheckResult => rollbackFailed(version, lists, why, errors, superseded);

  // Only undo while our version is still what the store serves. If something else went live meanwhile, leave it alone.
  let liveNow: number | null;
  try {
    const h = await versions.history(actor, storeSlug);
    if (!h.ok) return fail(h.errors.length ? h.errors : ['The store could not be read before undoing the publish.']);
    liveNow = h.value.liveVersion;
  } catch { return fail(['The store could not be read before undoing the publish.']); }
  if (liveNow !== version) return fail([`Version ${liveNow ?? 'none'} is live now, not version ${version}, so nothing was undone.`], true);

  if (target !== null) {
    let targetConfig: unknown;
    try { const g = await versions.getVersion(actor, storeSlug, target); if (g.ok) targetConfig = g.value.config; } catch { /* confirmed below: without it the content cannot be compared */ }
    let rb;
    try { rb = await versions.rollback(actor, storeSlug, target, { note: `Automatic rollback: version ${version} failed its publish check` }); }
    catch { return fail(['The rollback stopped unexpectedly.']); }
    if (!rb.ok) return fail(rb.errors);
    let now;
    try { now = await versions.resolvePublished(storeSlug); } catch { return fail(['The store could not be checked after the rollback.']); }
    if (now.status !== 'live') return fail(['The earlier version did not come back after the rollback.']);
    if (now.version !== rb.value.version) return fail([`Version ${now.version} is live after the rollback instead of the restored version.`]);
    if (targetConfig === undefined) return fail([`Version ${target} could not be read, so the restored content could not be confirmed.`]);
    if (stable(now.config) !== stable(targetConfig)) return fail([`The live content is not the same as version ${target} after the rollback.`]);
    return { ok: false, outcome: 'rolled_back', version, rolledBackTo: target, ...lists, message: `Publishing was undone and version ${target} is live again. ${why}` };
  }

  let p;
  try { p = await versions.pause(actor, storeSlug); } catch { return fail(['Pausing the store stopped unexpectedly.']); }
  if (!p.ok) return fail(p.errors);
  let now;
  try { now = await versions.resolvePublished(storeSlug); } catch { return fail(['The store could not be checked after it was paused.']); }
  if (now.status !== 'paused') return fail(['The store is still reachable after it was paused.']);
  return { ok: false, outcome: 'unpublished', version, ...lists, message: `Publishing was undone and your store is not public (it is paused). Fix the problem, resume the store and publish again. ${why}` };
}

function rollbackFailed(version: number, lists: { failed: CheckFail[]; checks: CheckPass[]; skipped: CheckPass[] }, why: string, errors: string[], superseded = false): PublishWithCheckResult {
  return {
    ok: false, outcome: 'rollback_failed', version, ...lists, retryable: false, rollbackErrors: errors,
    message: superseded
      ? `Version ${version} failed its check, but another version went live since, so it was not undone automatically. Look at your live store now. ${why}`
      : `Version ${version} failed its check and could NOT be taken down automatically, so it may still be live. Pause the store or restore an earlier version now. ${why}`,
  };
}

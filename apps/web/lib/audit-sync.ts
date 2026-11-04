import { restoreAudit } from './ventra-workspace.ts';

/** The manual growth audit is one JSON object under a fixed key; the account copy is the same object. Throws if it is invalid. */
export function checkAuditRaw(raw: string): void {
  let audit;
  try { audit = restoreAudit(raw); } catch { throw new Error('Growth audit is not valid. Your local copy is unchanged.'); }
  if (!audit || !audit.assessment.trim()) throw new Error('Growth audit is not valid. Your local copy is unchanged.');
}

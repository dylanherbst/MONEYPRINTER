// The checks and the one operation behind `exportCalendarAction`, as plain functions so the node tests run exactly what the page runs
// (actions.ts imports Next-only modules). Order, same as the sibling pages: demo storage on, valid business id, known business, the
// runtime has a campaign store and an asset store. Then the campaign to export is LOOKED UP on the server for the checked workspace and
// business: the request names no campaign, so there is no id a caller could point at another business's campaign. The campaign-assets
// service (`exportCampaign`, AMP-051) then makes every real decision: it re-loads the approved campaign for the same scope, and only
// approved text that still passes its rules and has full web links leaves. Nothing here posts, schedules or publishes anything.
import { exportCampaign } from '../../../../../../lib/aimp/campaign-assets/export.ts';
import type { AssetIssue } from '../../../../../../lib/aimp/campaign-assets/types.ts';
import { getCampaign } from '../../../../../../lib/aimp/campaigns/service.ts';
import { isBusinessId } from '../../../../../start/journey.ts';
import { isKnownBusiness } from '../../../_server/overview.ts';
import type { MarketingContexts } from '../../_server/marketing.ts';
import { assetDeps, creativeStoresOf } from '../../creative/_server/creative.ts';
import { NOT_IN_DEMO, PUBLISHING_LABEL, piecesLabel } from '../view-model.ts';
import type { CalendarRuntime } from './calendar.ts';

export const NO_BUSINESS = 'We could not find that business.';
export const NO_STORE = `${NOT_IN_DEMO} Nothing was saved.`;
export const NO_APPROVED_PLAN = 'There is no approved marketing plan to save text from. Approve your plan on the Marketing page first.';
export const NO_DRAFTS = 'The text for this plan has not been written yet, so there is nothing to save. Write and approve it in Creative Studio first.';
export const OLD_PLAN = 'Your marketing plan has a newer approved version than the text you have, so nothing was saved. Write the text again in Creative Studio first.';
export const NOTHING_APPROVED = 'Nothing is approved yet, so there is nothing to save. Approve at least one draft in Creative Studio first.';
export const NEEDS_FIXES = 'An approved draft no longer passes the rules shown in Creative Studio, so nothing was saved. Edit it and approve it again first.';
export const NO_WEB_ADDRESS = 'Your store does not have a full web address yet, so the links would not work outside your store. Nothing was saved.';
export const NOT_DONE = 'That did not go through, so nothing was saved.';
export const WENT_WRONG = 'Something went wrong on our side, so no file was made. Reload the page and try again. Nothing was posted.';
export const exported = (n: number): string => `Your ZIP file with ${piecesLabel(n)} is ready to save. Nothing was posted.`;

export interface CalendarGuardInput {
  /** `availability()` from app/start/_server/runtime.ts. */
  availability: { available: boolean; reason: string };
  /** Read only after the demo switch has passed, so nothing is touched while demo storage is off. */
  rt: () => CalendarRuntime;
  ctx: Pick<MarketingContexts, 'workspaceId'>;
  now: () => Date;
}

export interface CalendarExportReply {
  ok: boolean;
  message: string;
  /** The ZIP file, base64, with the names of the files inside it. Null on every refusal. */
  file: { name: string; base64: string; files: string[] } | null;
  /** Always the plain "Not connected": an export never needs, and never uses, a publishing account. */
  publishing: typeof PUBLISHING_LABEL;
}

const no = (message: string): CalendarExportReply => ({ ok: false, message, file: null, publishing: PUBLISHING_LABEL });

function refusal(errors: AssetIssue[]): CalendarExportReply {
  switch (errors[0]?.code) {
    case 'campaign_not_approved': case 'scope': return no(NO_APPROVED_PLAN);
    case 'not_found': return no(NO_DRAFTS);
    case 'stale': return no(OLD_PLAN);
    case 'nothing_approved': return no(NOTHING_APPROVED);
    case 'needs_fixes': return no(NEEDS_FIXES);
    case 'links_not_absolute': return no(NO_WEB_ADDRESS);
    default: return no(NOT_DONE);
  }
}

/**
 * Guard, then export the checked business's own approved campaign. A refusal makes no file. Anything thrown on the way (a campaign or
 * draft read, the ZIP itself) becomes one plain reply; only the error's name is logged.
 */
export async function runCalendarExport(g: CalendarGuardInput, businessId: unknown, log: (message: string, detail: string) => void = console.error): Promise<CalendarExportReply> {
  try {
    return await runCalendarExportUnsafe(g, businessId);
  } catch (e) {
    log('[app calendar] export failed:', e instanceof Error ? e.name : 'unknown error');
    return no(WENT_WRONG);
  }
}

async function runCalendarExportUnsafe(g: CalendarGuardInput, businessId: unknown): Promise<CalendarExportReply> {
  if (!g.availability.available) return no(g.availability.reason);
  if (!isBusinessId(businessId)) return no(NO_BUSINESS);
  const rt = g.rt();
  if (!isKnownBusiness(rt, businessId)) return no(NO_BUSINESS);
  const stores = creativeStoresOf(rt);
  if (!stores) return no(NO_STORE);
  const scope = { workspaceId: g.ctx.workspaceId, businessId };
  const campaign = await getCampaign({ store: stores.campaigns }, scope);
  if (!campaign || campaign.status !== 'approved') return no(NO_APPROVED_PLAN);
  const r = await exportCampaign(assetDeps(rt, stores, g.now), scope, campaign.id);
  if (!r.ok) return refusal(r.errors);
  const n = r.counts.pins + r.counts.captions + r.counts.videoScripts + r.counts.seo;
  return { ok: true, message: exported(n), file: { name: r.fileName, base64: Buffer.from(r.zip).toString('base64'), files: r.files }, publishing: PUBLISHING_LABEL };
}

'use server';
// The one server action this page adds: a read-only preview. Saving and approving use the existing `brandAction`
// (app/start/actions.ts) unchanged. Same DEMO runtime and the same switch as /start and the overview.
import type { BrandEdits } from '../../../../lib/aimp/branding/types';
import { availability, brandCtx, checkBusiness, runtime } from '../../../start/_server/runtime';
import { previewBrandChange } from './_server/brand';
import type { BrandPreview } from './_server/brand';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export async function previewBrandAction(businessId: string, edits: unknown): Promise<BrandPreview> {
  const a = availability();
  if (!a.available) return { ok: false, errors: [{ field: 'brand', message: a.reason }] };
  if (!checkBusiness(businessId)) return { ok: false, errors: [{ field: 'businessId', message: 'We could not find that business.' }] };
  return previewBrandChange(runtime(), brandCtx, businessId, (isObj(edits) ? edits : {}) as BrandEdits);
}

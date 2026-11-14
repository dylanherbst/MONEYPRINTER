'use server';
// The one server action this page adds: "add a product". It builds nothing itself. It checks the request (see _server/create-guard.ts),
// then hands the business's saved idea to the existing `productsAction` (app/start/actions.ts), which builds the product, runs its
// checks and registers it. Archiving is not offered because the product service has no archive operation.
import { availability, runtime } from '../../../start/_server/runtime';
import { productsAction } from '../../../start/actions';
import { guardCreate } from './_server/create-guard';

export interface CreateProductReply { ok: boolean; message: string; errors: string[] }

export async function createProductAction(businessId: string): Promise<CreateProductReply> {
  const g = guardCreate({ availability: availability(), rt: runtime }, businessId);
  if (!g.ok) return { ok: false, message: g.message, errors: [] };
  const r = await productsAction(businessId, { kind: 'create', blueprintId: g.seed.blueprintId, inputs: g.seed.inputs });
  return { ok: r.ok, message: r.message, errors: r.errors };
}

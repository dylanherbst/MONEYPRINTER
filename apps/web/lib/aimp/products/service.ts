// Product validation, preview, approval, regeneration and versioning (AMP-022).
import { assessSpec, renderBuyerFile, sha256 } from './qa.ts';
import type { BuyerFile } from './qa.ts';
import { createMemoryProductStore } from './store.ts';
import { ProductError } from './types.ts';
import type { Ctx, ProductRecord, ProductStore, ProductVersion, VersionStatus } from './types.ts';
import type { ProductSpec } from '../factory/spec.ts';

export const MAX_REGENERATIONS = 5;

export interface ProductService {
  /** Create a product and its first version (v1), then run QA. Failed QA leaves the version in review as qa_failed. */
  createProduct(ctx: Ctx, input: { businessId: string; spec: ProductSpec }): Promise<{ product: ProductRecord; version: ProductVersion }>;
  /** New version from a freshly generated spec. Never touches an approved version. */
  regenerate(ctx: Ctx, productId: string): Promise<ProductVersion>;
  listVersions(ctx: Ctx, productId: string): Promise<ProductVersion[]>;
  /** Approve a QA-passed version and pin its hash. Supersedes the previously approved version. */
  approve(ctx: Ctx, versionId: string): Promise<ProductVersion>;
  /** The exact bytes buyers would receive for this version; refuses when they no longer match the recorded hash. */
  previewVersion(ctx: Ctx, versionId: string): Promise<BuyerFile & { version: number; status: VersionStatus }>;
  /** Exactly the approved, pinned version's bytes. Refuses on any hash mismatch. */
  getBuyerFile(ctx: Ctx, productId: string): Promise<BuyerFile & { version: number }>;
}

export interface ProductServiceDeps {
  store?: ProductStore;
  /** Produces a fresh spec for regeneration (production: generateProductSpec with the product's inputs). */
  generateSpec: (product: ProductRecord, previous: ProductSpec) => Promise<ProductSpec>;
  /** Injectable renderer so tests can prove tampering is refused. Defaults to the factory. */
  render?: (spec: ProductSpec) => BuyerFile;
  now?: () => Date;
  newId?: () => string;
  maxRegenerations?: number;
}

export function createProductService(deps: ProductServiceDeps): ProductService {
  const store = deps.store ?? createMemoryProductStore();
  const render = deps.render ?? renderBuyerFile;
  const now = () => (deps.now ?? (() => new Date()))().toISOString();
  let n = 0;
  const newId = deps.newId ?? (() => `prod-${Date.now().toString(36)}-${++n}`);
  const limit = deps.maxRegenerations ?? MAX_REGENERATIONS;

  const need = (ctx: Ctx) => { if (!ctx?.workspaceId) throw new ProductError('not_found', 'That product was not found.'); };
  async function getProduct(ctx: Ctx, id: string): Promise<ProductRecord> {
    need(ctx);
    const p = await store.getProduct(ctx.workspaceId, id);
    if (!p) throw new ProductError('not_found', 'That product was not found.');
    return p;
  }
  async function getVersion(ctx: Ctx, id: string): Promise<ProductVersion> {
    need(ctx);
    const v = await store.getVersion(ctx.workspaceId, id);
    if (!v) throw new ProductError('not_found', 'That version was not found.');
    return v;
  }

  async function addVersion(p: ProductRecord, spec: ProductSpec, version: number): Promise<ProductVersion> {
    const a = assessSpec(spec);
    const v: ProductVersion = {
      id: `${p.id}-v${version}`, productId: p.id, workspaceId: p.workspaceId, businessId: p.businessId, version,
      status: a.qaPassed ? 'in_review' : 'qa_failed',
      spec, fileHash: a.file?.hash ?? null, fileName: a.file?.fileName ?? null, fileBytes: a.file?.bytes.length ?? null,
      pageCount: a.pageCount, claimsOk: a.claimsOk, qa: a.qa, qaPassed: a.qaPassed,
      approvedHash: null, approvedAt: null, approvedBy: null, createdAt: now(),
    };
    await store.createVersion(v, version === 1 ? undefined : limit + 1);
    return v;
  }

  /** Re-render and check the bytes against a recorded hash. */
  function renderVerified(v: ProductVersion, expected: string): BuyerFile {
    const f = render(v.spec);
    if (sha256(f.bytes) !== expected || f.hash !== expected) {
      throw new ProductError('hash_mismatch', 'The file no longer matches the version that was checked, so it was not released.');
    }
    return f;
  }

  return {
    async createProduct(ctx, input) {
      need(ctx);
      const product: ProductRecord = { id: newId(), workspaceId: ctx.workspaceId, businessId: input.businessId, blueprintId: input.spec.blueprint.id, createdAt: now() };
      await store.createProduct(product);
      return { product, version: await addVersion(product, input.spec, 1) };
    },

    async regenerate(ctx, productId) {
      const p = await getProduct(ctx, productId);
      const all = await store.listVersions(ctx.workspaceId, productId);
      if (all.length - 1 >= limit) {
        throw new ProductError('regenerate_limit', `This product has already been regenerated ${limit} times. Keep one of the existing versions or start a new product.`);
      }
      const last = all[all.length - 1];
      if (!last) throw new ProductError('not_found', 'That product has no versions.');
      const spec = await deps.generateSpec(p, last.spec);
      return addVersion(p, spec, last.version + 1);
    },

    async listVersions(ctx, productId) {
      await getProduct(ctx, productId);
      return store.listVersions(ctx.workspaceId, productId);
    },

    async approve(ctx, versionId) {
      const v = await getVersion(ctx, versionId);
      if (v.status === 'approved' || v.status === 'superseded') throw new ProductError('immutable', 'That version is already approved or replaced and cannot be changed.');
      if (v.status === 'draft') throw new ProductError('not_in_review', 'This version has not been checked yet.');
      if (v.status !== 'in_review') {
        throw new ProductError('qa_not_passed', 'This version failed its checks and stays in review. Fix the problems and regenerate.', v.qa.flatMap((q) => q.reasons));
      }
      if (!v.qaPassed || v.qa.some((q) => !q.passed) || !v.fileHash) {
        throw new ProductError('qa_not_passed', 'Every check must pass before a version can be approved.', v.qa.flatMap((q) => q.reasons));
      }
      renderVerified(v, v.fileHash);
      // One atomic store step: approves this version and supersedes the previous one.
      return store.approveVersion(ctx.workspaceId, v.id, { approvedAt: now(), approvedBy: ctx.actorId ?? null });
    },

    async previewVersion(ctx, versionId) {
      const v = await getVersion(ctx, versionId);
      if (!v.fileHash) throw new ProductError('qa_not_passed', 'Nothing could be rendered for this version, so there is no file to preview.', v.qa.flatMap((q) => q.reasons));
      return { ...renderVerified(v, v.approvedHash ?? v.fileHash), version: v.version, status: v.status };
    },

    async getBuyerFile(ctx, productId) {
      await getProduct(ctx, productId);
      const approved = (await store.listVersions(ctx.workspaceId, productId)).filter((x) => x.status === 'approved');
      if (approved.length > 1) throw new ProductError('conflict', 'This product has more than one approved version, so no file was released.');
      const v = approved[0];
      if (!v || !v.approvedHash) throw new ProductError('not_approved', 'This product has no approved version yet.');
      return { ...renderVerified(v, v.approvedHash), version: v.version };
    },
  };
}

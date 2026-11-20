'use server';
// The three server actions of the Offer builder. Each checks the demo switch and that the business is known, then calls the pure
// builder in lib/aimp/offers. Nothing is published here: "approve" only marks the seller's product as ready for the shop.
import { availability, checkBusiness } from '../../../start/_server/runtime';
import { buildOffers, checkAnswers, checkContent, draftContent, specFromOffer, buyerGets, pageCount, offerFormats } from '../../../../lib/aimp/offers/build';
import type { Offer, OfferAnswers, OfferFormat, ProductContent } from '../../../../lib/aimp/offers/build';
import { getOfferState, setOfferState } from '../../../../lib/aimp/offers/store';
import { ProductFactoryError } from '../../../../lib/aimp/factory/generate';
import { renderProductPdf, renderSamplePdf } from '../../../../lib/aimp/factory/render';

export interface SuggestReply { ok: boolean; errors: string[]; offers: Offer[]; draft: ProductContent | null }
export interface PreviewReply { ok: boolean; errors: string[]; pages: number; buyerGets: string[]; sampleBase64: string | null; sampleName: string; priceMinor: number }

const gate = (business: string): string | null => {
  const a = availability();
  if (!a.available) return a.reason;
  return checkBusiness(business) ? null : 'We could not find that business.';
};
const asAnswers = (v: unknown): OfferAnswers => {
  const o = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
  const s = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '');
  return { knows: s('knows'), helps: s('helps'), problem: s('problem') };
};
const asContent = (v: unknown): ProductContent => {
  const o = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
  const list = (k: string) => (Array.isArray(o[k]) ? (o[k] as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 40) : []);
  return { steps: list('steps'), questions: list('questions') };
};

export async function suggestOffersAction(business: string, raw: unknown): Promise<SuggestReply> {
  const g = gate(business);
  if (g) return { ok: false, errors: [g], offers: [], draft: null };
  const answers = asAnswers(raw);
  const r = buildOffers(answers);
  if (!r.ok) return { ok: false, errors: r.errors, offers: [], draft: null };
  const prev = getOfferState(business);
  setOfferState(business, { ...prev, answers, approved: null });
  return { ok: true, errors: [], offers: r.offers, draft: draftContent(answers) };
}

function build(business: string, offerId: unknown, rawAnswers: unknown, rawContent: unknown) {
  const answers = asAnswers(rawAnswers), content = asContent(rawContent);
  if (typeof offerId !== 'string' || !offerFormats.includes(offerId as OfferFormat)) return { ok: false as const, errors: ['Pick one of the offers first.'] };
  const offers = buildOffers(answers);
  if (!offers.ok) return { ok: false as const, errors: offers.errors };
  const offer = offers.offers.find((o) => o.id === offerId)!;
  const errors = [...checkAnswers(answers), ...checkContent(content)];
  if (errors.length) return { ok: false as const, errors };
  try { return { ok: true as const, offer, answers, content, spec: specFromOffer(offer, answers, content) }; }
  catch (e) { return { ok: false as const, errors: e instanceof ProductFactoryError ? [e.message, ...e.problems] : ['The product could not be built.'] }; }
}

export async function previewProductAction(business: string, offerId: unknown, answers: unknown, content: unknown): Promise<PreviewReply> {
  const none = { pages: 0, buyerGets: [], sampleBase64: null, sampleName: '', priceMinor: 0 };
  const g = gate(business);
  if (g) return { ok: false, errors: [g], ...none };
  const b = build(business, offerId, answers, content);
  if (!b.ok) return { ok: false, errors: b.errors, ...none };
  const sample = renderSamplePdf(b.spec);
  setOfferState(business, { answers: b.answers, offerId: b.offer.id, content: b.content, approved: null });
  return { ok: true, errors: [], pages: pageCount(b.spec), buyerGets: buyerGets(b.spec), sampleBase64: Buffer.from(sample.bytes).toString('base64'), sampleName: sample.fileName, priceMinor: b.offer.testPriceMinor };
}

export async function approveProductAction(business: string, offerId: unknown, answers: unknown, content: unknown, priceMinor: unknown, confirmed: unknown): Promise<{ ok: boolean; message: string; errors: string[] }> {
  const g = gate(business);
  if (g) return { ok: false, message: g, errors: [] };
  if (confirmed !== true) return { ok: false, message: 'That was not confirmed, so nothing was approved.', errors: [] };
  if (typeof priceMinor !== 'number' || !Number.isInteger(priceMinor) || priceMinor < 500 || priceMinor > 20000) return { ok: false, message: 'Set a price between $5 and $200.', errors: [] };
  const b = build(business, offerId, answers, content);
  if (!b.ok) return { ok: false, message: 'Fix the problems first. Nothing was approved.', errors: b.errors };
  renderProductPdf(b.spec, 'a4'); // proves the full file builds before we say it is approved
  const prev = getOfferState(business);
  setOfferState(business, { answers: b.answers, offerId: b.offer.id, content: b.content, approved: { spec: b.spec, approvedAt: new Date().toISOString(), priceMinor, version: (prev.approved?.version ?? 0) + 1 } });
  return { ok: true, message: 'Approved. This is the file your buyers will get.', errors: [] };
}

// Single place for the public website's brand: rename here and every page follows. The owner set the name to
// AiMoneyPrinter on 15 Nov 2026 (it was the placeholder "Seedline"); a legal and Stripe name check is still open.
export const site = {
  name: 'AiMoneyPrinter',
  // Said with the name wherever it stands alone (page titles, link previews, the footer, ads), so the first thing anyone
  // reads is what the product does: it builds a side business with you. It makes no promise about money.
  descriptor: 'the side business builder',
  tagline: 'Side business quick start',
  workingName: false,
  domain: 'aimoneyprinter.com',
  supportEmail: 'hello@aiventra.com.au',
  // Who runs AiMoneyPrinter, for the Policies page. Empty until the owner confirms them (22 Nov 2026); the page shows
  // a clear placeholder instead of guessing.
  legal: { entityName: '', abn: '', contactEmail: '', state: 'Western Australia' },
  // Draft pricing hypotheses from the business plan §13.1, to be validated with pilot users. Never shown as final.
  plans: [
    { id: 'discover', name: 'Discover', priceAud: 0, blurb: 'Five researched business ideas and a sample preview.', includes: ['5 opportunity suggestions', 'Sample business preview', 'No card needed'] },
    { id: 'launch', name: 'Launch', priceAud: 79, blurb: 'One business, store, products, payments and automatic delivery.', includes: ['1 business and storefront', 'Product creation within monthly limits', 'Payments to your own Stripe account', 'Automatic file delivery'] },
    { id: 'autopilot', name: 'Autopilot', priceAud: 149, blurb: 'Launch plus approved social publishing and daily operator checks.', includes: ['Everything in Launch', 'Approved Pinterest publishing', 'Daily health checks and summaries'] },
    { id: 'scale', name: 'Scale', priceAud: 249, blurb: 'Higher limits and room for more than one business.', includes: ['Everything in Autopilot', 'Higher generation limits', 'Multiple businesses (coming)'] },
  ],
} as const;

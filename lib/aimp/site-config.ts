// Single place for the public website's brand and the addresses it links to. InsertAgentic (24 Nov 2026) replaces the
// InsertAgentic positioning: an Agentic AI team for Australian sole traders and small businesses.
//
// Addresses come from environment variables (see .env.example) so nothing points at an app, domain or contact that
// has not been confirmed. Empty values switch the site to its safe fallbacks: no canonical URLs and no indexing
// without a domain, early access instead of sign-up without an app, and placeholders on the Policies page.
const clean = (v: string | undefined) => (v ?? '').trim().replace(/\/+$/, '');

export const site = {
  name: 'InsertAgentic',
  // Said with the name wherever it stands alone (kicker, footer, link previews).
  descriptor: 'your Agentic AI team',
  title: 'InsertAgentic | Your Agentic AI Team for Small Businesses',
  description:
    'AI agents that answer enquiries, quote, chase payments and find where your business is losing money. You approve everything before it goes out.',
  /** Public domain, without https://. */
  domain: (clean(process.env.NEXT_PUBLIC_SITE_DOMAIN) || 'www.insertagentic.com').replace(/^https?:\/\//, ''),
  /** The InsertAgentic app (AIMONEYPRINTER-GROWTH deployment), e.g. https://app.insertagentic.com. Not deployed yet. */
  appUrl: clean(process.env.NEXT_PUBLIC_APP_URL),
  /** Where "Join the early access list" goes while the app is not live (a form or waitlist page). */
  earlyAccessUrl: clean(process.env.NEXT_PUBLIC_EARLY_ACCESS_URL),
  contactEmail: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL) || 'insertagentic@gmail.com',
  legal: {
    entityName: clean(process.env.NEXT_PUBLIC_LEGAL_ENTITY),
    abn: clean(process.env.NEXT_PUBLIC_LEGAL_ABN),
    state: 'Western Australia',
  },
} as const;

/** Full URL on the public domain, or undefined until the domain is set. */
export const siteUrl = (path = '/') => (site.domain ? `https://${site.domain}${path}` : undefined);

/** Search engines index the site only on the confirmed domain in production; previews stay noindex. */
export const indexable = Boolean(site.domain) && process.env.VERCEL_ENV === 'production';

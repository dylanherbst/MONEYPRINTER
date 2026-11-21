import type { Metadata, Viewport } from 'next';
import { site } from '../../lib/aimp/site-config';
import { startRoutes } from '../start/flow';
import { fontVars } from '../plant-lab/fonts';
import { CellsStage } from './cells-stage';
import { CTA, SIGNUP } from './content';
import './cells.css';

// The public home page (owner approved for production, 16 Nov 2026): the homepage story told with a cloud of cells
// that morphs as you scroll. aimoneyprinter.com serves it at / (next.config.mjs).
export const metadata: Metadata = {
  title: `${site.name}: ${site.descriptor} · ${site.tagline}`,
  description: `${site.tagline}. Pick an idea and AI drafts your first digital product, shop and launch content. You approve everything before it goes live. No promise of earnings.`,
  openGraph: {
    type: 'website', url: `https://${site.domain}/`, siteName: `${site.name}: ${site.descriptor}`,
    title: 'Start a side business without spending weeks building it',
    description: 'Pick an idea. AI drafts your first product, shop and launch content. You approve everything. Free to start.',
  },
  alternates: { canonical: `https://${site.domain}/` },
};
export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// The Tune panel is a design tool: shown on test versions, hidden on the live site unless the address has ?tune=1.
const TUNE_BY_DEFAULT = process.env.VERCEL_ENV !== 'production';

export default function CellsPage() {
  return (
    <div className={`cells ${fontVars}`} data-tone="light">
      <CellsStage tuneByDefault={TUNE_BY_DEFAULT} />

      <header className="cells-top">
        <a href="/" className="cells-logo" aria-label={site.name}>
          <img src="/brand/aimp-logo.webp" alt="" width={36} height={36} />
        </a>
        <nav className="cells-nav" aria-label="On this page">
          <a href="#how">How it works</a>
          <a href="/learn">Learn more</a>
          <a href="/learn#faqs">FAQs</a>
        </nav>
        <a href={`${startRoutes.account}?mode=login`} className="cells-signin">Sign in</a>
      </header>

      <main>
        <section className="cells-ch cells-ch-hero" data-chapter="field" aria-labelledby="cells-h1">
          <div className="cells-copy">
            <p className="cells-kicker"><span className="cells-dot" aria-hidden="true" />{site.name}: {site.descriptor}</p>
            <h1 id="cells-h1">Start a side business without spending weeks building it.</h1>
            <p className="cells-lede">AI researches the idea, makes the product and opens your shop. You approve every step before anything goes live.</p>
            <div className="cells-actions">
              <a className="cells-btn" href={SIGNUP}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
              <a className="cells-link" href="#how">See how it works</a>
            </div>
          </div>
          <div className="cells-points" aria-labelledby="cells-points-h">
            <p className="cells-label" id="cells-points-h">The next wave of online business</p>
            <ul>
              <li><b>40%</b><span>of people with a side business want to turn it into a full-time business</span></li>
              <li><b>US$59,000+</b><span>a month in revenue for the top 25% of established online stores</span></li>
              <li><b>US$258,000</b><span>a year in revenue for the average established online store</span></li>
            </ul>
            <p className="cells-source">Full-time goal: QuickBooks 2026 Entrepreneurship Study, 3,000 US adults, December 2025. Store revenue: profitable online stores 3+ years old listed for sale on Flippa, 2022–2024 (revenue, not profit). These are market figures, not {site.name} customer results or a promise of earnings.</p>
          </div>
        </section>

        {/* Not a chapter: while it is read the cells are still out of sight, gathering for step 1. */}
        <section className="cells-pain" aria-labelledby="cells-h-pain">
          <div className="cells-copy">
            <p className="cells-label">Start with the customer</p>
            <h2 id="cells-h-pain">A website is easy to launch. Finding customers is the hard part.</h2>
            <p className="cells-body">It&apos;s easy to spend weeks on a store, a logo and posts, then find out the offer doesn&apos;t solve a problem people care about. So we start with the customer, then build the business.</p>
          </div>
          <div className="cells-versus" role="list">
            <div className="cells-vs cells-vs-old" role="listitem"><span>The usual way</span><b>Build first, hope later</b></div>
            <div className="cells-vs cells-vs-new" role="listitem"><span>With {site.name}</span><b>Research first, test early</b></div>
          </div>
        </section>

        <section className="cells-ch cells-ch-low" data-chapter="vortex" id="how" aria-label="Find the gap">
          <div className="cells-stat">
            <p className="cells-label">Step 1 of 3 · Find the gap</p>
            <p className="cells-big">5</p>
            <p>business ideas from real customer problems, market signals and gaps competitors leave, with the sources to check them.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-mid" data-chapter="helix" aria-label="Build the offer">
          <div className="cells-stat">
            <p className="cells-label">Step 2 of 3 · Build the offer</p>
            <p className="cells-big">1</p>
            <p>clear offer to test: who it&apos;s for, what they get and a price, with the brand, product and shop made for it. Change anything, or do it yourself.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-top" data-chapter="horizon" aria-label="Launch and learn">
          <div className="cells-stat">
            <p className="cells-label">Step 3 of 3 · Launch and learn</p>
            <p className="cells-big">1st</p>
            <p>version goes out small, so you learn what people respond to before you spend more. Launch posts are drafted and checked; you approve before anything publishes.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-split" data-chapter="ring" aria-labelledby="cells-h-paid">
          <div className="cells-copy">
            <p className="cells-label">Getting paid</p>
            <h2 id="cells-h-paid">Money goes straight to your own Stripe account.</h2>
          </div>
          <div className="cells-copy cells-copy-low">
            <p>Every order is delivered automatically, once, with a download link that expires.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-split cells-ch-final" data-chapter="galaxy" aria-labelledby="cells-h-final">
          <div className="cells-copy">
            <h2 id="cells-h-final">Your next business starts with a problem worth solving.</h2>
          </div>
          <div className="cells-copy cells-copy-low">
            <a className="cells-btn" href={SIGNUP}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
            <p className="cells-more"><a href="/learn">Learn more</a><span aria-hidden="true">·</span><a href="/learn#faqs">FAQs</a></p>
          </div>
        </section>

      </main>
    </div>
  );
}

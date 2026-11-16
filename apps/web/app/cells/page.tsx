import type { Metadata, Viewport } from 'next';
import { site } from '../../lib/aimp/site-config';
import { primaryEntry } from '../../lib/aimp/entry';
import { startRoutes } from '../start/flow';
import { fontVars } from '../plant-lab/fonts';
import { CellsStage } from './cells-stage';
import './cells.css';

// UI test (ui/new-ui, 16 Nov 2026): the homepage story told with a cloud of cells that morphs as you scroll.
// Mobile first. Not linked from anywhere and not indexed while it is a test.
export const metadata: Metadata = {
  title: `${site.name}: ${site.descriptor} · new look test`,
  description: `${site.tagline}. Test of a new look.`,
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const START = startRoutes.welcome;

export default function CellsPage() {
  return (
    <div className={`cells ${fontVars}`} data-tone="light">
      <CellsStage />

      <header className="cells-top">
        <a href="/" className="cells-logo" aria-label={site.name}>
          <img src="/brand/aimp-logo.webp" alt="" width={36} height={36} />
        </a>
        <a href={`${startRoutes.account}?mode=login`} className="cells-signin">Sign in</a>
      </header>

      <main>
        <section className="cells-ch cells-ch-hero" data-chapter="field" aria-labelledby="cells-h1">
          <div className="cells-copy">
            <p className="cells-kicker"><span className="cells-dot" aria-hidden="true" />{site.name}: {site.descriptor}</p>
            <h1 id="cells-h1">Start a side business without spending weeks building it.</h1>
            <p className="cells-lede">AI researches the idea, makes the product and opens your shop. You approve every step before anything goes live.</p>
            <div className="cells-actions">
              <a className="cells-btn" href={START}>{primaryEntry.label}<span className="cells-go" aria-hidden="true">→</span></a>
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

        <section className="cells-ch cells-ch-low" data-chapter="vortex" id="how" aria-label="Ideas">
          <div className="cells-stat">
            <p className="cells-label">Step 1 of 3</p>
            <p className="cells-big">5</p>
            <p>business ideas researched around your time, budget and skills, with the sources to check them.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-mid" data-chapter="helix" aria-label="Build">
          <div className="cells-stat">
            <p className="cells-label">Step 2 of 3</p>
            <p className="cells-big">1</p>
            <p>brand, first product and shop made for the idea you pick. Change anything, or do it yourself.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-top" data-chapter="horizon" aria-label="Launch">
          <div className="cells-stat">
            <p className="cells-label">Step 3 of 3</p>
            <p className="cells-big">1st</p>
            <p>sale is what everything points at. Launch posts are drafted and checked before anything goes out; you approve, then they publish on time.</p>
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
            <h2 id="cells-h-final">A whole side business, already in motion.</h2>
          </div>
          <div className="cells-copy cells-copy-low">
            <a className="cells-btn" href={START}>{primaryEntry.label}<span className="cells-go" aria-hidden="true">→</span></a>
            <p className="cells-note">Free to start. We help you build and launch; we don&apos;t promise sales or income.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

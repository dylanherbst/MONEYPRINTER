import type { Metadata, Viewport } from 'next';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { fontVars } from '../plant-lab/fonts';
import { CellsStage } from './cells-stage';
import { CTA, SIGNUP } from './content';
import { SiteHeader } from './site-header';
import './cells.css';

// The public home page: the InsertAgentic story told with a cloud of cells that morphs as you scroll (served at /).
export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  openGraph: {
    type: 'website', url: siteUrl('/'), siteName: site.name,
    title: 'Grow your business without doing it all yourself',
    description: site.description,
  },
  alternates: siteUrl() ? { canonical: siteUrl('/') } : undefined,
  robots: indexable ? undefined : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// The Tune panel is a design tool: shown on test versions, hidden on the live site unless the address has ?tune=1.
const TUNE_BY_DEFAULT = process.env.VERCEL_ENV !== 'production';

export default function CellsPage() {
  return (
    <div className={`cells ${fontVars}`} data-tone="light">
      <CellsStage tuneByDefault={TUNE_BY_DEFAULT} />

      <SiteHeader current="/" />

      <main>
        <section className="cells-ch cells-ch-hero" data-chapter="field" aria-labelledby="cells-h1">
          <div className="cells-copy">
            <p className="cells-kicker"><span className="cells-dot" aria-hidden="true" />{site.name}: {site.descriptor}</p>
            <h1 id="cells-h1">Grow your business without doing it all yourself.</h1>
            <p className="cells-lede">Four AI agents working together to generate leads, grow your socials, create marketing campaigns and answer customer calls. Built for solo operators and small businesses.</p>
            <div className="cells-actions">
              <a className="cells-btn" href={SIGNUP}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
              <a className="cells-link" href="#how">See how it works</a>
            </div>
          </div>
          <div className="cells-points" aria-labelledby="cells-points-h">
            <p className="cells-label" id="cells-points-h">A smarter way to grow your business</p>
            <ul>
              <li><b>4 AI agents</b><span>Sales, social media, marketing and reception in one team.</span></li>
              <li><b>1 platform</b><span>Shared business knowledge, activity and approvals.</span></li>
              <li><b>Less admin</b><span>Your AI team handles approved growth tasks, so you spend more time with customers.</span></li>
            </ul>
            <p className="cells-source">The AI Receptionist is in development. Features depend on connected accounts, permissions and provider availability. Results are not guaranteed.</p>
          </div>
        </section>

        {/* Not a chapter: while it is read the cells are still out of sight, gathering for step 1. */}
        <section className="cells-pain" aria-labelledby="cells-h-pain">
          <div className="cells-copy">
            <p className="cells-label">Start with the opportunity</p>
            <h2 id="cells-h-pain">More marketing isn&apos;t always the answer. Better opportunities are.</h2>
            <p className="cells-body">{site.name} learns your business, researches competitors and identifies customer needs, then coordinates content, campaigns and sales conversations around the opportunities that matter.</p>
          </div>
          <div className="cells-versus" role="list">
            <div className="cells-vs cells-vs-old" role="listitem"><span>The usual way</span><b>Manage every task yourself</b></div>
            <div className="cells-vs cells-vs-new" role="listitem"><span>With {site.name}</span><b>One coordinated AI growth team</b></div>
          </div>
        </section>

        <section className="cells-ch cells-ch-low" data-chapter="vortex" id="how" aria-label="Understand">
          <div className="cells-stat">
            <p className="cells-label">Step 1 of 3 · Understand</p>
            <p className="cells-big">1</p>
            <p>business profile: import your website, services and brand, then confirm what you want to achieve.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-mid" data-chapter="helix" aria-label="Activate">
          <div className="cells-stat">
            <p className="cells-label">Step 2 of 3 · Activate</p>
            <p className="cells-big">4</p>
            <p>AI agents, one team: Sales, Socials, Marketing and Receptionist work from the same business knowledge.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-top" data-chapter="horizon" aria-label="Grow">
          <div className="cells-stat">
            <p className="cells-label">Step 3 of 3 · Grow</p>
            <p className="cells-big">1</p>
            <p>place to review results: track enquiries, bookings and campaign activity, approve important actions and refine the plan.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-split" data-chapter="ring" aria-labelledby="cells-h-paid">
          <div className="cells-copy">
            <p className="cells-label">From enquiry to booking</p>
            <h2 id="cells-h-paid">Turn more enquiries into paying customers.</h2>
          </div>
          <div className="cells-copy cells-copy-low">
            <p>From the first message to the phone call and booking, your AI team helps keep opportunities moving using your existing tools.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-split cells-ch-final" data-chapter="galaxy" aria-labelledby="cells-h-final">
          <div className="cells-copy">
            <h2 id="cells-h-final">Your business deserves a team behind it.</h2>
          </div>
          <div className="cells-copy cells-copy-low">
            <a className="cells-btn" href={SIGNUP}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
            <p className="cells-more"><a href="/how-it-works">How it works</a><span aria-hidden="true">·</span><a href="/faq">FAQs</a><span aria-hidden="true">·</span><a href="/about">About us</a><span aria-hidden="true">·</span><a href="/policies">Policies</a></p>
          </div>
        </section>

      </main>
    </div>
  );
}

import type { Metadata, Viewport } from 'next';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { fontVars } from '../plant-lab/fonts';
import { CellsStage } from './cells-stage';
import { CTA, SIGNUP } from './content';
import { EcosystemDiagram } from '../ecosystem/ecosystem-diagram';
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
            <p className="cells-lede">A team of AI agents that answer enquiries, quote, chase payments and find where your business is losing money. Built for sole traders and small businesses.</p>
            <div className="cells-actions">
              <a className="cells-btn" href={SIGNUP}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
              <a className="cells-link" href="#how">See how it works</a>
            </div>
          </div>
          <div className="cells-points" aria-labelledby="cells-points-h">
            <p className="cells-label" id="cells-points-h">A smarter way to grow your business</p>
            <ul>
              <li><b>7 AI agents</b><span>Sales, Job Manager, Business Optimisation, Integrations and more, working as one team.</span></li>
              <li><b>1 platform</b><span>Your prices, jobs, quotes and approvals in one place.</span></li>
              <li><b>Less admin</b><span>Your AI team drafts the work and you approve it, so you spend more time with customers.</span></li>
            </ul>
            <p className="cells-source">Receptionist and Socials &amp; Marketing are coming soon. You approve everything before it goes out. Results are not guaranteed.</p>
          </div>
        </section>

        {/* Not a chapter: while it is read the cells are still out of sight, gathering for step 1. */}
        <section className="cells-pain" aria-labelledby="cells-h-pain">
          <div className="cells-copy">
            <p className="cells-label">Meet your new workforce</p>
            <h2 id="cells-h-pain">Grow your business. Not your payroll.</h2>
            <p className="cells-body">Seven AI employees working together, 24/7, to manage, automate and grow your business.</p>
            <p className="cells-body">No recruitment. No additional staff to manage. No unnecessary overheads.</p>
            <p className="cells-body">You focus on getting the work done. Your AI team takes care of the rest.</p>
          </div>
          <div className="cells-versus" role="list">
            <div className="cells-vs cells-vs-old" role="listitem"><span>The usual way</span><b>Manage every task yourself</b></div>
            <div className="cells-vs cells-vs-new" role="listitem"><span>With {site.name}</span><b>One Agentic AI team</b></div>
          </div>
        </section>

        {/* Not a chapter: the animated map of the AI team (same component as /ecosystem). */}
        <section className="cells-pain cells-eco" aria-labelledby="cells-h-eco">
          <div className="cells-copy">
            <p className="cells-label">Your AI team</p>
            <h2 id="cells-h-eco">Seven AI employees. One connected team.</h2>
          </div>
          <div className="cells-eco-map">
            <EcosystemDiagram siteName={site.name} />
          </div>
          <a className="cells-link" href="/ecosystem">See the full ecosystem</a>
        </section>
        <section className="cells-ch cells-ch-low" data-chapter="vortex" id="how" aria-label="Understand">
          <div className="cells-stat">
            <p className="cells-label">Step 1 of 3 · Understand</p>
            <p className="cells-big">1</p>
            <p>business profile: answer three quick questions and confirm your services and prices.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-mid" data-chapter="helix" aria-label="Activate">
          <div className="cells-stat">
            <p className="cells-label">Step 2 of 3 · Activate</p>
            <p className="cells-big">7</p>
            <p>AI agents, one team: Sales, Job Manager, Business Optimisation and Integrations today, with Receptionist and Socials &amp; Marketing coming soon.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-top" data-chapter="horizon" aria-label="Grow">
          <div className="cells-stat">
            <p className="cells-label">Step 3 of 3 · Grow</p>
            <p className="cells-big">1</p>
            <p>place to run it all: enquiries, quotes, payments and weekly fixes, with every action waiting for your OK.</p>
          </div>
        </section>

        <section className="cells-ch cells-ch-split" data-chapter="ring" aria-labelledby="cells-h-paid">
          <div className="cells-copy">
            <p className="cells-label">From enquiry to paid</p>
            <h2 id="cells-h-paid">Turn more enquiries into paying customers.</h2>
          </div>
          <div className="cells-copy cells-copy-low">
            <p>From the first message to the quote and the payment, your AI team keeps every job moving with the tools you already use.</p>
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

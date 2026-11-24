import type { Metadata, Viewport } from 'next';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';
import { AGENTS, ROUTES, SIGNUP, STEPS } from '../cells/content';

export const metadata: Metadata = {
  title: `How it works · ${site.name}`,
  description: 'Connect the tools you already use, tell us about your business and let your AI team handle approved growth activities.',
  alternates: siteUrl() ? { canonical: siteUrl('/how-it-works') } : undefined,
  robots: indexable ? undefined : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

const InDevelopment = () => <em className="cells-tag">In development</em>;

export default function HowItWorksPage() {
  return (
    <InfoShell closing="More time for your customers. Less time managing growth." current="/how-it-works">
      <section className="cells-sec cells-intro" data-chapter="" aria-labelledby="how-h1">
        <p className="cells-label">How it works</p>
        <h1 id="how-h1">Your business. Your goals. Your AI team.</h1>
        <p className="cells-body">Connect the tools you already use, tell us about your business and let your AI team handle approved growth activities. No need to build a new website or store.</p>
      </section>

      <section className="cells-sec" data-chapter="" aria-labelledby="cells-h-routes">
        <p className="cells-label">What your team helps with</p>
        <h2 id="cells-h-routes">More customers, more visibility, fewer missed enquiries.</h2>
        <ul className="cells-cards cells-cards-3">
          {ROUTES.map((r) => (
            <li key={r.title}>
              <a href={SIGNUP} className="cells-card cells-card-link">
                <b>{r.title}</b>
                {!r.ready && <InDevelopment />}
                <span>{r.body}</span>
                <span className="cells-card-go" aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="cells-sec" data-chapter="" aria-labelledby="cells-h-steps">
        <p className="cells-label">Four steps</p>
        <h2 id="cells-h-steps">From setup to results.</h2>
        <ol className="cells-check">
          {STEPS.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </section>

      <section className="cells-sec" data-chapter="" id="what-you-get" aria-labelledby="cells-h-output">
        <p className="cells-label">What you get</p>
        <h2 id="cells-h-output">Four AI agents and a Growth Manager.</h2>
        <ul className="cells-cards cells-cards-5">
          {AGENTS.map((o) => (
            <li key={o.title} className="cells-card"><b>{o.title}</b>{!o.ready && <InDevelopment />}<span>{o.body}</span></li>
          ))}
        </ul>
      </section>
    </InfoShell>
  );
}

import type { Metadata, Viewport } from 'next';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';
import { AGENTS, OFFER_NOTE, PLANS, ROUTES, SIGNUP, STEPS } from '../cells/content';

export const metadata: Metadata = {
  title: `How it works · ${site.name}`,
  description: 'Sales replies, Job Manager quotes and chases payments, Business Optimisation finds lost money. You approve everything. Founding price from A$49/month.',
  alternates: siteUrl() ? { canonical: siteUrl('/how-it-works') } : undefined,
  robots: indexable ? undefined : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

const ComingSoon = () => <em className="cells-tag">Coming soon</em>;

export default function HowItWorksPage() {
  return (
    <InfoShell closing="More time for your customers. Less time chasing admin." current="/how-it-works">
      <section className="cells-sec cells-intro" data-chapter="" aria-labelledby="how-h1">
        <p className="cells-label">How it works</p>
        <h1 id="how-h1">Your Agentic AI team.</h1>
        <p className="cells-body">AI agents that answer enquiries, quote, chase payments and find where your business is losing money. You approve everything before it goes out.</p>
      </section>

      <section className="cells-sec" data-chapter="" aria-labelledby="cells-h-routes">
        <p className="cells-label">What it handles today</p>
        <h2 id="cells-h-routes">Reply faster, get paid sooner, stop losing money.</h2>
        <ul className="cells-cards cells-cards-3">
          {ROUTES.map((r) => (
            <li key={r.title}>
              <a href={SIGNUP} className="cells-card cells-card-link">
                <b>{r.title}</b>
                <span>{r.body}</span>
                <span className="cells-card-go" aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="cells-sec" data-chapter="" aria-labelledby="cells-h-steps">
        <p className="cells-label">From enquiry to paid</p>
        <h2 id="cells-h-steps">Five steps. You approve every one.</h2>
        <ol className="cells-check">
          {STEPS.map((s) => <li key={s.title}><span><b>{s.title}.</b> {s.body}</span></li>)}
        </ol>
      </section>

      <section className="cells-sec" data-chapter="" id="what-you-get" aria-labelledby="cells-h-output">
        <p className="cells-label">Meet the team</p>
        <h2 id="cells-h-output">One team that works from your real prices and records.</h2>
        <ul className="cells-cards cells-cards-3">
          {AGENTS.map((a) => (
            <li key={a.title} className="cells-card"><b>{a.title}</b>{a.soon && <ComingSoon />}{'behind' in a && a.behind && <em className="cells-tag">Behind the scenes</em>}<span>{a.body}</span></li>
          ))}
        </ul>
      </section>

      <section className="cells-sec" data-chapter="" id="pricing" aria-labelledby="cells-h-pricing">
        <p className="cells-label">Pricing</p>
        <h2 id="cells-h-pricing">Founding price for the first 25 businesses.</h2>
        <ul className="cells-cards cells-cards-2">
          {PLANS.map((p) => (
            <li key={p.title} className="cells-card">
              <b>{p.title}: {p.founding}/month</b>
              <span>Then {p.price}. {p.body}</span>
            </li>
          ))}
        </ul>
        <p className="cells-note">{OFFER_NOTE}</p>
      </section>
    </InfoShell>
  );
}

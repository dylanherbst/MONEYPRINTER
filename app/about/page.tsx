import type { Metadata, Viewport } from 'next';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';

export const metadata: Metadata = {
  title: `About us · ${site.name}`,
  description: `${site.name} gives Australian sole traders and small businesses an Agentic AI team. You stay in control of every message, quote and charge.`,
  alternates: siteUrl() ? { canonical: siteUrl('/about') } : undefined,
  robots: indexable ? undefined : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

// "Why owners trust it", from the InsertAgentic product overview (28 Nov 2026).
const PRINCIPLES = [
  { title: 'You stay in control', body: 'Every customer message is a draft until you approve it. One switch pauses everything.' },
  { title: 'It never makes things up', body: 'Prices come only from your confirmed price list. Unknown numbers show “Not measured yet”.' },
  { title: 'Built for Australia', body: 'AUD, correct GST and Spam Act consent rules.' },
  { title: 'Honest by design', body: 'Nothing shows as sent, paid or connected without a record to prove it.' },
];

export default function AboutPage() {
  return (
    <InfoShell closing="Your business deserves a team behind it." current="/about">
      <section className="cells-sec cells-intro" data-chapter="" aria-labelledby="about-h1">
        <p className="cells-label">About us</p>
        <h1 id="about-h1">An Agentic AI team for businesses that can’t afford a front office.</h1>
        <p className="cells-body">
          {site.name} gives Australian sole traders and small businesses AI agents that answer enquiries, quote, chase
          payments and find where money is slipping, so you can get back to the work only you can do.
        </p>
      </section>
      <section className="cells-sec" data-chapter="" aria-labelledby="about-h-believe">
        <p className="cells-label">Why owners trust it</p>
        <h2 id="about-h-believe">Your business, your call.</h2>
        <ul className="cells-cards cells-cards-2">
          {PRINCIPLES.map((b) => (
            <li key={b.title} className="cells-card"><b>{b.title}</b><span>{b.body}</span></li>
          ))}
        </ul>
      </section>
    </InfoShell>
  );
}

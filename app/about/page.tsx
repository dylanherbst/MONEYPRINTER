import type { Metadata, Viewport } from 'next';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';

export const metadata: Metadata = {
  title: `About us · ${site.name}`,
  description: `${site.name} brings sales, social media, marketing and reception into one coordinated AI team for small business owners.`,
  alternates: siteUrl() ? { canonical: siteUrl('/about') } : undefined,
  robots: indexable ? undefined : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

const PRINCIPLES = [
  { title: 'Start with your customers', body: 'Understand what they need.' },
  { title: 'Make every activity count', body: 'Focus on measurable opportunities.' },
  { title: 'You stay in charge', body: 'Approve sensitive actions and set limits.' },
  { title: 'Be transparent', body: 'Report actual activity and results without promising revenue.' },
];

export default function AboutPage() {
  return (
    <InfoShell closing="Your business deserves a team behind it." current="/about">
      <section className="cells-sec cells-intro" data-chapter="" aria-labelledby="about-h1">
        <p className="cells-label">About us</p>
        <h1 id="about-h1">We help small businesses grow without a full-time marketing and sales team.</h1>
        <p className="cells-body">
          {site.name} brings sales, social media, marketing and reception into one coordinated AI team, designed for owners
          who want to spend more time serving customers.
        </p>
      </section>

      <section className="cells-sec" data-chapter="" aria-labelledby="about-h-believe">
        <p className="cells-label">Our principles</p>
        <h2 id="about-h-believe">How we work for you.</h2>
        <ul className="cells-cards cells-cards-2">
          {PRINCIPLES.map((b) => (
            <li key={b.title} className="cells-card"><b>{b.title}</b><span>{b.body}</span></li>
          ))}
        </ul>
      </section>
    </InfoShell>
  );
}

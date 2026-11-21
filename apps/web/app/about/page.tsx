import type { Metadata, Viewport } from 'next';
import { site } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';

export const metadata: Metadata = {
  title: `About us · ${site.name}: ${site.descriptor}`,
  description: `${site.name} helps people start a side business by beginning with the customer: research first, test small, and approve every step. No promise of earnings.`,
  alternates: { canonical: `https://${site.domain}/about` },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

const BELIEFS = [
  { title: 'Start with the customer', body: 'Most new businesses fail because nobody needed what was built. So we begin with real problems and the people who have them, then build.' },
  { title: 'Test small before you spend more', body: 'A focused offer and a simple page tell you more than months of building. You learn what people respond to before you put in more time or money.' },
  { title: 'You stay in charge', body: 'AI drafts the research, the offer, the brand, the shop and the posts. Nothing goes live and nothing is charged until you approve it.' },
  { title: 'Straight talk about results', body: 'No platform can guarantee sales, and we never promise earnings. We help you research, build and market an idea more methodically.' },
];

export default function AboutPage() {
  return (
    <InfoShell closing="Your next business starts with a problem worth solving." current="/about">
      <section className="cells-sec cells-intro" aria-labelledby="about-h1">
        <p className="cells-label">About us</p>
        <h1 id="about-h1">We help everyday people start a business worth building.</h1>
        <p className="cells-body">
          {site.name} is {site.descriptor}. It is made for people with no business or coding experience who want a side
          income without spending months and a lot of money finding out whether an idea works.
        </p>
      </section>

      <section className="cells-sec" aria-labelledby="about-h-believe">
        <p className="cells-label">What we believe</p>
        <h2 id="about-h-believe">A good business starts with a problem worth solving.</h2>
        <ul className="cells-cards cells-cards-2">
          {BELIEFS.map((b) => (
            <li key={b.title} className="cells-card"><b>{b.title}</b><span>{b.body}</span></li>
          ))}
        </ul>
      </section>

    </InfoShell>
  );
}

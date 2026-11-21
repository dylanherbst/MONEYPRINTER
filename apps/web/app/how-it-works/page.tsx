import type { Metadata, Viewport } from 'next';
import { site } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';
import { LEAN_TEST, OUTPUTS, ROUTES, SIGNUP } from '../cells/content';

export const metadata: Metadata = {
  title: `How it works · ${site.name}: ${site.descriptor}`,
  description: 'Start where you are, test small before you spend more, and leave with an offer, a brand, a shop and launch posts. No promise of earnings.',
  alternates: { canonical: `https://${site.domain}/how-it-works` },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

export default function HowItWorksPage() {
  return (
    <InfoShell closing="Find a customer need. Build an offer around it." current="/how-it-works">
      <section className="cells-sec cells-intro" aria-labelledby="how-h1">
        <p className="cells-label">How it works</p>
        <h1 id="how-h1">How {site.name} works</h1>
        <p className="cells-body">Start with the customer, then build the business. Here is what that looks like in practice.</p>
      </section>

      <section className="cells-sec" aria-labelledby="cells-h-routes">
        <p className="cells-label">Three ways in</p>
        <h2 id="cells-h-routes">No idea? A skill? A business already? Start where you are.</h2>
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

      <section className="cells-sec" aria-labelledby="cells-h-spend">
        <p className="cells-label">Smarter spend</p>
        <h2 id="cells-h-spend">Spend smarter before you spend more.</h2>
        <p className="cells-body">You shouldn&apos;t need a big ad budget to find out whether people care about your idea. Start with research, a focused offer and a small test. Learn what gets a response before you spend more.</p>
        <ol className="cells-check">
          {LEAN_TEST.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </section>

      <section className="cells-sec" id="what-you-get" aria-labelledby="cells-h-output">
        <p className="cells-label">What you get</p>
        <h2 id="cells-h-output">Leave with more than a business idea.</h2>
        <ul className="cells-cards cells-cards-5">
          {OUTPUTS.map((o) => (
            <li key={o.title} className="cells-card"><b>{o.title}</b><span>{o.body}</span></li>
          ))}
        </ul>
      </section>
    </InfoShell>
  );
}

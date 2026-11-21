import type { Metadata, Viewport } from 'next';
import { site } from '../../lib/aimp/site-config';
import { startRoutes } from '../start/flow';
import { fontVars } from '../plant-lab/fonts';
import { CellsStage } from './cells-stage';
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

const START = startRoutes.welcome;
const CTA = 'Find my side business';
// The Tune panel is a design tool: shown on test versions, hidden on the live site unless the address has ?tune=1.
const TUNE_BY_DEFAULT = process.env.VERCEL_ENV !== 'production';

// Copy for the sections after the story (from the 22 Nov 2026 website copy brief, trimmed to what the product does).
const ROUTES = [
  { title: 'I have no idea what to sell', body: 'Explore ideas from your interests, experience and real market research.' },
  { title: 'I have a skill or something to teach', body: 'Turn what you know into a focused product or service people can buy.' },
  { title: 'I already run a business', body: 'Find the gaps in your market and a new offer to test with the customers you have.' },
];
const LEAN_TEST = [
  'A researched idea, not a guess',
  'One focused offer, for one kind of buyer, at one price',
  'A simple page to send people to',
  'Free posts first; ads only once something gets a response',
];
const OUTPUTS = [
  { title: 'Opportunity brief', body: 'The problem, who has it and the sources behind it.' },
  { title: 'Offer draft', body: 'What buyers get, who it is for and a price to test.' },
  { title: 'Brand and product', body: 'A name, a look and the first product, made for the offer.' },
  { title: 'Shop page', body: 'A page to sell from, with checkout into your own Stripe account.' },
  { title: 'Launch posts', body: 'A first set of posts, checked before you approve them.' },
];
const FAQS = [
  { q: 'Do I need to know how to code?', a: `No. ${site.name} guides you through setup in plain language, with AI helping you make the pieces you need.` },
  { q: 'What if I have no business idea?', a: 'That’s a good place to start. Tell us what interests you, what you know and how much time and money you have, and we help you explore customer problems and possible offers.' },
  { q: 'Does this guarantee I’ll make money?', a: `No. No platform can guarantee sales. ${site.name} helps you research, test and market an idea more methodically. Results depend on demand, your offer, how you run it and other things.` },
  { q: 'Do I have to pay for advertising?', a: 'No. You can start with a small test and free posts. Paid ads are optional and may make sense later, depending on your goals and budget.' },
  { q: 'How do you know people want the idea?', a: 'We use market signals, competitor research and customer feedback to guide each decision. Signals are not proof of a sale, which is why we suggest testing the offer before spending more.' },
  { q: 'What happens after I sign up?', a: 'You choose your starting point, answer a few simple questions and see your first ideas. We guide you to the next step from there.' },
];

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
          <a href="#what-you-get">What you get</a>
          <a href="#faqs">FAQs</a>
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
              <a className="cells-btn" href={START}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
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
            <a className="cells-btn" href={START}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
            <p className="cells-note">No coding experience needed. We help you build and launch; results are not guaranteed.</p>
          </div>
        </section>

        {/* After the story: plain sections on the page colour (the cells fade out). */}
        <div className="cells-after">
          <section className="cells-sec" aria-labelledby="cells-h-routes">
            <p className="cells-label">Three ways in</p>
            <h2 id="cells-h-routes">No idea? A skill? A business already? Start where you are.</h2>
            <ul className="cells-cards cells-cards-3">
              {ROUTES.map((r) => (
                <li key={r.title}>
                  <a href={START} className="cells-card cells-card-link">
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

          <section className="cells-sec" id="faqs" aria-labelledby="cells-h-faq">
            <p className="cells-label">Questions</p>
            <h2 id="cells-h-faq">Before you start</h2>
            <div className="cells-faq">
              {FAQS.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="cells-sec cells-close" aria-labelledby="cells-h-close">
            <h2 id="cells-h-close">Find a customer need. Build an offer around it.</h2>
            <p className="cells-body">Take the first step towards your own business, with AI to guide the way.</p>
            <a className="cells-btn" href={START}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
            <p className="cells-note">No coding experience needed. Results are not guaranteed.</p>
          </section>

          <footer className="cells-foot">
            <p><b>{site.name}</b>: {site.descriptor}</p>
            <p>{site.name} helps people research, build and market a business. It does not promise earnings or business success. Connected tools depend on each provider&apos;s availability and the permissions you give.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

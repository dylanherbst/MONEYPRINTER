import type { Metadata, Viewport } from 'next';
import { site } from '../../lib/aimp/site-config';
import { startRoutes } from '../start/flow';
import { StoryCanvas } from './_scene/story-canvas';
import { Example } from './example';
import { Icon, type IconName } from './icons';
import { SiteHeader } from './site-header';
import { TrackedLink } from './tracked-link';
import './tokens.css';
import './plant.css';
import { fontVars } from './fonts';

export const metadata: Metadata = {
  title: `${site.name} · Start a side hustle without spending weeks building it`,
  description: 'Pick an idea. AI builds your first digital product, shop, checkout and launch content. You approve everything before it goes live.',
  robots: { index: false, follow: false }, // lab route until approved for the homepage
};
export const viewport: Viewport = { themeColor: '#ddd0ff', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

/** Every main action opens the real onboarding: welcome, account, goals, then the researched ideas. */
const START = startRoutes.welcome;
const SIGN_IN = `${startRoutes.account}?mode=login`;
const CTA = 'Find my side hustle';
const links = [
  { href: '#how', label: 'How it works' },
  { href: '#example', label: 'What AI builds' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'Questions' },
];

/** Authored stills of the live scene (captured from the same three.js render) for first paint, no-JS and reduced motion. */
function Still({ stage, alt }: { stage: string; alt: string }) {
  return (
    <picture className="amp-still">
      <source media="(max-width: 899px)" srcSet={`/plant/stage-${stage}-mobile.webp`} />
      <img src={`/plant/stage-${stage}-desktop.webp`} alt={alt} loading={stage === 'seed' ? 'eager' : 'lazy'} decoding="async" />
    </picture>
  );
}

/** Soft folds of lavender and peach light behind the plant. Static and decorative. */
function Waves() {
  return (
    <svg className="amp-waves" viewBox="0 0 390 844" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="amp-wave-a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f6dccb" /><stop offset=".5" stopColor="#ffffff" /><stop offset="1" stopColor="#e2d6fb" /></linearGradient>
        <linearGradient id="amp-wave-b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ddd0fa" /><stop offset=".55" stopColor="#ffffff" /><stop offset="1" stopColor="#f8dfd2" /></linearGradient>
        <filter id="amp-wave-blur" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="26" /></filter>
      </defs>
      <g filter="url(#amp-wave-blur)">
        <ellipse cx="320" cy="150" rx="190" ry="130" fill="#d9ccfb" opacity=".5" />
        <ellipse cx="40" cy="470" rx="170" ry="120" fill="#fbdccb" opacity=".5" />
        <path d="M-70 300C10 226 110 112 250 92 330 82 410 100 460 120V182C400 152 330 134 256 146 140 168 40 276-70 362Z" fill="url(#amp-wave-a)" opacity=".8" />
        <path d="M460 396C400 406 330 478 250 530 160 588 60 582-70 644V712C60 650 170 654 262 600 340 552 400 484 460 470Z" fill="url(#amp-wave-b)" opacity=".8" />
        <ellipse cx="330" cy="760" rx="170" ry="70" fill="#e4d9fc" opacity=".55" />
      </g>
    </svg>
  );
}

const steps: { id: string; stage: string; alt: string; icon: IconName; tab: string; title: string; body: string; chips: string[]; note?: string }[] = [
  { id: 'foundation', stage: 'planted', alt: 'The seed planted in a soft white landscape', icon: 'idea', tab: 'Pick', title: 'Pick an idea', body: 'Tell us a little about you. You get researched ideas with the costs shown, and you choose one.', chips: ['Your budget', 'Your spare hours', 'What you enjoy'] },
  { id: 'creation', stage: 'sprout', alt: 'A small sprout with two glass leaves', icon: 'build', tab: 'Build', title: 'AI builds it', body: 'Everything is made for the idea you picked, and you review all of it.', chips: ['First product', 'Branded shop', 'Checkout'] },
  { id: 'growth', stage: 'tree', alt: 'A luminous three-leaf glass tree', icon: 'launch', tab: 'Launch', title: 'Launch when you’re ready', body: 'Publish the shop and approve the launch posts written for you. Nothing goes live without your OK.', chips: ['You approve everything', 'Posts drafted for you'], note: 'Checkout and automatic delivery are in pilot testing. Scheduled posting is coming soon.' },
];

const faqs = [
  { q: 'Do I need technical or design skills?', a: 'No. You make the decisions: which idea, which name, which products, when to publish. The platform does the setup work: product files, shop pages, checkout and launch content.' },
  { q: 'Will this make me money?', a: 'We can’t promise that, and nobody honest can. We help you start and run a low-cost side business with far less work. Sales depend on your niche, your products and your marketing. We show you real numbers as they come in, never estimates dressed up as results.' },
  { q: 'What does it cost to start?', a: 'Finding ideas and seeing a sample is free, with no card needed. Paid plans start at A$79 a month during the pilot. Stripe charges its own card fee on each sale. Custom domains and any advertising are optional extras.' },
  { q: 'Who owns the shop and products?', a: 'You do. The products are made for your business, payments go to your own Stripe account, and you can export your files.' },
  { q: 'What happens before anything goes public?', a: 'Nothing is published, posted or charged without your approval. You review the brand, the first products, the shop and every launch post first.' },
];

export default function PlantLabHome() {
  return (
    <div className={`amp amp-home ${fontVars}`} id="top">
      <a className="amp-skip" href="#main">Skip to content</a>
      <a className="amp-skip" href="#example">Skip animation</a>
      <SiteHeader name={site.name} cta={{ href: START, label: CTA }} signIn={SIGN_IN} links={links} />

      <main id="main">
        <section id="story" className="amp-story" aria-label="How it works, from a seed to a growing plant">
          <div className="amp-stage" aria-hidden="true">
            <Waves />
            <Still stage="seed" alt="" />
            <StoryCanvas storyId="story" />
            <div className="amp-cue"><span>Scroll to grow</span><i /></div>
          </div>

          <div className="amp-chapter amp-chapter-hero" data-chapter="potential">
            <Still stage="seed" alt="A floating white seed with a glowing lavender glass core" />
            <div className="amp-wrap amp-chapter-inner">
              <div className="amp-copy">
                <h1 className="amp-display"><span className="amp-thin">Start a side hustle</span> without spending weeks building it.</h1>
                <p className="amp-lead">Pick an idea. AI builds your first product, shop and launch content.</p>
                <p className="amp-reassure">Free to start, no card needed.</p>
                <div className="amp-dock">
                  <TrackedLink className="amp-round" href="#example" event={{ cta: 'hero_secondary' }} label="See what AI builds"><Icon name="play" size={22} /></TrackedLink>
                  <TrackedLink className="amp-btn amp-btn-primary amp-btn-wide" href={START} event={{ cta: 'hero_primary' }}>{CTA}<Icon name="arrowUp" size={22} /></TrackedLink>
                </div>
              </div>
            </div>
          </div>

          <div id="how" className="amp-how-anchor" aria-hidden="true" />
          {steps.map((s, i) => (
            <div className="amp-chapter amp-chapter-step" data-chapter={s.id} key={s.id}>
              <Still stage={s.stage} alt={s.alt} />
              <div className="amp-wrap amp-chapter-inner">
                <div className="amp-glass amp-step-card">
                  <p className="amp-sr">Step {i + 1} of {steps.length}</p>
                  <ol className="amp-tabs" aria-hidden="true">
                    {steps.map((t, n) => <li key={t.id} className={n === i ? 'is-on' : undefined}>{n === i ? <Icon name={t.icon} size={18} /> : null}{t.tab}</li>)}
                  </ol>
                  <h2 className="amp-h2">{s.title}</h2>
                  <p className="amp-lead">{s.body}</p>
                  <ul className="amp-chips">{s.chips.map((c) => <li key={c}>{c}</li>)}</ul>
                  {s.note ? <p className="amp-note">{s.note}</p> : null}
                  {i === steps.length - 1 ? (
                    <div className="amp-bar">
                      <TrackedLink className="amp-btn amp-btn-secondary" href="#example" event={{ cta: 'stage_growth_example' }}>See example</TrackedLink>
                      <TrackedLink className="amp-btn amp-btn-primary" href={START} event={{ cta: 'stage_growth' }}>{CTA}</TrackedLink>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section id="example" className="amp-section" aria-labelledby="example-h">
          <div className="amp-wrap">
            <div className="amp-section-head">
              <h2 id="example-h" className="amp-h2">Here’s what AI builds.</h2>
              <p className="amp-lead">One sample business, start to finish: the product, the shop it sells in and the post that launches it.</p>
            </div>
            <Example />
            <TrackedLink className="amp-btn amp-btn-primary amp-section-cta" href={START} event={{ cta: 'example' }}>{CTA}</TrackedLink>
          </div>
        </section>

        <section id="pricing" className="amp-section amp-pricing" aria-labelledby="pricing-h">
          <div className="amp-wrap">
            <div className="amp-section-head">
              <h2 id="pricing-h" className="amp-h2">Free to start. Simple after that.</h2>
              <p className="amp-lead">Draft pilot pricing in AUD including GST, and it may change. Stripe charges its own card fee on each sale.</p>
            </div>
            <ul className="amp-plans">
              {site.plans.map((plan) => (
                <li key={plan.id} className={`amp-glass${plan.id === 'launch' ? ' is-recommended' : ''}`}>
                  <h3>{plan.name}{plan.id === 'launch' ? <span className="amp-tag">Recommended</span> : null}</h3>
                  <p className="amp-price">{plan.priceAud === 0 ? 'Free' : <>A${plan.priceAud}<span>/month</span></>}</p>
                  <p className="amp-plan-blurb">{plan.blurb}</p>
                  <ul>{plan.includes.map((i) => <li key={i}><Icon name="check" size={18} />{i}</li>)}</ul>
                  <TrackedLink className={`amp-btn ${plan.id === 'launch' ? 'amp-btn-primary' : 'amp-btn-secondary'}`} href={`${START}?plan=${plan.id}`} event={{ cta: 'pricing', plan: plan.id }}>
                    {plan.priceAud === 0 ? 'Start free' : `Start with ${plan.name}`}
                  </TrackedLink>
                </li>
              ))}
            </ul>
            <ul className="amp-promise" aria-label="What we will never promise">
              <li><strong>No guaranteed income.</strong> Automation saves you work. It does not guarantee sales.</li>
              <li><strong>No fake urgency.</strong> No countdown timers, invented reviews or made-up earnings.</li>
              <li><strong>No hidden actions.</strong> Nothing is published, posted, charged or spent without your approval.</li>
            </ul>
          </div>
        </section>

        <section id="faq" className="amp-section" aria-labelledby="faq-h">
          <div className="amp-wrap amp-faq">
            <h2 id="faq-h" className="amp-h2">Questions</h2>
            <div>
              {faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}<Icon name="chevron" size={20} /></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="amp-final" aria-labelledby="final-h">
          <Still stage="tree" alt="" />
          <div className="amp-wrap amp-final-inner">
            <div className="amp-glass amp-final-card">
              <h2 id="final-h" className="amp-h2">Your side hustle starts with one idea.</h2>
              <p className="amp-lead">See ideas that fit your budget and your time before you pay for anything.</p>
              <TrackedLink className="amp-btn amp-btn-primary amp-btn-wide" href={START} event={{ cta: 'final' }}>{CTA}<Icon name="arrowUp" size={22} /></TrackedLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="amp-footer">
        <div className="amp-wrap amp-footer-inner">
          <p className="amp-logo"><span className="amp-mark" aria-hidden="true"><Icon name="leaf" size={18} /></span>{site.name}</p>
          <p><a href={SIGN_IN}>Sign in</a> · Questions? <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a></p>
          <p className="amp-small">Pilot pricing and features are being tested and may change. Nothing on this site is financial advice or a promise of earnings.</p>
        </div>
      </footer>
    </div>
  );
}

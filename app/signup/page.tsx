import type { Metadata, Viewport } from 'next';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { fontVars } from '../plant-lab/fonts';
import { APP_READY, CTA, SIGNUP_TARGET } from '../cells/content';
import { SiteHeader } from '../cells/site-header';
import { CellsStage } from '../cells/cells-stage';
import '../cells/cells.css';

// The sign-up page: one line, one button. It opens the app's existing-business onboarding once the app is live, and
// the early access list until then.
export const metadata: Metadata = {
  title: `Sign up · ${site.name}`,
  description: `Get your AI front-office team with ${site.name}. Founding price for the first 25 businesses.`,
  alternates: siteUrl() ? { canonical: siteUrl('/signup') } : undefined,
  robots: indexable ? undefined : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

export default function SignupPage() {
  return (
    <div className={`cells cells-plain cells-signup ${fontVars}`} data-tone="light">
      <CellsStage tuneByDefault={false} />
      <SiteHeader solid />
      <main className="cells-signup-main" data-chapter="signup">
        <h1>Get your AI front-office team</h1>
        <section className="cells-close" aria-labelledby="signup-line">
          <h2 id="signup-line">{APP_READY ? 'Answer three quick questions and meet your team before you pay anything.' : 'Founding price for the first 25 businesses: from A$49/month, locked for 12 months.'}</h2>
          {SIGNUP_TARGET
            ? <a className="cells-btn" href={SIGNUP_TARGET}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
            : <p className="cells-body">The early access list opens here soon.</p>}
          <p className="cells-note">14-day free trial. You approve everything. Results are not guaranteed. By continuing you agree to our <a href="/policies">Policies</a>.</p>
        </section>
        <p className="cells-more"><a href="/how-it-works">How it works</a><span aria-hidden="true">·</span><a href="/faq">FAQs</a><span aria-hidden="true">·</span><a href="/about">About us</a><span aria-hidden="true">·</span><a href="/policies">Policies</a></p>
      </main>
    </div>
  );
}

import type { Metadata, Viewport } from 'next';
import { site } from '../../lib/aimp/site-config';
import { fontVars } from '../plant-lab/fonts';
import { CREATE_ACCOUNT, CTA, SIGN_IN } from '../cells/content';
import '../cells/cells.css';

// The sign-up page: one line, one button. Everything else lives on /learn.
export const metadata: Metadata = {
  title: `Sign up · ${site.name}: ${site.descriptor}`,
  description: `Begin with ${site.name}. No coding experience needed. Results are not guaranteed.`,
  alternates: { canonical: `https://${site.domain}/signup` },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

export default function SignupPage() {
  return (
    <div className={`cells cells-plain cells-signup ${fontVars}`} data-tone="light">
      <header className="cells-top">
        <a href="/" className="cells-logo" aria-label={`${site.name} home`}>
          <img src="/brand/aimp-logo.webp" alt="" width={36} height={36} />
        </a>
        <a href={SIGN_IN} className="cells-signin">Sign in</a>
      </header>
      <main className="cells-signup-main">
        <h1>Begin your money printing journey</h1>
        <section className="cells-close" aria-labelledby="signup-line">
          <h2 id="signup-line">Your next business starts with a problem worth solving.</h2>
          <a className="cells-btn" href={CREATE_ACCOUNT}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
          <p className="cells-note">No coding experience needed. Results are not guaranteed.</p>
        </section>
        <p className="cells-more"><a href="/learn">Learn more and FAQs</a></p>
      </main>
    </div>
  );
}

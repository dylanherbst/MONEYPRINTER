import type { Metadata, Viewport } from 'next';
import { site } from '../../lib/aimp/site-config';
import { fontVars } from '../plant-lab/fonts';
import { CREATE_ACCOUNT, CTA } from '../cells/content';
import { SiteHeader } from '../cells/site-header';
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
      <SiteHeader solid />
      <main className="cells-signup-main">
        <h1>Begin your money printing journey</h1>
        <section className="cells-close" aria-labelledby="signup-line">
          <h2 id="signup-line">Your next business starts with a problem worth solving.</h2>
          <a className="cells-btn" href={CREATE_ACCOUNT}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
          <p className="cells-note">No coding experience needed. Results are not guaranteed.</p>
        </section>
        <p className="cells-more"><a href="/how-it-works">How it works</a><span aria-hidden="true">·</span><a href="/faq">FAQs</a><span aria-hidden="true">·</span><a href="/about">About us</a></p>
      </main>
    </div>
  );
}

import type { ReactNode } from 'react';
import { site } from '../../lib/aimp/site-config';
import { fontVars } from '../plant-lab/fonts';
import { CTA, SIGN_IN, START } from './content';
import './cells.css';

/** Plain page in the home page's look (no cells animation), for Learn more and FAQs. */
export function InfoShell({ children, closing }: { children: ReactNode; closing: string }) {
  return (
    <div className={`cells cells-plain ${fontVars}`} data-tone="light">
      <header className="cells-top" data-solid="1">
        <a href="/" className="cells-logo" aria-label={`${site.name} home`}>
          <img src="/brand/aimp-logo.webp" alt="" width={36} height={36} />
        </a>
        <nav className="cells-nav" aria-label="Site">
          <a href="/#how">How it works</a>
          <a href="/learn">Learn more</a>
          <a href="/faq">FAQs</a>
        </nav>
        <a href={SIGN_IN} className="cells-signin">Sign in</a>
      </header>
      <main className="cells-after">
        {children}
        <section className="cells-sec cells-close" aria-labelledby="cells-h-close">
          <h2 id="cells-h-close">{closing}</h2>
          <a className="cells-btn" href={START}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
          <p className="cells-note">No coding experience needed. Results are not guaranteed.</p>
        </section>
        <footer className="cells-foot">
          <p><a href="/">{site.name}</a>: {site.descriptor} · <a href="/learn">Learn more</a> · <a href="/faq">FAQs</a></p>
          <p>{site.name} helps people research, build and market a business. It does not promise earnings or business success. Connected tools depend on each provider&apos;s availability and the permissions you give.</p>
        </footer>
      </main>
    </div>
  );
}

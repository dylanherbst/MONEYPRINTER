import type { ReactNode } from 'react';
import { site } from '../../lib/aimp/site-config';
import { fontVars } from '../plant-lab/fonts';
import { CTA, FOOTER_NOTE, SIGNUP } from './content';
import { SiteHeader } from './site-header';
import { CellsStage } from './cells-stage';
import { MotionBoot } from './motion/motion-boot';
import './cells.css';

/** Page in the home page's look, with the same scroll-driven cells behind it: How it works, FAQs, About us. */
export function InfoShell({ children, closing, current }: { children: ReactNode; closing?: string; current?: string }) {
  return (
    <div className={`cells cells-plain ${fontVars}`} data-tone="light">
      {/* Same moving cells and wave background as the home page; each section below is one step of the scroll. */}
      <CellsStage tuneByDefault={false} />
      <SiteHeader solid current={current} />
      <MotionBoot />
      <main className="cells-info">
        {children}
        {closing && (
          <section className="cells-sec cells-close" data-chapter="close" aria-labelledby="cells-h-close">
            <h2 id="cells-h-close">{closing}</h2>
            <a className="cells-btn" href={SIGNUP}>{CTA}<span className="cells-go" aria-hidden="true">→</span></a>
            <p className="cells-note">No coding required. Results are not guaranteed.</p>
          </section>
        )}
        <footer className="cells-foot">
          <p><a href="/">{site.name}</a>: {site.descriptor} · <a href="/how-it-works">How it works</a> · <a href="/ecosystem">Ecosystem</a> · <a href="/faq">FAQs</a> · <a href="/about">About us</a> · <a href="/policies">Policies</a></p>
          <p>{FOOTER_NOTE}</p>
        </footer>
      </main>
    </div>
  );
}

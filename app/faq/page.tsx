import type { Metadata, Viewport } from 'next';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';
import { FAQS } from '../cells/content';

export const metadata: Metadata = {
  title: `FAQs · ${site.name}`,
  description: `Answers about ${site.name}: who it is for, what it does today, approvals, pricing and the free trial.`,
  alternates: siteUrl() ? { canonical: siteUrl('/faq') } : undefined,
  robots: indexable ? undefined : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

export default function FaqPage() {
  return (
    <InfoShell closing="Your business deserves a team behind it." current="/faq">
      <section className="cells-sec cells-intro" data-chapter="" aria-labelledby="faq-h1">
        <p className="cells-label">FAQs</p>
        <h1 id="faq-h1">Before you start</h1>
        <div className="cells-faq">
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </InfoShell>
  );
}

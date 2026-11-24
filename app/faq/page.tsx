import type { Metadata, Viewport } from 'next';
import { site } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';
import { FAQS } from '../cells/content';

export const metadata: Metadata = {
  title: `FAQs · ${site.name}: ${site.descriptor}`,
  description: `Answers about ${site.name}: coding, ideas, advertising, how ideas are checked, and why no platform can guarantee sales.`,
  alternates: { canonical: `https://${site.domain}/faq` },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

export default function FaqPage() {
  return (
    <InfoShell closing="Your next business starts with a problem worth solving." current="/faq">
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

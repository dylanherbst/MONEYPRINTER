// Test Lab: every store template side by side on the demo store, using the real shop stylesheet and renderer settings.
import type { CSSProperties } from 'react';
import { demoStore } from '../../../lib/aimp/storefront/demo-store';
import { renderConfig } from '../../../lib/aimp/storefront/render-config';
import { applyTemplate, templates } from '../../../lib/aimp/storefront/templates';
import '../../s/[store]/store.css';

export const metadata = { title: 'Template gallery · Test Lab' };

export default function Gallery() {
  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.6rem' }}>Store templates ({templates.length})</h1>
      <p style={{ color: '#555' }}>The same demo store in each template. <a href="/test-lab">Back to Test Lab</a></p>
      {templates.map((t) => {
        const r = applyTemplate(demoStore, t.id);
        if (!r.ok) return null;
        const rc = renderConfig(r.config);
        const s = r.config;
        return (
          <section key={t.id} style={{ margin: '2rem 0' }} data-template={t.id}>
            <h2 style={{ fontSize: '1.1rem' }}>{t.name} <small style={{ fontWeight: 400, color: '#666' }}>· {t.bestFor}</small></h2>
            <div className="st" style={{ ...(rc.cssVars as CSSProperties), minHeight: 0, border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden' }} {...rc.attrs}>
              <header className="st-header" style={{ position: 'static' }}>
                <div className="st-wrap st-header-inner"><span className="st-logo">{s.brand.name}</span><nav><a href="#x">Shop</a><a href="#x">FAQ</a></nav></div>
              </header>
              <section className="st-hero">
                <div className="st-wrap st-hero-inner">
                  <div className="st-hero-copy">
                    <p className="st-eyebrow">{s.hero.eyebrow}</p>
                    <h1>{s.hero.heading}</h1>
                    <p className="st-lead">{s.hero.subheading}</p>
                    <a className="st-btn st-btn-primary" href="#x">{s.hero.ctaLabel}</a>
                  </div>
                  <div className="st-hero-art"><div className="st-cover st-cover-lg" /></div>
                </div>
              </section>
              <div className="st-wrap st-section">
                <div className="st-grid">
                  {s.products.slice(0, 4).map((p) => (
                    <a key={p.slug} className="st-card" href="#x"><div className="st-cover" /><div className="st-card-body"><span className="st-card-title">{p.title}</span><span className="st-price">${(p.priceMinor / 100).toFixed(2)}</span></div></a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </main>
  );
}

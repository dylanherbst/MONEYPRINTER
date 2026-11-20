// A small, static copy of the shop front used by the template picker and the Test Lab gallery. It uses the real shop stylesheet and the
// same layout attributes as the live shop, so what you see here is the layout the shop will use. No links go anywhere.
import type { CSSProperties } from 'react';
import '../store.css';
import { fontStacks } from '../../../../lib/aimp/storefront/render-config';
import { layoutAttrs, type Palette, type StoreTemplate } from '../../../../lib/aimp/storefront/templates';
import type { LookSample } from '../../../../lib/aimp/storefront/preview-sample';

export function TemplatePreview({ tpl, palette, sample, logo }: { tpl: StoreTemplate; palette: Palette; sample: LookSample; logo?: string }) {
  const vars = {
    '--st-bg': palette.bg, '--st-surface': palette.surface, '--st-ink': palette.ink, '--st-muted': palette.muted, '--st-line': palette.line,
    '--st-accent': palette.accent, '--st-accent-ink': palette.accentInk, '--st-soft': palette.soft, '--st-font': fontStacks[tpl.font], minHeight: 0,
  } as CSSProperties;
  const show = new Set<string>(tpl.sections);
  return (
    <div className="st aws-live" style={vars} {...layoutAttrs(tpl)} data-testid="template-preview">
      <header className="st-header" style={{ position: 'static' }}>
        <div className="st-wrap st-header-inner">
          <span className="st-logo">{logo ? <img className="st-logo-img" src={logo} alt="" /> : null}<span>{sample.name}</span></span>
          <nav><span>Shop</span><span>FAQ</span><span>Contact</span></nav>
        </div>
      </header>
      <main id="st-main">
        <section className="st-hero">
          <div className="st-wrap st-hero-inner">
            <div className="st-hero-copy">
              <p className="st-eyebrow">{sample.eyebrow}</p>
              <h1>{sample.heading}</h1>
              <p className="st-lead">{sample.subheading}</p>
              <span className="st-btn st-btn-primary">{sample.cta}</span>
            </div>
            <div className="st-hero-art"><div className="st-cover st-cover-lg" /></div>
          </div>
        </section>
        {show.has('trust') && sample.trust.length ? (
          <section className="st-wrap st-trust" aria-label="Why buy here">
            {sample.trust.map((t) => <div key={t.title}><h2 className="st-h3">{t.title}</h2><p className="st-muted">{t.body}</p></div>)}
          </section>
        ) : null}
        {show.has('featured') ? (
          <section className="st-wrap st-section" aria-labelledby="featured-h">
            <h2 id="featured-h">Most loved</h2>
            <div className="st-grid">{sample.products.slice(0, 3).map((p) => <Card key={p.title} p={p} />)}</div>
          </section>
        ) : null}
        {show.has('bundles') ? (
          <section className="st-wrap st-section" aria-labelledby="bundles-h">
            <h2 id="bundles-h">Bundles</h2>
            <div className="st-bundle"><div className="st-bundle-covers"><div className="st-cover" /><div className="st-cover" /><div className="st-cover" /></div><div><h3>Save with the bundle</h3><p className="st-muted">Everything together at one price.</p></div></div>
          </section>
        ) : null}
        {show.has('catalogue') ? (
          <section id="catalogue" className="st-wrap st-section" aria-labelledby="all-h">
            <h2 id="all-h">All products</h2>
            <div className="st-grid">{sample.products.map((p) => <Card key={p.title} p={p} />)}</div>
          </section>
        ) : null}
        {show.has('faq') ? (
          <section id="faq" className="st-wrap st-section st-narrow" aria-labelledby="faq-h">
            <h2 id="faq-h">Questions</h2>
            {sample.faq.map((q) => <div key={q} className="st-faq"><strong>{q}</strong></div>)}
          </section>
        ) : null}
        {show.has('newsletter') ? <section className="st-wrap st-section"><div className="st-newsletter"><h2>Get a free weekly printable</h2></div></section> : null}
      </main>
    </div>
  );
}

function Card({ p }: { p: { title: string; price: string } }) {
  return <div className="st-card"><div className="st-cover" /><div className="st-card-body"><span className="st-card-title">{p.title}</span><span className="st-card-summary">A short line about this product.</span><span className="st-price">{p.price}</span></div></div>;
}

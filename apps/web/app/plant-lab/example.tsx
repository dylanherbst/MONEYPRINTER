import type { CSSProperties } from 'react';
import { generatePreview, money, previewLabel } from '../../lib/aimp/preview/generate';
import { Cover } from '../s/[store]/_ui/parts';
import '../s/[store]/store.css';
import { Icon } from './icons';

// The colours the sample covers are drawn in (the storefront's own variables, set to the site's palette).
const coverVars = { '--st-soft': '#efeafc', '--st-surface': '#ffffff', '--st-line': '#e4dff0', '--st-ink': '#1c1a24', '--st-accent': '#8b6fe0', '--st-font': 'var(--amp-body)' } as CSSProperties;

/**
 * "What AI builds": one finished product, the shop it sits in and the post that launches it, shown together.
 * Everything here is real output of the preview builder for one tested blueprint, and it is labelled as a sample.
 */
export function Example() {
  const preview = generatePreview({ model: 'digital-templates', niche: 'teacher-planners' });
  const [first, ...rest] = preview.products;
  const pin = preview.marketing.pins[0];
  return (
    <div className="amp-example st" style={coverVars}>
      <article className="amp-glass amp-ex amp-ex-product" aria-labelledby="ex-product">
        <p className="amp-ex-kind"><Icon name="product" size={18} />Your first product</p>
        <div className="amp-ex-product-body">
          <Cover style={first.cover.style} label={first.cover.label} />
          <div>
            <h3 id="ex-product">{first.title}</h3>
            <p>{first.summary}</p>
            <ul className="amp-ex-list">{first.includes.map((i) => <li key={i}><Icon name="check" size={16} />{i}</li>)}</ul>
            <p className="amp-ex-price">{money(first.priceMinor)}<span>{first.format} download</span></p>
          </div>
        </div>
      </article>

      <article className="amp-glass amp-ex amp-ex-shop" aria-labelledby="ex-shop">
        <p className="amp-ex-kind"><Icon name="shop" size={18} />Your shop</p>
        <div className="amp-ex-window">
          <p className="amp-ex-bar"><i /><i /><i /><span>{preview.store.slug}</span></p>
          <div className="amp-ex-shop-body">
            <h3 id="ex-shop">{preview.brand.name}</h3>
            <p>{preview.brand.tagline}</p>
            <ul className="amp-ex-grid">
              {rest.slice(0, 3).map((p) => (
                <li key={p.slug}><Cover style={p.cover.style} label={p.cover.label} /><span>{p.title}</span><em>{money(p.priceMinor)}</em></li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <article className="amp-glass amp-ex amp-ex-post" aria-labelledby="ex-post">
        <p className="amp-ex-kind"><Icon name="post" size={18} />Your launch post</p>
        <div className="amp-ex-post-body">
          <Cover style={pin.cover.style} label={pin.cover.label} />
          <div>
            <h3 id="ex-post">{pin.title}</h3>
            <p>{pin.description}</p>
            <p className="amp-ex-meta">Pinterest draft · board “{pin.board}”</p>
          </div>
        </div>
      </article>

      <p className="amp-note amp-ex-note">{previewLabel}. Posts are drafts until you approve them.</p>
    </div>
  );
}

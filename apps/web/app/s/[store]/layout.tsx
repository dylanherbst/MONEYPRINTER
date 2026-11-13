import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { loadStore, policyPages } from '../../../lib/aimp/storefront/load';
import { storeThemes, type StoreFont } from '../../../lib/aimp/storefront/schema';
import { storeBase } from './_ui/base';
import './store.css';

export const dynamic = 'force-dynamic';

const fontStacks: Record<StoreFont, string> = {
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif",
  rounded: "ui-rounded, 'SF Pro Rounded', 'Nunito', -apple-system, sans-serif",
};

type Props = { children: ReactNode; params: Promise<{ store: string }> };

export async function generateMetadata({ params }: { params: Promise<{ store: string }> }): Promise<Metadata> {
  const store = loadStore((await params).store);
  if (!store) return { title: 'Store not found', robots: { index: false } };
  return {
    title: { default: store.seo.title, template: `%s · ${store.brand.name}` },
    description: store.seo.description,
    robots: store.demo ? { index: false, follow: false } : undefined,
  };
}

export default async function StoreLayout({ children, params }: Props) {
  const store = loadStore((await params).store);
  if (!store) notFound();
  const base = await storeBase(store.slug);
  const t = storeThemes[store.brand.theme];
  const vars = {
    '--st-bg': t.bg, '--st-surface': t.surface, '--st-ink': t.ink, '--st-muted': t.muted, '--st-line': t.line,
    '--st-accent': t.accent, '--st-accent-ink': t.accentInk, '--st-soft': t.soft, '--st-font': fontStacks[store.brand.font],
  } as CSSProperties;
  const year = new Date().getUTCFullYear();
  return (
    <div className="st" style={vars}>
      <a className="st-skip" href="#st-main">Skip to content</a>
      {store.demo ? <p className="st-demo" role="note"><strong>DEMO STORE</strong> Sample products and policies. Checkout is turned off.</p> : null}
      <header className="st-header">
        <div className="st-wrap st-header-inner">
          <a className="st-logo" href={base || '/'}>{store.brand.name}</a>
          <nav aria-label="Store">
            <a href={`${base}/#catalogue`}>Shop</a>
            <a href={`${base}/#faq`}>FAQ</a>
            <a href={`${base}/contact`}>Contact</a>
          </nav>
        </div>
      </header>
      <main id="st-main">{children}</main>
      <footer className="st-footer">
        <div className="st-wrap st-footer-inner">
          <div>
            <p className="st-logo">{store.brand.name}</p>
            <p className="st-muted">{store.brand.tagline}</p>
          </div>
          <nav aria-label="Policies" className="st-footer-links">
            {Object.entries(policyPages).map(([key, title]) => <a key={key} href={`${base}/policies/${key}`}>{title}</a>)}
            <a href={`${base}/contact`}>Contact</a>
          </nav>
          <p className="st-small st-muted">
            © {year} {store.contact.businessName}{store.contact.abn ? ` · ABN ${store.contact.abn}` : ''}. Prices in AUD.
            <br />Store built with AiMoneyPrinter.
          </p>
        </div>
      </footer>
    </div>
  );
}

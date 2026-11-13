import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadStore } from '../../../../lib/aimp/storefront/load';

export const metadata: Metadata = { title: 'Contact' };

export default async function ContactPage({ params }: { params: Promise<{ store: string }> }) {
  const store = loadStore((await params).store);
  if (!store) notFound();
  return (
    <article className="st-wrap st-narrow st-section st-prose">
      <h1>Contact</h1>
      <p>Questions about an order or a file? Email us and we reply {store.contact.responseTime}.</p>
      <p><a className="st-btn st-btn-primary" href={`mailto:${store.contact.email}`}>{store.contact.email}</a></p>
      <p className="st-muted">Please include your order number if you have one.</p>
      <p className="st-small st-muted">{store.contact.businessName}{store.contact.abn ? ` · ABN ${store.contact.abn}` : ''}</p>
    </article>
  );
}

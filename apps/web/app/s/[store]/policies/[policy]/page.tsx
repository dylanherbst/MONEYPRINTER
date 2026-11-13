import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPolicyPage, loadStore, policyPages } from '../../../../../lib/aimp/storefront/load';

type Params = { params: Promise<{ store: string; policy: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { policy } = await params;
  return { title: isPolicyPage(policy) ? policyPages[policy] : 'Not found' };
}

export default async function PolicyPage({ params }: Params) {
  const { store: s, policy } = await params;
  const store = loadStore(s);
  if (!store || !isPolicyPage(policy)) notFound();
  return (
    <article className="st-wrap st-narrow st-section st-prose">
      <h1>{policyPages[policy]}</h1>
      {store.demo ? <p className="st-note">Sample policy text. A real store owner reviews and approves their policies before publishing.</p> : null}
      {store.policies[policy].map((para) => <p key={para}>{para}</p>)}
      <p className="st-muted">Questions? Email <a href={`mailto:${store.contact.email}`}>{store.contact.email}</a>.</p>
    </article>
  );
}

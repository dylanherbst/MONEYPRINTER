'use client';
// Products (screen 12) on the Peach & Lavender glass library. The list is read from the product and catalogue services on the
// server; "Add a product" runs the existing product builder through `createProductAction` and then reloads the list.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { AppIntro, AppLayout, GlassBadge, GlassButton, GlassCard, GlassIcon, GlassNotice, GlassState } from '../../../design-system/aimp-glass';
import { createProductAction } from './actions';
import { BUNDLES_NOTE, applyFilter, emptyCopy, filterCounts, filterHref, filterNames, statusFilters } from './view-model';
import type { CreatePlan, ProductRow, StatusFilter } from './view-model';

const UNREACHABLE = 'We could not reach the server, so nothing was added. Try again.';
const statusTone = { active: 'success', draft: 'neutral', archived: 'neutral' } as const;

export function ProductsView({ businessId, rows, create, filter }: { businessId: string; rows: ProductRow[]; create: CreatePlan; filter: StatusFilter }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string; errors: string[] } | null>(null);
  const busyRef = useRef(false);
  const shown = applyFilter(rows, filter);
  const counts = filterCounts(rows);
  const empty = emptyCopy(filter, rows.length);

  async function add() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setNotice(null);
    try {
      const r = await createProductAction(businessId);
      setNotice({ ok: r.ok, text: r.message || (r.ok ? 'Product added.' : 'Nothing was added.'), errors: r.errors });
      if (r.ok) router.refresh();
    } catch { setNotice({ ok: false, text: UNREACHABLE, errors: [] }); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return (
    <AppLayout width="wide">
      <AppIntro title="Products" badges={<GlassBadge tone="demo" dot data-testid="page-mode">DEMO</GlassBadge>}>
        <p>What you sell. A product is active once you have approved it and approved its listing and price.</p>
        <p className="plg-note" data-testid="demo-note">Demo storage on the server: products are kept in memory and are lost when the server restarts. Products are built by the built-in generator, not an AI model.</p>
        <Link href={`/app/${businessId}`} className="plg-link apr-back" data-target="large" data-testid="back-to-overview">Back to your overview</Link>
      </AppIntro>

      {notice ? (
        <GlassNotice tone={notice.ok ? 'success' : 'error'} title={notice.text} data-testid={notice.ok ? 'created' : 'create-failed'}>
          {notice.errors.length ? <ul className="plg-list">{notice.errors.map((e) => <li key={e}>{e}</li>)}</ul> : null}
        </GlassNotice>
      ) : null}

      <GlassCard heading="h2" title="Your products" data-testid="catalogue">
        <nav aria-label="Filter products by status">
          <ul className="apr-filters">
            {statusFilters.map((f) => (
              <li key={f}>
                <Link href={filterHref(businessId, f)} className="apr-filter" aria-current={f === filter ? 'page' : undefined} data-testid={`filter-${f}`}>
                  {filterNames[f]} <span aria-hidden="true">({counts[f]})</span><span className="plg-sr">, {counts[f]} products</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {shown.length ? (
          <ul className="apr-list" data-testid="product-list">
            {shown.map((p) => (
              <li key={p.id} className="apr-item" data-testid="product-row" data-status={p.status}>
                <h3>{p.name}</h3>
                <div className="apr-meta">
                  <span>Type: {p.type}</span>
                  <span>Price: <strong>{p.price}</strong> <span className="plg-note">({p.priceNote})</span></span>
                  <GlassBadge tone={statusTone[p.status]}>{p.statusLabel}</GlassBadge>
                </div>
                <p className="plg-note">{p.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <GlassState kind="empty" title={empty.title} data-testid="empty-state"><p>{empty.text}</p></GlassState>
        )}
      </GlassCard>

      <GlassCard heading="h2" highlighted eyebrow="Your next step" title="Add a product" data-testid="add-product">
        {create.canCreate ? (
          <p className="plg-text">Build another product from your business idea. It is checked before you can approve it. You can add {create.remaining} more in this demo.</p>
        ) : (
          <p className="plg-text" data-testid="create-blocked">{create.reason}</p>
        )}
        <GlassButton variant="primary" onClick={() => { void add(); }} loading={busy} loadingLabel="Building your product…" disabled={!create.canCreate || busy}
          icon={<GlassIcon name="spark" size={22} tone="deep" />}>Add a product</GlassButton>
        <p className="plg-note">New products are reviewed and approved in guided set-up.</p>
        <GlassButton variant="secondary" href="/start/products">Review and approve in guided set-up</GlassButton>
      </GlassCard>

      <GlassCard heading="h2" title="Bundles" badges={<GlassBadge>Coming soon</GlassBadge>} data-testid="bundles">
        <p className="plg-text">{BUNDLES_NOTE}</p>
      </GlassCard>
    </AppLayout>
  );
}

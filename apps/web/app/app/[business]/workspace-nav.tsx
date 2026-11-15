'use client';
// Owner request (15 Nov): a navigation bar across the owner workspace, so every page under /app/<business> is one tap away.
// Pages that are not built yet are shown as "Soon" and are not links. The list lives in workspace-nav-items.ts.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { currentSegment, tabForSegment, tabHref, workspaceNavHref, workspaceNavItems } from './workspace-nav-items';
import { appTabs } from '../../../lib/aimp/entry';
import './workspace-nav.css';

export function WorkspaceNav({ business }: { business: string }) {
  const pathname = usePathname() ?? '';
  const current = currentSegment(pathname, business);
  const tab = tabForSegment(current);
  return (
    <>
    <div className="wn-top">
      <Link className="wn-profile" href={tabHref(business, 'settings')} aria-label="Settings and profile" aria-current={tab === 'settings' ? 'page' : undefined}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </Link>
    </div>
    <nav className="wn-tabs" aria-label="Main">
      <ul className="wn-tabs-list">
        {appTabs.map((t) => (
          <li key={t.id}>
            <Link className="wn-tab" href={tabHref(business, t.id)} aria-current={tab === t.id ? 'page' : undefined}>{t.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
    <nav className="wn-bar" aria-label="Your business">
      <ul className="wn-list">
        {workspaceNavItems.map((item) => {
          const href = workspaceNavHref(business, item);
          if (href === null) {
            return (
              <li key={item.label}>
                <span className="wn-item" data-soon="true">
                  {item.label} <span className="wn-soon">Soon</span>
                </span>
              </li>
            );
          }
          return (
            <li key={item.label}>
              <Link className="wn-item" href={href} aria-current={item.segment === current ? 'page' : undefined}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}

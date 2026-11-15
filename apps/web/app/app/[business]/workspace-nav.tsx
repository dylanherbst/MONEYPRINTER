'use client';
// Owner request (15 Nov): a navigation bar across the owner workspace, so every page under /app/<business> is one tap away.
// Pages that are not built yet are shown as "Soon" and are not links. The list lives in workspace-nav-items.ts.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { currentSegment, workspaceNavHref, workspaceNavItems } from './workspace-nav-items';
import './workspace-nav.css';

export function WorkspaceNav({ business }: { business: string }) {
  const pathname = usePathname() ?? '';
  const current = currentSegment(pathname, business);
  return (
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
  );
}

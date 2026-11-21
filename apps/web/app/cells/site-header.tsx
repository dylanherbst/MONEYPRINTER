import { site } from '../../lib/aimp/site-config';
import { SIGN_IN } from './content';

/** The public site's pages, in header order. */
export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/faq', label: 'FAQs' },
  { href: '/about', label: 'About us' },
];

/**
 * Header for the public pages: logo, the three page links and Sign in. On phones the links sit in a Menu that opens
 * below the header (a <details> element, so it works without JavaScript).
 */
export function SiteHeader({ solid = false, current }: { solid?: boolean; current?: string }) {
  return (
    <header className="cells-top" data-solid={solid ? '1' : undefined}>
      <a href="/" className="cells-logo" aria-label={`${site.name} home`}>
        <img src="/brand/aimp-logo.webp" alt="" width={36} height={36} />
      </a>
      <nav className="cells-nav" aria-label="Site">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} aria-current={current === n.href ? 'page' : undefined}>{n.label}</a>
        ))}
      </nav>
      <div className="cells-top-end">
        <details className="cells-menu">
          <summary aria-label="Menu">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Menu
          </summary>
          <nav className="cells-menu-panel" aria-label="Site">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} aria-current={current === n.href ? 'page' : undefined}>{n.label}</a>
            ))}
            <a href={SIGN_IN}>Sign in</a>
          </nav>
        </details>
        <a href={SIGN_IN} className="cells-signin">Sign in</a>
      </div>
    </header>
  );
}

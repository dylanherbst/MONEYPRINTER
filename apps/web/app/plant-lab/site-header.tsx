'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { track } from '../../lib/aimp/analytics';
import { Icon } from './icons';

export interface SiteHeaderProps { name: string; cta: { href: string; label: string }; signIn: string; links: { href: string; label: string }[] }

/**
 * Compact header: the mark, the section links and the main action on wide screens; the mark and a menu button on
 * phones. The menu is a glass sheet under the header. It closes on Escape, on a link tap and on a tap outside it.
 */
export function SiteHeader({ name, cta, signIn, links }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const sheetId = useId();
  const root = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <header className="amp-header" ref={root} data-open={open ? 'true' : undefined}>
      <div className="amp-wrap amp-header-inner">
        <a className="amp-logo" href="#top" aria-label={`${name} home`} onClick={close}>
          <img className="amp-mark" src="/brand/aimp-logo.webp" alt="" width={32} height={32} decoding="async" />
          {name}
        </a>
        <nav className="amp-nav" aria-label="Main">
          {links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          <a href={signIn}>Sign in</a>
        </nav>
        <a className="amp-btn amp-btn-primary amp-btn-sm amp-header-cta" href={cta.href} onClick={() => track('cta_click', { href: cta.href, cta: 'header' })}>{cta.label}</a>
        <button ref={button} type="button" className="amp-menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls={sheetId} onClick={() => setOpen((v) => !v)}>
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
      </div>
      <div className="amp-sheet amp-glass" id={sheetId} hidden={!open}>
        <nav aria-label="Menu">
          {links.map((l) => <a key={l.href} href={l.href} onClick={close}>{l.label}<Icon name="arrow" size={18} /></a>)}
          <a href={signIn} onClick={close}>Sign in<Icon name="arrow" size={18} /></a>
        </nav>
        <a className="amp-btn amp-btn-primary" href={cta.href} onClick={() => { track('cta_click', { href: cta.href, cta: 'menu' }); close(); }}>{cta.label}</a>
      </div>
    </header>
  );
}

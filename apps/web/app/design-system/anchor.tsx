'use client';
import { useEffect } from 'react';

/** Scrolls to and focuses the element named in the URL hash once it exists (editors load after the page).
 *  Opens a <details> target. Presentation only; gives up after about 3 seconds. */
export function HashAnchor() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        window.clearInterval(timer);
        if (el instanceof HTMLDetailsElement) el.open = true;
        if (!el.hasAttribute('tabindex')) el.tabIndex = -1;
        el.scrollIntoView({ block: 'start' });
        el.focus({ preventScroll: true });
      } else if (++tries > 30) window.clearInterval(timer);
    }, 100);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
export const Anchor = ({ id }: { id: string }) => <span id={id} className="v-anchor" aria-hidden="true" />;

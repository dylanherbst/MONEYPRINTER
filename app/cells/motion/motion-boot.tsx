'use client';
import { useEffect } from 'react';
import { attachC05 } from '../../../lib/motion/registry';
import { prefersReducedMotion, supportsWaapi } from '../../../lib/motion/core';
import { runMotion } from '../../../lib/motion/run';
import '../../../lib/motion/c05.css';

/**
 * Site-wide motion behaviours for the public pages, added without changing the server-rendered markup:
 *  - C05: the border highlight of [data-c05] cards follows the pointer (one delegated listener; CSS does the rest).
 *  - C08: the header's Menu (a native <details>, so it still works without JavaScript) slides in, moves focus to the
 *         first link, closes on Escape (focus back to the Menu button) and on a click outside.
 *  - Quiet reveals: [data-reveal] items that start below the screen fade up once as they arrive. Items already on
 *         screen at load, and everything with reduced motion, are never hidden.
 * Renders nothing.
 */
export function MotionBoot() {
  useEffect(() => {
    const cleanups: (() => void)[] = [attachC05(document)];
    const reduced = prefersReducedMotion();

    // C08 navigation sheet
    const menu = document.querySelector<HTMLDetailsElement>('.cells-menu');
    const summary = menu?.querySelector('summary');
    const panel = menu?.querySelector<HTMLElement>('.cells-menu-panel');
    if (menu && summary && panel) {
      summary.setAttribute('aria-expanded', String(menu.open));
      summary.setAttribute('aria-controls', panel.id || (panel.id = 'cells-menu-panel'));
      let closing = false;
      const close = (focusBack: boolean) => {
        if (!menu.open || closing) return;
        closing = true;
        runMotion('C08', { focus: panel }, { params: { open: false }, reduced, onEnd: () => { menu.open = false; closing = false; } });
        if (focusBack) summary.focus();
      };
      const onToggle = () => summary.setAttribute('aria-expanded', String(menu.open));
      // Open in the same task as the click, so the sheet's start pose is set before the first paint.
      const onSummary = (e: MouseEvent) => {
        e.preventDefault();
        if (menu.open) { close(false); return; }
        menu.open = true;
        const links = Array.from(panel.querySelectorAll<HTMLElement>('a'));
        runMotion('C08', { focus: panel, nodes: links }, { params: { open: true }, reduced });
        links[0]?.focus({ preventScroll: true });
      };
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && menu.open) { e.preventDefault(); close(true); } };
      const onDoc = (e: PointerEvent) => { if (menu.open && !menu.contains(e.target as Node)) close(false); };
      menu.addEventListener('toggle', onToggle);
      summary.addEventListener('click', onSummary);
      document.addEventListener('keydown', onKey);
      document.addEventListener('pointerdown', onDoc);
      cleanups.push(() => {
        menu.removeEventListener('toggle', onToggle);
        summary.removeEventListener('click', onSummary);
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('pointerdown', onDoc);
      });
    }

    // Quiet reveals
    if (!reduced && supportsWaapi() && typeof IntersectionObserver !== 'undefined') {
      const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).filter((el) => el.getBoundingClientRect().top > window.innerHeight);
      items.forEach((el) => el.setAttribute('data-reveal', 'pending'));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const el = e.target as HTMLElement;
          const i = Number(el.style.getPropertyValue('--ri') || 0);
          window.setTimeout(() => el.setAttribute('data-reveal', 'in'), i * 90);
        });
      }, { threshold: 0.2 });
      items.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }
    return () => cleanups.forEach((c) => c());
  }, []);
  return null;
}

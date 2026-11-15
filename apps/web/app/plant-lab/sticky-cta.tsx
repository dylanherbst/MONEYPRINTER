'use client';
import { useEffect, useState } from 'react';
import { track } from '../../lib/aimp/analytics';

/**
 * Phones only: once the opening story has scrolled away, the main action stays within thumb reach in a small glass
 * bar at the bottom of the screen. It steps aside again when the closing section (which has its own button) arrives.
 */
export function StickyCta({ href, label, hideOver }: { href: string; label: string; hideOver: string[] }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const targets = hideOver.map((sel) => document.querySelector(sel)).filter((el): el is Element => !!el);
    if (!targets.length) return;
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target, e.isIntersecting);
      setShow(window.scrollY > 200 && ![...seen.values()].some(Boolean));
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [hideOver]);
  return (
    <div className="amp-sticky" data-show={show ? 'true' : undefined} inert={!show}>
      <a className="amp-btn amp-btn-primary" href={href} onClick={() => track('cta_click', { href, cta: 'sticky' })}>{label}</a>
    </div>
  );
}

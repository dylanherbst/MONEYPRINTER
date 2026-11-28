'use client';
import { useEffect, useRef } from 'react';
import { prefersReducedMotion, supportsWaapi } from '../../lib/motion/core';
import { belowViewport, onceVisible, poseStart, runMotion } from '../../lib/motion/run';

/**
 * The shared records every agent works from (same list as before). C10: the first time they come into view each
 * record is revealed through a moving mask, one after another; nothing changes size or position. Shown plainly
 * without JavaScript, with reduced motion, or when already on screen at load.
 */
export function SharedRecords({ items }: { items: string[] }) {
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = list.current;
    if (!el || prefersReducedMotion() || !supportsWaapi() || !belowViewport(el)) return;
    const chips = Array.from(el.querySelectorAll<HTMLElement>('li'));
    const stops = chips.map((c) => poseStart('C10', { focus: c }, { width: c.offsetWidth, radius: 999 }));
    const off = onceVisible(el, () => {
      stops.forEach((s) => s());
      chips.forEach((c, i) => stops.push(runMotion('C10', { focus: c }, { params: { width: c.offsetWidth, radius: 999 }, delay: i * 110 })));
    }, 0.5);
    return () => { off(); stops.forEach((s) => s()); };
  }, []);
  return (
    <ul className="eco-chips" ref={list}>
      {items.map((b) => <li key={b}>{b}</li>)}
    </ul>
  );
}

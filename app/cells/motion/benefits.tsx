'use client';
import { useEffect, useRef, useState } from 'react';
import { useInsertMotion } from '../../../lib/motion/useInsertMotion';
import { belowViewport, onceVisible } from '../../../lib/motion/run';
import { prefersReducedMotion, supportsWaapi } from '../../../lib/motion/core';

/**
 * The three benefit points under the hero (same wording as before), each with a small illustration that plays once
 * when the strip first comes into view:
 *   7 AI agents   → B08 counts to the fixed, published 7 (never an invented metric)
 *   1 platform    → A04 a compact workspace assembles from alternating sides
 *   Less admin    → B02 one drafted item arrives, waiting for your OK
 * Everything is in its final state without JavaScript, with reduced motion, and if the strip is already on screen
 * when the page loads (so nothing is hidden and shown again).
 */
export function Benefits() {
  const list = useRef<HTMLUListElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const tiles = useRef<(HTMLSpanElement | null)[]>([]);
  const draft = useRef<HTMLSpanElement>(null);
  const [armed, setArmed] = useState(false);
  const [size, setSize] = useState({ tile: 120, art: 240 });

  useEffect(() => {
    if (prefersReducedMotion() || !supportsWaapi() || !belowViewport(list.current)) return;
    const art = list.current?.querySelector('.cells-art')?.getBoundingClientRect().width ?? 240;
    setSize({ tile: Math.round(art * 0.3), art: Math.round(art) });
    setArmed(true);
  }, []);

  const count = useInsertMotion('B08', () => (armed && counter.current ? { counter: counter.current } : null), { targetsKey: String(armed), params: { target: 7 }, speed: 1.5 });
  const build = useInsertMotion('A04', () => (armed ? { layers: tiles.current.filter(Boolean) as HTMLElement[] } : null), { targetsKey: `${armed}-${size.tile}`, params: { sideOffset: size.tile }, speed: 2 });
  const arrive = useInsertMotion('B02', () => (armed && draft.current ? { focus: draft.current } : null), { targetsKey: `${armed}-${size.art}`, params: { flyDistance: Math.round(size.art * 0.45), flyDepth: 40 }, speed: 1.5 });

  const plays = [count.play, build.play, arrive.play];
  const playsRef = useRef(plays);
  playsRef.current = plays;
  useEffect(() => {
    if (!armed) return;
    const timers: number[] = [];
    const off = onceVisible(list.current, () => {
      playsRef.current.forEach((p, i) => timers.push(window.setTimeout(p, i * 150)));
    }, 0.5);
    return () => { off(); timers.forEach((t) => window.clearTimeout(t)); };
  }, [armed]);

  return (
    <ul ref={list}>
      <li>
        <span className="cells-art cells-art-count" aria-hidden="true">
          {['Sales', 'Job Manager', 'Business Optimisation', 'Integrations', 'Receptionist', 'Socials & Marketing', 'Growth Manager'].map((n, i) => (
            <i key={n} className={i >= 4 && i <= 5 ? 'is-soon' : undefined} title={n} />
          ))}
        </span>
        <b><span className="cells-sr">7</span><span ref={counter} aria-hidden="true">7</span> AI agents</b>
        <span>Sales, Job Manager, Business Optimisation, Integrations and more, working as one team.</span>
      </li>
      <li>
        <span className="cells-art cells-art-grid" aria-hidden="true">
          {['Prices', 'Jobs', 'Quotes', 'Approvals'].map((n, i) => (
            <span key={n} ref={(el) => { tiles.current[i] = el; }}>{n}</span>
          ))}
        </span>
        <b>1 platform</b>
        <span>Your prices, jobs, quotes and approvals in one place.</span>
      </li>
      <li>
        <span className="cells-art cells-art-draft" aria-hidden="true">
          <span ref={draft}><i>Draft reply</i><em>Waiting for your OK</em></span>
        </span>
        <b>Less admin</b>
        <span>Your AI team drafts the work and you approve it, so you spend more time with customers.</span>
      </li>
    </ul>
  );
}

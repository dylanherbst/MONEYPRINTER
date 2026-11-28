'use client';
import { useEffect, useRef, useState } from 'react';
import { useInsertMotion } from '../../../lib/motion/useInsertMotion';
import { prefersReducedMotion, supportsWaapi } from '../../../lib/motion/core';
import { belowViewport, onceVisible } from '../../../lib/motion/run';

/**
 * Final CTA backdrop (decorative, aria-hidden). B12: a faint echo of the workspace recedes into the background;
 * C06: a low brand glow blooms once and settles. The heading and the CTA are NOT targets: they are plain DOM, visible
 * immediately, and never move. Without JavaScript or with reduced motion the backdrop is shown in its settled state.
 */
export function FinalGlow() {
  const root = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!prefersReducedMotion() && supportsWaapi() && belowViewport(root.current)) setArmed(true); }, []);
  const recede = useInsertMotion('B12', () => (armed && ghost.current ? { stage: ghost.current } : null), { targetsKey: String(armed), speed: 1.6 });
  const bloom = useInsertMotion('C06', () => (armed && glow.current ? { beam: glow.current } : null), { targetsKey: String(armed) });
  const plays = useRef([recede.play, bloom.play]);
  plays.current = [recede.play, bloom.play];
  useEffect(() => {
    if (!armed) return;
    return onceVisible(root.current, () => plays.current.forEach((p) => p()), 0.4);
  }, [armed]);
  return (
    <div className="fg" ref={root} aria-hidden="true">
      <div className="fg-glow" ref={glow} />
      <div className="fg-view">
        <div className="fg-ghost" ref={ghost}>
          <span>Sales · reply drafted</span><span>Job Manager · quote drafted</span><span>Business Optimisation · fixes ready</span>
        </div>
      </div>
    </div>
  );
}

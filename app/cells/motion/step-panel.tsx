'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion, supportsWaapi } from '../../../lib/motion/core';
import { belowViewport, onceVisible, poseStart, runMotion } from '../../../lib/motion/run';

/**
 * Understand → Activate → Grow: one workspace panel that carries through the three steps. The same four blocks change
 * role each step: your setup → your team → your day-to-day.
 *   Step 1 (setup): A04, the setup rows enter from alternating sides.
 *   Step 2 (team):  C01, each block morphs from its setup box into an agent tile, then B10 lights the hub and links.
 *   (The morph is transform-only: blocks never change layout position, so it causes no layout shift.)
 *   Step 3 (ops):   C01, blocks morph from agent tiles into the operations view while A08 turns the panel to flat.
 * Each plays once when its step comes into view. No pinning and no scroll capture (native scroll), so phones get the
 * same three stacked panels. Reduced motion, no JavaScript, or already on screen at load: the final layout, still.
 */
type Stage = 'setup' | 'team' | 'ops';
const ORDER: Stage[] = ['setup', 'team', 'ops'];

const BLOCKS: Record<Stage, { k: string; v: string; tone?: 'work' | 'done' | 'soon' }[]> = {
  setup: [
    { k: 'Your services', v: 'Confirmed by you', tone: 'done' },
    { k: 'Your prices', v: 'Confirmed by you', tone: 'done' },
    { k: 'Your hours', v: 'Mon–Fri, 8–4' },
    { k: 'Business profile', v: '3 quick questions' },
  ],
  team: [
    { k: 'Sales', v: 'Live', tone: 'done' },
    { k: 'Job Manager', v: 'Live', tone: 'done' },
    { k: 'Business Optimisation', v: 'Live', tone: 'done' },
    { k: 'Integrations', v: 'Live', tone: 'done' },
  ],
  ops: [
    { k: 'Enquiries', v: 'Needs your OK', tone: 'work' },
    { k: 'Quotes', v: 'Draft', tone: 'work' },
    { k: 'Payments', v: 'Reminder drafted', tone: 'work' },
    { k: 'Weekly fixes', v: 'Suggested', tone: 'work' },
  ],
};
const TITLE: Record<Stage, string> = { setup: 'Setting up · illustrative', team: 'Your team · illustrative', ops: 'Today · illustrative' };

type Box = { left: number; top: number; width: number; height: number };
const offsetBox = (el: HTMLElement): Box => ({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });

function Blocks({ stage, refs }: { stage: Stage; refs?: (i: number) => (el: HTMLDivElement | null) => void }) {
  return (
    <>
      {BLOCKS[stage].map((b, i) => (
        <div key={i} className="sp-b" ref={refs?.(i)}>
          <b>{b.k}</b>
          <span className={b.tone ? `sp-tone sp-${b.tone}` : 'sp-tone'}>{b.v}</span>
        </div>
      ))}
    </>
  );
}

export function StepPanel({ stage }: { stage: Stage }) {
  const prev = ORDER[Math.max(0, ORDER.indexOf(stage) - 1)];
  const panel = useRef<HTMLDivElement>(null);
  const blocks = useRef<(HTMLDivElement | null)[]>([]);
  const ghosts = useRef<(HTMLDivElement | null)[]>([]);
  const hub = useRef<HTMLSpanElement>(null);
  const links = useRef<SVGSVGElement>(null);
  // The blocks always sit in their own (final) layout, so nothing ever changes layout position (no layout shift).
  // While armed, a ghost copy shows the previous step's layout and the real blocks wait, hidden; on view the ghost
  // goes and each block morphs (C01, transform only) from its ghost twin's box into place.
  const [waiting, setWaiting] = useState(false);
  const [go, setGo] = useState(false);
  const cancels = useRef<(() => void)[]>([]);

  useEffect(() => {
    const el = panel.current;
    if (!el || prefersReducedMotion() || !supportsWaapi() || !belowViewport(el)) return;
    if (stage === 'setup') {
      // A04: pose the hidden start now (off screen), play on view.
      const targets = { layers: blocks.current.filter(Boolean) as HTMLElement[] };
      const params = { sideOffset: Math.round(el.offsetWidth * 0.18) };
      let stop = poseStart('A04', targets, params);
      const off = onceVisible(el, () => { stop(); stop = runMotion('A04', targets, { params, speed: 2.2 }); }, 0.5);
      return () => { off(); stop(); };
    }
    setWaiting(true);
    return onceVisible(el, () => setGo(true), 0.5);
  }, [stage]);

  useLayoutEffect(() => {
    if (!go) return;
    const run = cancels.current;
    blocks.current.forEach((b, i) => {
      const g = ghosts.current[i];
      if (!b || !g) return;
      run.push(runMotion('C01', { focus: b, nodes: Array.from(b.children) as HTMLElement[] }, { params: { from: offsetBox(g), to: offsetBox(b) } }));
    });
    if (stage === 'team') run.push(runMotion('B10', { focus: hub.current, beam: links.current as unknown as HTMLElement, nodes: [] }, { speed: 2, delay: 250 }));
    if (stage === 'ops') run.push(runMotion('A08', { stage: panel.current }, { speed: 2.5 }));
    setWaiting(false);
  }, [go, stage]);

  useEffect(() => () => { cancels.current.forEach((c) => c()); cancels.current = []; }, []);

  return (
    <div className="sp-view" aria-hidden="true">
      <div className="sp" ref={panel}>
        <p className="sp-title">{TITLE[stage]}</p>
        <div className="sp-l" data-layout={stage} data-wait={waiting || undefined}>
          {stage === 'team' && (
            <>
              <svg className="sp-links" ref={links} viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M50 50L25 28M50 50L75 28M50 50L25 72M50 50L75 72" /></svg>
              <span className="sp-hub" ref={hub}>Your business</span>
            </>
          )}
          <Blocks stage={stage} refs={(i) => (el) => { blocks.current[i] = el; }} />
          {stage === 'team' && <p className="sp-foot">Plus Receptionist and Socials &amp; Marketing · Growth Manager behind the scenes</p>}
        </div>
        {stage !== 'setup' && (waiting || go) && (
          <div className="sp-l sp-ghost" data-layout={prev} data-gone={!waiting || undefined}>
            <Blocks stage={prev} refs={(i) => (el) => { ghosts.current[i] = el; }} />
          </div>
        )}
      </div>
    </div>
  );
}

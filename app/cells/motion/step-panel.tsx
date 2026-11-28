'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion, supportsWaapi } from '../../../lib/motion/core';
import { belowViewport, onceVisible, runMotion } from '../../../lib/motion/run';

/**
 * Understand → Activate → Grow: one workspace panel that carries through the three steps. The same four blocks change
 * role each step: your setup → your team → your day-to-day.
 *   Step 1 (setup): A04, the setup rows enter from alternating sides.
 *   Step 2 (team):  C01, each block morphs from its setup box into an agent tile, then B10 lights the hub and links.
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

export function StepPanel({ stage }: { stage: Stage }) {
  const prev = ORDER[Math.max(0, ORDER.indexOf(stage) - 1)];
  const panel = useRef<HTMLDivElement>(null);
  const blocks = useRef<(HTMLDivElement | null)[]>([]);
  const hub = useRef<HTMLSpanElement>(null);
  const links = useRef<SVGSVGElement>(null);
  // `shown` is the layout on screen. Armed panels start in the previous step's layout and morph into their own.
  const [shown, setShown] = useState<Stage>(stage);
  const first = useRef<Box[] | null>(null);
  const cancels = useRef<(() => void)[]>([]);

  useEffect(() => {
    const el = panel.current;
    if (!el || prefersReducedMotion() || !supportsWaapi() || !belowViewport(el)) return;
    if (stage === 'setup') {
      // A04: pose the hidden start now (off screen), play on view.
      let done: (() => void) | null = null;
      const off = onceVisible(el, () => {
        done = runMotion('A04', { layers: blocks.current.filter(Boolean) as HTMLElement[] }, { params: { sideOffset: Math.round(el.offsetWidth * 0.18) }, speed: 2.2 });
      }, 0.5);
      return () => { off(); done?.(); };
    }
    setShown(prev);
    const off = onceVisible(el, () => {
      first.current = blocks.current.map((b) => offsetBox(b!));
      setShown(stage);
    }, 0.5);
    return () => off();
  }, [stage, prev]);

  // After the switch to the real layout: FLIP each block from its old box (C01), plus the step's supporting motion.
  useLayoutEffect(() => {
    const from = first.current;
    if (!from || shown !== stage) return;
    first.current = null;
    const run = cancels.current;
    blocks.current.forEach((b, i) => {
      if (!b) return;
      run.push(runMotion('C01', { focus: b, nodes: Array.from(b.children) as HTMLElement[] }, { params: { from: from[i], to: offsetBox(b) } }));
    });
    if (stage === 'team') run.push(runMotion('B10', { focus: hub.current, beam: links.current as unknown as HTMLElement, nodes: [] }, { speed: 2, delay: 250 }));
    if (stage === 'ops') run.push(runMotion('A08', { stage: panel.current }, { speed: 2.5 }));
  }, [shown, stage]);

  useEffect(() => () => { cancels.current.forEach((c) => c()); cancels.current = []; }, []);

  return (
    <div className="sp-view" aria-hidden="true">
      <div className="sp" data-layout={shown} ref={panel}>
        <p className="sp-title">{TITLE[shown]}</p>
        {shown === 'team' && (
          <>
            <svg className="sp-links" ref={links} viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M50 50L25 28M50 50L75 28M50 50L25 72M50 50L75 72" /></svg>
            <span className="sp-hub" ref={hub}>Your business</span>
          </>
        )}
        {BLOCKS[shown].map((b, i) => (
          <div key={i} className="sp-b" ref={(el) => { blocks.current[i] = el; }}>
            <b>{b.k}</b>
            <span className={b.tone ? `sp-tone sp-${b.tone}` : 'sp-tone'}>{b.v}</span>
          </div>
        ))}
        {shown === 'team' && <p className="sp-foot">Receptionist and Socials &amp; Marketing coming soon · Growth Manager behind the scenes</p>}
      </div>
    </div>
  );
}

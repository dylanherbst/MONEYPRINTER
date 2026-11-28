'use client';
import { useEffect, useRef, useState } from 'react';
import { useInsertMotion } from '../../../lib/motion/useInsertMotion';
import { onceVisible } from '../../../lib/motion/run';
import { prefersReducedMotion } from '../../../lib/motion/core';

/**
 * Home hero: an illustrative recreation of the InsertAgentic workspace (fictional customer, drafts waiting for the
 * owner's OK). A09 runs ONCE when it first comes into view (6s: flat hold, tilt, layers separate, drift, collapse,
 * back to flat), with a Replay button. Phones (<720px) and reduced motion get the static front view; the headline and
 * CTA above it are plain DOM and never wait for this.
 */
export function HeroProduct() {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const [wide, setWide] = useState(false);
  const [depthStep, setDepthStep] = useState(40);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 720px)');
    const on = () => {
      // Phones and reduced motion: no motion is built at all (static front view, no transform).
      setWide(mq.matches && !prefersReducedMotion());
      // Layer separation scales with the measured stage (the engine's 46px step is for a 290px demo stage).
      const w = stage.current?.getBoundingClientRect().width ?? 0;
      setDepthStep(Math.round(Math.max(24, Math.min(46, w * 0.042))));
    };
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const motion = useInsertMotion('A09', () => (wide && stage.current ? { stage: stage.current, layers: layers.current.filter(Boolean) as HTMLElement[] } : null), {
    targetsKey: `${wide}-${depthStep}`,
    params: { depthStep },
  });
  const animated = wide && motion.supported && !motion.reducedMotion;

  // Once, on first view. Never loops.
  const played = useRef(false);
  const { play } = motion;
  useEffect(() => {
    if (!animated || played.current) return;
    return onceVisible(wrap.current, () => { played.current = true; play(); }, 0.35);
  }, [animated, play]);

  const L = (i: number) => (el: HTMLDivElement | null) => { layers.current[i] = el; };

  return (
    <div className="hx" ref={wrap}>
      <div className="hx-view" role="img" aria-label="Illustrative demo of the InsertAgentic workspace: a new enquiry with a drafted reply, a draft quote, this week's suggested fixes and an approval waiting for the owner. Fictional customer; nothing is sent.">
        <div className="hx-stage" ref={stage} aria-hidden="true">
          <div className="hx-shell">
            <div className="hx-side">
              <span className="hx-brand"><img src="/brand/logo.webp" alt="" width={18} height={18} />InsertAgentic</span>
              <span className="is-on">Today</span><span>Enquiries</span><span>Jobs</span><span>Quotes &amp; invoices</span><span>Weekly fixes</span><span>Integrations</span>
            </div>
            <span className="hx-demo">Illustrative demo · fictional data</span>
          </div>
          <div className="hx-layer hx-l0" ref={L(0)}>
            <b>Good morning, Sam</b>
            <span className="hx-chip hx-work">Drafts waiting for your OK</span>
          </div>
          <div className="hx-layer hx-l1" ref={L(1)}>
            <span className="hx-k">New enquiry · Sales</span>
            <b>Priya M. · website form</b>
            <p>“Hi, could you quote a deep clean for a 3-bedroom house this week?”</p>
            <span className="hx-chip hx-work">Reply drafted · waiting for your OK</span>
          </div>
          <div className="hx-layer hx-l2" ref={L(2)}>
            <span className="hx-k">Quote Q-0142 · Job Manager</span>
            <p>Deep clean, 3-bedroom<br /><small>From your price list</small></p>
            <b>A$380 incl. GST</b>
            <span className="hx-chip">Draft · not sent</span>
          </div>
          <div className="hx-layer hx-l3" ref={L(3)}>
            <span className="hx-k">This week · Business Optimisation</span>
            <p>Follow up a quote sent 9 days ago</p>
            <p>Remind a customer about an overdue invoice</p>
          </div>
          <div className="hx-layer hx-l4" ref={L(4)}>
            <b>Send this reply to Priya?</b>
            <span className="hx-btns"><span className="hx-btn">Approve</span><span className="hx-btn hx-ghost">Edit</span></span>
            <small>Nothing goes out without your OK.</small>
          </div>
        </div>
      </div>
      {animated && (
        <button type="button" className="hx-replay" onClick={motion.replay} disabled={motion.playing}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {motion.playing ? 'Playing' : 'Replay'}
        </button>
      )}
    </div>
  );
}

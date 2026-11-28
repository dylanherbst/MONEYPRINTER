'use client';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { prefersReducedMotion, supportsWaapi } from '../../lib/motion/core';
import { belowViewport, onceVisible, poseStart, runMotion } from '../../lib/motion/run';

/**
 * Illustrative demo of owner approval (C04). A drafted reply arrives at the gate and waits; only YOUR click on
 * Approve unlocks it. Nothing is sent: the approved state says so. Reset puts it back.
 */
type Phase = 'gate' | 'approved';
export function ApprovalDemo() {
  const root = useRef<HTMLDivElement>(null);
  const draft = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const wait = useRef<HTMLSpanElement>(null);
  const ok = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>('gate');
  const targets = () => ({ focus: draft.current, beam: bar.current, overlay: btn.current, nodes: [wait.current, ok.current].filter(Boolean) as HTMLElement[] });

  useEffect(() => {
    if (prefersReducedMotion() || !supportsWaapi() || !belowViewport(root.current)) return;
    // Pose the start (draft before the gate) while it is off screen, then let it arrive on view.
    let stop = poseStart('C04', targets(), { phase: 'arrive' });
    const off = onceVisible(root.current, () => { stop(); stop = runMotion('C04', targets(), { params: { phase: 'arrive' } }); }, 0.5);
    return () => { off(); stop(); };
  }, []);

  const approve = () => runMotion('C04', targets(), { params: { phase: 'unlock', advance: 8 }, onEnd: () => flushSync(() => setPhase('approved')) });
  const reset = () => { setPhase('gate'); runMotion('C04', targets(), { params: { phase: 'arrive' } }); };

  return (
    <div className="ad" ref={root} data-phase={phase}>
      <p className="ad-k">Illustrative demo · owner approval</p>
      <div className="ad-row">
        <div className="ad-draft" ref={draft}><b>Draft reply to a customer</b><span>“Thanks for your enquiry. I can hold Thursday at 9 am. Does that suit?”</span></div>
        <span className="ad-bar" ref={bar} aria-hidden="true" />
        <button type="button" ref={btn} className="ad-btn" onClick={approve} disabled={phase !== 'gate'}>Approve<span className="cells-sr"> this demo draft</span></button>
      </div>
      <p className="ad-status" aria-live="polite">
        <span className="ad-wait" ref={wait}>Waiting for your OK. Nothing goes out until you approve it.</span>
        <span className="ad-ok" ref={ok}>Approved by you. In this demo nothing was sent.</span>
      </p>
      {phase === 'approved' && <button type="button" className="ad-reset" onClick={reset}>Reset the demo</button>}
    </div>
  );
}

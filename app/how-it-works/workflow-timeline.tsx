'use client';
import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, supportsWaapi } from '../../lib/motion/core';
import { belowViewport, onceVisible, runMotion } from '../../lib/motion/run';

/**
 * The five steps (same wording as before) as a workflow timeline. C03: the first time the list scrolls into view the
 * progress rail fills from step to step (about 450ms each) and each marker settles as done; Replay runs it again.
 * Every step's text is always visible. Without JavaScript, with reduced motion, or if the list is already on screen at
 * load, the timeline is shown complete.
 */
export function WorkflowTimeline({ steps }: { steps: { title: string; body: string }[] }) {
  const n = steps.length;
  const list = useRef<HTMLOListElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const marks = useRef<(HTMLSpanElement | null)[]>([]);
  const [done, setDone] = useState(n);
  const [armed, setArmed] = useState(false);
  const [running, setRunning] = useState(false);
  const cancel = useRef<() => void>(() => {});

  const runAll = () => {
    cancel.current();
    let live = true;
    let stop = () => {};
    cancel.current = () => { live = false; stop(); setRunning(false); };
    setRunning(true);
    setDone(0);
    const next = (i: number) => {
      if (!live) return;
      if (i >= n) { setRunning(false); return; }
      stop = runMotion('C03', { beam: fill.current, nodes: marks.current.filter(Boolean) as HTMLElement[] },
        { params: { from: Math.max(0, i - 1), to: i, count: n, axis: 'y' }, onEnd: () => { setDone(i + 1); window.setTimeout(() => next(i + 1), 90); } });
    };
    next(0);
  };
  const runRef = useRef(runAll);
  runRef.current = runAll;

  useEffect(() => {
    if (prefersReducedMotion() || !supportsWaapi() || !belowViewport(list.current)) return;
    setArmed(true);
    setDone(0);
    const off = onceVisible(list.current, () => runRef.current(), 0.4);
    return () => { off(); cancel.current(); };
  }, []);

  const p = Math.max(0, done - 1) / (n - 1);
  return (
    <div className="cw">
      <ol className="cells-check cw-list" ref={list} style={{ ['--p' as string]: p }}>
        <span className="cw-rail" aria-hidden="true"><span className="cw-fill" ref={fill} /></span>
        {steps.map((s, i) => (
          <li key={s.title} data-done={i < done || undefined}>
            <span className="cw-m" ref={(el) => { marks.current[i] = el; }} aria-hidden="true">{i + 1}</span>
            <span><b>{s.title}.</b> {s.body}</span>
          </li>
        ))}
      </ol>
      {armed && <button type="button" className="cw-replay" onClick={runAll} disabled={running}>Replay the steps</button>}
    </div>
  );
}

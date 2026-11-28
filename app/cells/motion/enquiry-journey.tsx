'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { prefersReducedMotion } from '../../../lib/motion/core';
import { onceVisible, runMotion, type RunOptions } from '../../../lib/motion/run';
import type { PresetId, MotionTargets } from '../../../lib/motion/registry';

/**
 * Illustrative demo: one fictional enquiry from first message to payment reminder (about 11 s).
 * Rail and step changes: C03. Step motions: B02 (enquiry arrives), B04 (reply drafted), C04 (approval gate before
 * the reply, the quote, the booking and the reminder), B07 + B06 (job moves to Booked, then the confirmation).
 * Plays once when it comes into view (or on Play); Pause, Replay, Previous/Next and the step buttons control it. When
 * you step through by hand, each gate waits for YOU to press Approve. Nothing is sent, booked or charged, and the last
 * step never shows "paid": that only happens when Stripe confirms a payment.
 */
type Phase = 'intro' | 'gate' | 'approved';
const STEPS = [
  { title: 'Enquiry arrives', caption: 'A new enquiry arrives. Sales reads it alongside your services and prices.', gate: false },
  { title: 'Reply drafted', caption: 'Sales drafts a reply from your price list and offers a time. It waits for your OK.', gate: true },
  { title: 'Quote drafted', caption: 'Job Manager drafts the quote with correct GST. Once you approve it, the customer accepts through a link.', gate: true },
  { title: 'Job booked', caption: 'After your OK the job moves to Booked and the time is held in your calendar.', gate: true },
  { title: 'Invoice and reminder', caption: 'Job Manager drafts the invoice and a polite reminder. It only shows as paid when Stripe confirms the payment.', gate: true },
];
const N = STEPS.length;
const sleep = (ms: number, token: { live: boolean }) => new Promise<void>((res) => { const t = window.setTimeout(res, ms); if (!token.live) { window.clearTimeout(t); res(); } });

export function EnquiryJourney() {
  const root = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const rail = useRef<HTMLSpanElement>(null);
  const markers = useRef<(HTMLButtonElement | null)[]>([]);
  const [step, setStep] = useState(0);
  const [phases, setPhases] = useState<Phase[]>(() => STEPS.map((s) => (s.gate ? 'gate' : 'approved')));
  const [moved, setMoved] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const token = useRef({ live: false });
  const stepRef = useRef(0);
  stepRef.current = step;
  const phasesRef = useRef(phases);

  useEffect(() => { setReduced(prefersReducedMotion()); }, []);

  const q = (i: number, t: string) => panels.current[i]?.querySelector<HTMLElement>(`[data-t="${t}"]`) ?? null;
  const qa = (i: number, t: string) => Array.from(panels.current[i]?.querySelectorAll<HTMLElement>(`[data-t="${t}"]`) ?? []);
  // `after` commits the motion's end state to React synchronously, before the motion's fills are removed.
  const run = useCallback((id: PresetId, targets: MotionTargets, o: RunOptions = {}, after?: () => void) =>
    new Promise<void>((res) => {
      runMotion(id, targets, { ...o, reduced: o.reduced ?? reduced, onEnd: () => { if (after) flushSync(after); res(); } });
    }), [reduced]);
  const setPhase = (i: number, p: Phase) => {
    phasesRef.current = phasesRef.current.map((v, k) => (k === i ? p : v));
    setPhases(phasesRef.current);
  };
  const setAll = (p: Phase) => { phasesRef.current = STEPS.map(() => p); setPhases(phasesRef.current); };
  const gateTargets = (i: number) => ({ focus: q(i, 'draft'), beam: q(i, 'gate'), overlay: q(i, 'approve'), nodes: [q(i, 'waiting'), q(i, 'approved')].filter(Boolean) as HTMLElement[] });

  /** Show step `to`: rail fills (C03), panels swap, then that step's own motion and, if it has one, the gate arrives. */
  const enter = useCallback(async (to: number, from: number, tk: { live: boolean }) => {
    setPhase(to, 'intro');
    if (to === 3) setMoved(false);
    setPressed(false);
    const c03 = run('C03', { beam: rail.current, nodes: markers.current.filter(Boolean) as HTMLElement[], layers: panels.current.filter(Boolean) as HTMLElement[] }, { params: { from, to, count: N }, speed: 1.5 });
    setStep(to);
    await c03;
    if (!tk.live) return;
    if (to === 0) await run('B02', { focus: q(0, 'new') }, { params: { flyDistance: Math.round((panels.current[0]?.offsetWidth ?? 300) * 0.4), flyDepth: 40 }, speed: 2.2 });
    if (to === 1) await run('B04', { nodes: qa(1, 'bubble') }, { speed: 2 });
    if (!tk.live || !STEPS[to].gate) { setPhase(to, 'approved'); return; }
    await run('C04', gateTargets(to), { params: { phase: 'arrive' } }, () => setPhase(to, 'gate'));
  }, [run]);

  /** The owner's explicit action: unlock the gate (C04), then any result of the approval (step 4: B07 + B06). */
  const approve = useCallback(async (i: number) => {
    await run('C04', gateTargets(i), { params: { phase: 'unlock', advance: 8 } }, () => setPhase(i, 'approved'));
    if (i === 3) {
      const card = q(3, 'job');
      const cols = qa(3, 'col');
      const travel = cols.length === 2 ? cols[1].offsetLeft - cols[0].offsetLeft : 160;
      const b07 = run('B07', { focus: card, overlay: q(3, 'booked') }, { params: { travel }, speed: 2.4 }, () => setMoved(true));
      await new Promise((r) => window.setTimeout(r, reduced ? 0 : 560));
      const b06 = run('B06', { focus: q(3, 'confirm'), overlay: q(3, 'tick') }, { speed: 2.4 });
      await Promise.all([b07, b06]);
    }
  }, [run, reduced]);

  // Autoplay script: continue from the current step and phase; the "owner" taps Approve on screen (labelled).
  const play = useCallback(async (restart: boolean) => {
    token.current.live = false;
    const tk = { live: true };
    token.current = tk;
    setPlaying(true);
    let s = restart ? 0 : stepRef.current;
    if (restart || (s === N - 1 && phasesRef.current[s] === 'approved')) { s = 0; setAll('intro'); setMoved(false); }
    let resume = true; // the first step continues from its current phase; later steps start fresh
    for (; s < N && tk.live; s++) {
      const ph: Phase = resume ? phasesRef.current[s] : 'intro';
      resume = false;
      if (ph === 'intro') await enter(s, Math.max(0, s - 1), tk);
      if (!tk.live) break;
      if (STEPS[s].gate && phasesRef.current[s] !== 'approved') {
        await sleep(220, tk); if (!tk.live) break;
        setPressed(true);
        await sleep(140, tk); if (!tk.live) break;
        await approve(s);
      }
      await sleep(s === N - 1 ? 0 : 300, tk);
    }
    if (tk.live) setPlaying(false);
  }, [enter, approve]);

  const pause = () => { token.current.live = false; setPlaying(false); };
  const goTo = async (to: number) => {
    pause();
    if (to === stepRef.current) return;
    const tk = { live: true };
    token.current = tk;
    const from = stepRef.current;
    await enter(to, from, tk);
    if (to === 3 && phasesRef.current[3] === 'approved') setMoved(true);
  };

  // Once, when it first comes into view (not with reduced motion).
  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el || el.getBoundingClientRect().top < window.innerHeight) return; // already on screen at load: wait for Play
    setAll('intro');
    setMoved(false);
    return onceVisible(el, () => { void play(true); }, 0.45);
  }, [reduced, play]);
  useEffect(() => () => { token.current.live = false; }, []);

  const s = STEPS[step];
  const gate = (i: number, ask: string, done: string) => (
    <div className="cj-gate" data-phase={phases[i]}>
      <span className="cj-bar" data-t="gate" />
      <span className="cj-wait" data-t="waiting">{ask}</span>
      <span className="cj-ok" data-t="approved">{done}</span>
      <button type="button" className={`cj-approve${pressed && step === i ? ' is-pressed' : ''}`} data-t="approve"
        disabled={phases[i] !== 'gate' || playing} tabIndex={phases[i] === 'gate' && step === i ? 0 : -1}
        onClick={() => { void approve(i); }}>
        Approve<span className="cells-sr"> (demo)</span>
      </button>
    </div>
  );

  return (
    <div className="cj" ref={root}>
      <ol className="cj-rail" style={{ ['--p' as string]: step / (N - 1) }}>
        <span className="cj-fill" ref={rail} aria-hidden="true" />
        {STEPS.map((st, i) => (
          <li key={st.title}>
            <button type="button" ref={(el) => { markers.current[i] = el; }} className={`cj-m${i < step ? ' is-done' : ''}${i === step ? ' is-on' : ''}`}
              aria-current={i === step ? 'step' : undefined} onClick={() => { void goTo(i); }}>
              <span className="cj-n" aria-hidden="true">{i + 1}</span><span className="cj-t">{st.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="cj-stage">
        <div className="cj-p" data-active={step === 0 || undefined} inert={step !== 0} ref={(el) => { panels.current[0] = el; }}>
          <p className="cj-k">Enquiries · Sales</p>
          <div className="cj-row cj-old"><b>Tom · gutter clean</b><span>Replied, approved by you</span></div>
          <div className="cj-row cj-old"><b>Ana · window clean</b><span>Quote drafted</span></div>
          <div className="cj-row cj-new" data-t="new"><b>New · Priya M. · website form</b><span>“Hi, could you quote a deep clean for a 3-bedroom house this week?”</span></div>
        </div>

        <div className="cj-p" data-active={step === 1 || undefined} inert={step !== 1} ref={(el) => { panels.current[1] = el; }}>
          <p className="cj-k">Conversation · Sales</p>
          <p className="cj-bub cj-them" data-t="bubble">Hi, could you quote a deep clean for a 3-bedroom house this week?</p>
          <div className="cj-bub cj-us" data-t="bubble"><span data-t="draft">Hi Priya, thanks for getting in touch. A deep clean for a 3-bedroom home is A$380 incl. GST. I can hold Thursday at 9 am for you. Does that suit?</span><small>Draft by Sales · not sent</small></div>
          {gate(1, 'Waiting for your OK', 'Approved by you · in the real app it would send now (demo: nothing sent)')}
        </div>

        <div className="cj-p" data-active={step === 2 || undefined} inert={step !== 2} ref={(el) => { panels.current[2] = el; }}>
          <p className="cj-k">Quote Q-0142 · Job Manager</p>
          <div className="cj-doc" data-t="draft">
            <span><b>Deep clean, 3-bedroom</b><em>From your price list</em></span>
            <span>Subtotal<b>A$345.45</b></span><span>GST<b>A$34.55</b></span><span className="cj-total">Total<b>A$380.00</b></span>
            <span className="cj-link">Accept link: included when you send it</span>
          </div>
          {gate(2, 'Draft · waiting for your OK', 'Approved by you · the customer accepts through the link (demo)')}
        </div>

        <div className="cj-p" data-active={step === 3 || undefined} inert={step !== 3} ref={(el) => { panels.current[3] = el; }}>
          <p className="cj-k">Jobs · Job Manager</p>
          <div className="cj-board" data-moved={moved || undefined}>
            <div className="cj-col" data-t="col"><span>Quote accepted</span></div>
            <div className="cj-col" data-t="col"><span>Booked</span></div>
            <div className="cj-job" data-t="job"><b>Priya M. · deep clean</b><span>Thu 9:00 am</span><em data-t="booked">Booked (demo)</em></div>
          </div>
          <div className="cj-confirm" data-t="confirm" data-shown={moved || undefined}><span className="cj-tick" data-t="tick">✓</span>Calendar hold for Thu 9:00 am, after your OK (demo)</div>
          {gate(3, 'Book Thursday 9 am? Waiting for your OK', 'Approved by you')}
        </div>

        <div className="cj-p" data-active={step === 4 || undefined} inert={step !== 4} ref={(el) => { panels.current[4] = el; }}>
          <p className="cj-k">Invoice INV-0142 · Job Manager</p>
          <div className="cj-doc cj-inv"><span>Deep clean, 3-bedroom<b>A$380.00 incl. GST</b></span><span>Due Friday · Unpaid</span></div>
          <p className="cj-bub cj-us"><span data-t="draft">Hi Priya, a friendly reminder that invoice INV-0142 is due on Friday. You can pay by card through the secure link.</span><small>Reminder drafted · not sent</small></p>
          {gate(4, 'Waiting for your OK', 'Approved by you (demo). It shows as paid only when Stripe confirms the payment.')}
        </div>
        <span className="cj-demo">Illustrative demo · fictional customer · nothing is sent</span>
      </div>

      <p className="cj-cap" aria-live="polite"><b>Step {step + 1} of {N}:</b> {s.caption}{playing && s.gate && phases[step] === 'gate' ? ' (Demo: the owner taps Approve.)' : ''}</p>
      <div className="cj-ctl">
        <button type="button" onClick={() => { void goTo(Math.max(0, step - 1)); }} disabled={step === 0}>Previous</button>
        {playing
          ? <button type="button" className="cj-main" onClick={pause}>Pause</button>
          : <button type="button" className="cj-main" onClick={() => { void play(false); }} disabled={reduced}>Play</button>}
        <button type="button" onClick={() => { void goTo(Math.min(N - 1, step + 1)); }} disabled={step === N - 1}>Next</button>
        <button type="button" onClick={() => { void play(true); }} disabled={reduced}>Replay</button>
      </div>
    </div>
  );
}

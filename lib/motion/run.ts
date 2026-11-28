// Imperative runner for one-off motions triggered by events (a step change, a selection, an owner action).
// One requestAnimationFrame loop per run; returns a cancel function. Use useInsertMotion for motions bound to a
// component for its whole life (with play/pause/replay controls).
import { prefersReducedMotion, supportsWaapi } from './core';
import { createPreset, type MotionHandle, type MotionParams, type MotionTargets, type PresetId } from './registry';

export interface RunOptions {
  params?: MotionParams;
  /** Playback rate; 2 = twice as fast as the catalogue duration. */
  speed?: number;
  /** Start after this many ms. */
  delay?: number;
  /** Keep the final fill after the end (default false: tracks are cancelled so the element's own CSS state shows,
   *  which must equal the motion's end state). */
  keep?: boolean;
  /** Treat as reduced motion (jump to the end) regardless of the OS setting. */
  reduced?: boolean;
  onEnd?: () => void;
}

export function runMotion(id: PresetId, targets: MotionTargets, o: RunOptions = {}): () => void {
  if (!supportsWaapi()) { o.onEnd?.(); return () => {}; }
  let m: MotionHandle | null = null;
  let raf = 0;
  let timer = 0;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    if (m) m.seek(m.duration);
    // onEnd runs BEFORE the tracks are cancelled, so a caller can commit the matching end state to the DOM
    // synchronously (e.g. React flushSync) and nothing flickers back to the start pose for a frame.
    o.onEnd?.();
    if (m && !o.keep) m.destroy();
  };
  const start = () => {
    m = createPreset(id, targets, o.params);
    if (o.reduced ?? prefersReducedMotion()) { finish(); return; }
    m.seek(0);
    const speed = o.speed ?? 1;
    let last = performance.now();
    let t = 0;
    const frame = (now: number) => {
      if (!m || done) return;
      t += (now - last) * speed;
      last = now;
      if (t >= m.duration) { finish(); return; }
      m.seek(t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };
  if (o.delay) {
    // Pose the start immediately so nothing flashes in its end state during the delay.
    m = createPreset(id, targets, o.params);
    if (!(o.reduced ?? prefersReducedMotion())) m.seek(0);
    const pre = m;
    timer = window.setTimeout(() => { pre.destroy(); m = null; start(); }, o.delay);
  } else start();
  return () => {
    window.clearTimeout(timer);
    cancelAnimationFrame(raf);
    if (m && !done) { m.seek(m.duration); if (!o.keep) m.destroy(); }
    done = true;
  };
}

/** True when the element is entirely below the visible screen (so a hide-then-reveal entrance cannot flash). */
export function belowViewport(el: Element | null) {
  if (!el || typeof window === 'undefined') return false;
  return el.getBoundingClientRect().top > window.innerHeight;
}

/** Calls `fn` once when `el` is at least `threshold` visible. Returns a disconnect function. */
export function onceVisible(el: Element | null, fn: () => void, threshold = 0.35) {
  if (!el || typeof IntersectionObserver === 'undefined') { fn(); return () => {}; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { threshold });
  io.observe(el);
  return () => io.disconnect();
}

/** Holds a preset at its start pose (no clock running) until the returned function is called, which removes it.
 *  Use it to hide an entrance's start state while the element is still off screen, then call runMotion on view. */
export function poseStart(id: PresetId, targets: MotionTargets, params?: MotionParams): () => void {
  if (!supportsWaapi()) return () => {};
  const m = createPreset(id, targets, params);
  m.seek(0);
  return () => m.destroy();
}

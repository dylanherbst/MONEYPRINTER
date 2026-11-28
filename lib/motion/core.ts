// Shared building blocks for the motion registry. Same contract as the canonical V2 engine (insert-motion.js):
// every preset builds PAUSED Web Animations tracks and returns { duration, animations, seek(ms), destroy() }.
// The caller drives time (useInsertMotion does it with one requestAnimationFrame loop).
import type { MotionHandle, MotionTargets } from './insert-motion';

export type { MotionHandle, MotionTargets };

/** Same easings as the engine. */
export const EASE_OUT = 'cubic-bezier(.22,.8,.25,1)';
export const EASE_IN_OUT = 'cubic-bezier(.65,0,.35,1)';

export type Keyframes = Keyframe[];

/** Collects paused tracks for one preset and turns them into a MotionHandle. */
export function timeline(duration: number) {
  const animations: Animation[] = [];
  let tick: (ms: number) => void = () => {};
  const track = (el: Element | null | undefined, frames: Keyframes, opts: KeyframeAnimationOptions = {}) => {
    if (!el || typeof (el as HTMLElement).animate !== 'function') return;
    const a = (el as HTMLElement).animate(frames, { duration, fill: 'both', easing: 'linear', ...opts });
    a.pause();
    a.currentTime = 0;
    animations.push(a);
  };
  const tr = (el: Element | null | undefined, values: (string | Keyframe)[], opts: KeyframeAnimationOptions = {}) =>
    track(el, values.map((v) => (typeof v === 'string' ? { transform: v } : v)), opts);
  const onTick = (fn: (ms: number) => void) => { tick = fn; };
  const handle = (): MotionHandle => ({
    duration,
    animations,
    seek(ms: number) {
      const t = Math.max(0, Math.min(duration, ms));
      animations.forEach((a) => { a.currentTime = t; });
      tick(t);
    },
    destroy() { animations.forEach((a) => a.cancel()); },
  });
  return { track, tr, onTick, handle };
}

export const z = (n: number) => `translateZ(${n}px)`;
export const xyz = (x: number, y: number, d: number) => `translate3d(${x}px,${y}px,${d}px)`;
export const FLAT = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
export const TILT = 'rotateX(55deg) rotateY(0deg) rotateZ(0deg)';
export const ISO = 'rotateX(55deg) rotateY(-42deg) rotateZ(0deg)';
export const DRIFT = 'rotateX(55deg) rotateY(-36deg) rotateZ(0deg)';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export function supportsWaapi() {
  return typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
}

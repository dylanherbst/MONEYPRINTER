// Parameterised production versions of the V2 presets that contain prototype numbers (layer depths, A04 entry offset,
// B02 fly distance, B03/B09 spread, B07 travel, B08 target value, B11 scan travel).
//
// The choreography, keyframe order, easing, delays and durations are IDENTICAL to insert-motion.js; only the numbers
// come from the caller (measured from the real component). With no params, each one produces the same keyframes as
// the canonical engine; /lab/motion checks that parity in the browser ("Engine parity" button).
import { DRIFT, EASE_IN_OUT as IO, EASE_OUT as E, FLAT, ISO, timeline, xyz, z } from './core';
import type { MotionHandle, MotionTargets } from './core';

export interface MotionParams {
  /** A03/A06/A07/A09: Z distance between neighbouring layers (engine: 46px, i.e. 46, 92, 138, 184, 230). */
  depthStep?: number;
  /** A04: horizontal entry offset in px (engine: 110). */
  sideOffset?: number;
  /** B02: entry distance in px from the right (engine: 210) and entry depth (engine: 70). */
  flyDistance?: number;
  flyDepth?: number;
  /** B03 (engine: 140) / B09 (engine: 128): lateral spread between neighbouring cards. */
  spread?: number;
  /** B07: column-to-column travel in px (engine: 165). */
  travel?: number;
  /** B08: the real value to count to (engine: 24, a demo number). Required for production use. */
  target?: number;
  /** B11: beam travel in px (engine: 210). */
  scanTravel?: number;
  /** B10: delay between node reveals in ms (engine: 300, sized for its 3 demo nodes). Pass a smaller value for more
   *  nodes so the last one still finishes inside the 2.5s preset. */
  nodeStagger?: number;
  /** C-series parameters (see c-series.ts). */
  [key: string]: unknown;
}

/** Presets with prototype numbers; the registry routes these here when params are given. */
export const PARAMETERISED = ['A03', 'A04', 'A06', 'A07', 'A09', 'B02', 'B03', 'B07', 'B08', 'B09', 'B10', 'B11'] as const;
const DURATION: Record<(typeof PARAMETERISED)[number], number> = {
  A03: 1800, A04: 2400, A06: 2700, A07: 1500, A09: 6000, B02: 1700, B03: 2200, B07: 2200, B08: 1800, B09: 2100, B10: 2500, B11: 2200,
};

export function createParamPreset(id: (typeof PARAMETERISED)[number], t: MotionTargets, p: MotionParams = {}): MotionHandle {
  const D = DURATION[id];
  const { track, tr, onTick, handle } = timeline(D);
  const layers = t.layers || [];
  const step = typeof p.depthStep === 'number' ? p.depthStep : 46;
  const depth = (i: number) => Math.min(i + 1, 5) * step;
  const stage = (a: string, b: string, opts: KeyframeAnimationOptions = {}) => tr(t.stage, [a, b], { easing: IO, ...opts });
  const layer = (i: number, a: string, b: string, opts: KeyframeAnimationOptions = {}) => tr(layers[i], [a, b], { easing: E, ...opts });
  const reveal = (el: Element | null | undefined, delay = 0, duration = 650) =>
    track(el, [{ opacity: 0, transform: 'translateY(16px) scale(.92)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { delay, duration, easing: E });

  switch (id) {
    case 'A03':
      stage(ISO, ISO);
      layers.forEach((_, i) => layer(i, z(0), z(depth(i)), { duration: 1300 }));
      break;
    case 'A04': {
      const off = p.sideOffset ?? 110;
      stage(FLAT, FLAT);
      [...layers].reverse().forEach((el, i) => tr(el, [{ opacity: 0, transform: xyz(i % 2 ? off : -off, 0, 0) }, { opacity: 1, transform: xyz(0, 0, 0) }], { delay: i * 340, duration: 700, easing: E }));
      break;
    }
    case 'A06':
      stage(ISO, DRIFT);
      layers.forEach((_, i) => layer(i, z(depth(i)), z(depth(i))));
      break;
    case 'A07':
      stage(ISO, ISO);
      layers.forEach((_, i) => layer(i, z(depth(i)), z(0), { delay: i * 60, duration: 900, easing: IO }));
      break;
    case 'A09':
      tr(t.stage, [{ transform: FLAT, offset: 0 }, { transform: FLAT, offset: 0.1, easing: IO }, { transform: ISO, offset: 0.3 }, { transform: DRIFT, offset: 0.75, easing: IO }, { transform: FLAT, offset: 0.95 }, { transform: FLAT, offset: 1 }]);
      layers.forEach((_, i) => {
        const start = (1150 + i * 70) / 6000, end = (1950 + i * 70) / 6000, down = (3750 + i * 60) / 6000, finish = (4650 + i * 60) / 6000;
        tr(layers[i], [{ transform: z(0), offset: 0 }, { transform: z(0), offset: start, easing: E }, { transform: z(depth(i)), offset: end }, { transform: z(depth(i)), offset: down, easing: IO }, { transform: z(0), offset: finish }, { transform: z(0), offset: 1 }]);
      });
      break;
    case 'B02': {
      const d = p.flyDistance ?? 210, dz = p.flyDepth ?? 70;
      tr(t.focus, [{ opacity: 0, transform: xyz(d, 0, dz) + ' rotateY(-24deg)' }, { opacity: 1, transform: xyz(0, 0, 0) + ' rotateY(0deg)' }], { duration: 1100, easing: E });
      break;
    }
    case 'B03': {
      const s = p.spread ?? 140;
      stage('rotateX(18deg) rotateY(0deg)', 'rotateX(18deg) rotateY(0deg)');
      [0, 1, 2].forEach((i) => tr(t.nodes?.[i], [xyz(0, 0, 0), xyz((i - 1) * s, Math.abs(i - 1) * 18, i === 1 ? 105 : 35) + ` rotateY(${(i - 1) * -28}deg)`], { duration: 1400, easing: E }));
      break;
    }
    case 'B07': {
      const d = p.travel ?? 165;
      tr(t.focus, [{ transform: xyz(0, 0, 0), offset: 0 }, { transform: xyz(0, -20, 75), offset: 0.3 }, { transform: xyz(d, -20, 75), offset: 0.75 }, { transform: xyz(d, 0, 0), offset: 1 }], { duration: 1800, easing: IO });
      reveal(t.overlay, 1550, 500);
      break;
    }
    case 'B08': {
      const target = p.target ?? 24;
      onTick((ms) => { if (t.counter) t.counter.textContent = String(Math.round(target * (1 - Math.pow(1 - Math.min(1, ms / 1450), 3)))); });
      break;
    }
    case 'B09': {
      const s = p.spread ?? 128;
      (t.nodes || []).forEach((el, i) => tr(el, [{ opacity: i === 1 ? 1 : 0, transform: xyz(0, 0, 0) }, { opacity: 1, transform: xyz((i - 1) * s, Math.abs(i - 1) * 25, Math.abs(i - 1) * 25) + ` rotateZ(${(i - 1) * 12}deg)` }], { delay: i * 100, duration: 1200, easing: E }));
      break;
    }
    case 'B10': {
      const st = p.nodeStagger ?? 300;
      reveal(t.focus, 0, 450);
      track(t.beam, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }], { delay: 400, duration: 800, easing: E });
      (t.nodes || []).forEach((el, i) => reveal(el, 650 + i * st, 550));
      break;
    }
    case 'B11': {
      const d = p.scanTravel ?? 210;
      tr(t.beam, [{ opacity: 0, transform: 'translateY(0)' }, { opacity: 1, transform: 'translateY(0)' }, { opacity: 1, transform: `translateY(${d}px)` }, { opacity: 0, transform: `translateY(${d}px)` }], { duration: 1500 });
      track(t.focus, [{ boxShadow: '0 0 0 0 #8b5cf600' }, { boxShadow: '0 0 0 4px #8b5cf660,0 0 40px #8b5cf655' }], { delay: 1000, duration: 700 });
      break;
    }
  }
  return handle();
}

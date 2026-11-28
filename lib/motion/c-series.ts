// C01–C12: new presets, implemented to the specifications in COMPLETE_HANDOFF.md (C-series table, 28 Nov 2026).
// Same handle contract as the V2 engine: paused WAAPI tracks, deterministic seek(ms), destroy() cancels everything.
// All distances come from the caller's measurements (params) or are measured here from the bound elements.
//
// Distinctions the brief requires:
//  - C01 morphs ONE element between two layouts (FLIP); A04 introduces several different cards from the sides.
//  - C02 draws ONE path from a source to a target and sends ONE token along it; B10 reveals a whole network;
//    C11 moves two endpoints together and locks them.
//  - C03 fills a progress rail between discrete step markers; B07 lifts one card and carries it between columns.
import { EASE_IN_OUT as IO, EASE_OUT as E, timeline } from './core';
import type { MotionHandle, MotionTargets } from './core';
import type { MotionParams } from './param-presets';

export type CId = 'C01' | 'C02' | 'C03' | 'C04' | 'C05' | 'C06' | 'C07' | 'C08' | 'C09' | 'C10' | 'C11' | 'C12';

type Box = { left: number; top: number; width: number; height: number };
const box = (el: Element | null | undefined): Box => {
  if (!el) return { left: 0, top: 0, width: 0, height: 0 };
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export const C_DURATION: Record<CId, number> = {
  C01: 450, C02: 650, C03: 450, C04: 350, C05: 900, C06: 700, C07: 200, C08: 220, C09: 180, C10: 400, C11: 600, C12: 450,
};

export function createCPreset(id: CId, t: MotionTargets, p: MotionParams = {}): MotionHandle {
  // C04 has two phases with their own durations; C07/C08 have open/close durations.
  let D = C_DURATION[id];
  if (id === 'C04' && p.phase === 'unlock') D = 400;
  if (id === 'C08' && p.open === false) D = 160;
  if (typeof p.duration === 'number') D = p.duration;
  const { track, tr, onTick, handle } = timeline(D);

  switch (id) {
    case 'C01': {
      // FLIP: `focus` is already in its LAST layout. params.from = its FIRST box (measured before the layout change).
      const last = (p.to as Box | undefined) ?? box(t.focus);
      const first = (p.from as Box | undefined) ?? last;
      const sx = last.width ? first.width / last.width : 1;
      const sy = last.height ? first.height / last.height : 1;
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      tr(t.focus, [
        { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transformOrigin: '0 0', transform: 'translate(0px, 0px) scale(1, 1)' },
      ], { easing: E });
      // Adjacent details crossfade: outgoing (overlay) fades out early, incoming (nodes) fade in late.
      track(t.overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: D * 0.4, easing: 'ease-out' });
      (t.nodes || []).forEach((el) => track(el, [{ opacity: 0 }, { opacity: 1 }], { delay: D * 0.45, duration: D * 0.55, easing: 'ease-out' }));
      break;
    }
    case 'C02': {
      // `beam` is an SVG path from source to target; `focus` is ONE token drawn at (0,0) in the same coordinate space;
      // `overlay` marks the target and lights up on arrival.
      const path = t.beam as unknown as SVGGeometryElement | null;
      if (!path || typeof path.getTotalLength !== 'function') break;
      const L = path.getTotalLength();
      const reverse = p.reverse === true;
      track(path, [{ strokeDasharray: `${L} ${L}`, strokeDashoffset: reverse ? -L : L }, { strokeDasharray: `${L} ${L}`, strokeDashoffset: 0 }], { duration: 400, easing: E });
      const n = 18;
      const pts = Array.from({ length: n + 1 }, (_, i) => {
        const s = (reverse ? 1 - i / n : i / n) * L;
        const pt = path.getPointAtLength(s);
        return pt;
      });
      track(t.focus, pts.map((pt, i) => ({
        transform: `translate(${pt.x}px, ${pt.y}px)`,
        opacity: i === 0 || i === n ? 0 : 1,
        offset: i / n,
      })), { delay: 250, duration: 400, easing: IO });
      track(t.overlay, [{ opacity: 0 }, { opacity: 1 }], { delay: 560, duration: 90, easing: 'ease-out' });
      break;
    }
    case 'C03': {
      // Progress rail (`beam`, scaled along its axis) between discrete markers (`nodes`); panels (`layers`) swap.
      const count = Math.max(2, num(p.count, (t.nodes || []).length || 2));
      const from = num(p.from, 0);
      const to = num(p.to, Math.min(count - 1, from + 1));
      const axis = p.axis === 'y' ? 'Y' : 'X';
      const f = (i: number) => Math.max(0, Math.min(1, i / (count - 1)));
      track(t.beam, [{ transform: `scale${axis}(${f(from)})` }, { transform: `scale${axis}(${f(to)})` }], { easing: E });
      const nodes = t.nodes || [];
      track(nodes[from], [{ transform: 'scale(1)' }, { transform: 'scale(.9)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: D * 0.6, easing: IO });
      track(nodes[to], [{ transform: 'scale(1)', boxShadow: '0 0 0 0 rgb(109 40 217 / 0)' }, { transform: 'scale(1.18)', boxShadow: '0 0 0 6px rgb(109 40 217 / .18)', offset: 0.6 }, { transform: 'scale(1)', boxShadow: '0 0 0 3px rgb(109 40 217 / .14)' }], { delay: D * 0.45, duration: D * 0.55, easing: E });
      const layers = t.layers || [];
      if (from !== to) track(layers[from], [{ opacity: 1, transform: 'translateY(0px)' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: D * 0.4, easing: 'ease-in' });
      track(layers[to], [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0px)' }], { delay: D * 0.35, duration: D * 0.65, easing: E });
      break;
    }
    case 'C04': {
      // Approval gate. phase 'arrive': the draft (`focus`) travels up to the gate (`beam`) and STOPS; the owner's
      // control (`overlay`) and the waiting label (nodes[0]) appear. phase 'unlock' runs ONLY after an explicit owner
      // action: gate opens, waiting label swaps for the approved label (nodes[1]), the draft moves on.
      const [waiting, approved] = t.nodes || [];
      const travel = num(p.travel, 24);
      if (p.phase === 'unlock') {
        track(t.beam, [{ opacity: 1, transform: 'scaleY(1)' }, { opacity: 0, transform: 'scaleY(0)' }], { duration: 200, easing: IO });
        track(t.overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-out' });
        track(waiting, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-out' });
        track(approved, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0px)' }], { delay: 150, duration: 150, easing: E });
        track(t.focus, [{ transform: 'translateX(0px)' }, { transform: `translateX(${num(p.advance, 12)}px)` }], { delay: 150, duration: 250, easing: E });
      } else {
        track(t.focus, [{ opacity: 0.4, transform: `translateX(${-travel}px)` }, { opacity: 1, transform: 'translateX(3px)', offset: 0.75 }, { opacity: 1, transform: 'translateX(0px)' }], { easing: E });
        track(t.beam, [{ transform: 'scaleY(.6)' }, { transform: 'scaleY(1.06)', offset: 0.75 }, { transform: 'scaleY(1)' }], { easing: E });
        track(t.overlay, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }], { delay: 200, duration: 150, easing: E });
        track(waiting, [{ opacity: 0 }, { opacity: 1 }], { delay: 150, duration: 200, easing: 'ease-out' });
        track(approved, [{ opacity: 0 }, { opacity: 0 }]);
      }
      break;
    }
    case 'C05': {
      // Demo sweep for the studio: the highlight runs round the card border. Live use is pointer-driven (attachC05).
      const el = t.focus as HTMLElement | null;
      onTick((ms) => {
        if (!el) return;
        const u = ms / D;
        el.style.setProperty('--c05x', `${-10 + u * 120}%`);
        el.style.setProperty('--c05y', `${10 + Math.sin(u * Math.PI) * 30}%`);
        el.style.setProperty('--c05o', ms <= 0 || ms >= D ? '0' : '1');
      });
      break;
    }
    case 'C06': {
      // Ambient glow (`beam` or `overlay`) blooms once and settles. Text is never a target.
      const glow = t.beam || t.overlay;
      track(glow, [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 0.95, transform: 'scale(1.06)', offset: 0.55 }, { opacity: num(p.rest, 0.6), transform: 'scale(1)' }], { easing: E });
      break;
    }
    case 'C07': {
      // Accordion: content region (`focus`) grows from 0 to its measured height; indicator (`overlay`) rotates.
      const h = num(p.height, (t.focus as HTMLElement | null)?.scrollHeight ?? 0);
      const open = p.open !== false;
      const a = { height: '0px', opacity: 0 }, b = { height: `${h}px`, opacity: 1 };
      track(t.focus, open ? [a, b] : [b, a], { easing: IO });
      track(t.overlay, open ? [{ transform: 'rotate(0deg)' }, { transform: 'rotate(45deg)' }] : [{ transform: 'rotate(45deg)' }, { transform: 'rotate(0deg)' }], { easing: IO });
      break;
    }
    case 'C08': {
      // Navigation sheet (`focus`) slides and fades in; links (`nodes`) follow with a 20ms stagger. Focus handling and
      // Escape are the caller's job (see components/motion/motion-boot.tsx).
      const open = p.open !== false;
      const hidden = { opacity: 0, transform: 'translateY(-10px) scale(.98)' }, shown = { opacity: 1, transform: 'translateY(0px) scale(1)' };
      track(t.focus, open ? [hidden, shown] : [shown, hidden], { easing: open ? E : 'ease-in' });
      if (open) (t.nodes || []).forEach((el, i) => track(el, [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'translateY(0px)' }], { delay: 40 + i * 20, duration: Math.max(60, D - 40 - i * 20), easing: E }));
      break;
    }
    case 'C09': {
      // Route transition demo: page content crossfades (layers[0] out, layers[1] in); the header (`shell`) never moves.
      // Production uses the browser's cross-document view transition with the same 180ms crossfade (cells.css).
      const [out, inn] = t.layers || [];
      track(out, [{ opacity: 1 }, { opacity: 0 }], { duration: D * 0.5, easing: 'ease-out' });
      track(inn, [{ opacity: 0 }, { opacity: 1 }], { delay: D * 0.4, duration: D * 0.6, easing: 'ease-in' });
      break;
    }
    case 'C10': {
      // Masked reveal: `focus` keeps its geometry; a clip moves across it, led by an optional edge highlight (`beam`).
      const w = num(p.width, box(t.focus).width);
      const r = num(p.radius, 12);
      track(t.focus, [{ clipPath: `inset(0px 100% 0px 0px round ${r}px)` }, { clipPath: `inset(0px 0% 0px 0px round ${r}px)` }], { easing: IO });
      track(t.beam, [{ opacity: 0, transform: 'translateX(0px)' }, { opacity: 1, transform: `translateX(${w * 0.15}px)`, offset: 0.15 }, { opacity: 1, transform: `translateX(${w * 0.85}px)`, offset: 0.85 }, { opacity: 0, transform: `translateX(${w}px)` }], { easing: IO });
      break;
    }
    case 'C11': {
      // Handshake: two endpoints (nodes[0], nodes[1]) start `gap` apart, move together, lock (tiny overshoot), then the
      // link (`beam`) and the state label (`overlay`) appear. The label text must say "demo" unless a real verified
      // connection event exists; the motion never decides that.
      const [a, b] = t.nodes || [];
      const gap = num(p.gap, 80) / 2;
      track(a, [{ transform: `translateX(${-gap}px)` }, { transform: 'translateX(2px)', offset: 0.7 }, { transform: 'translateX(0px)', offset: 0.83 }, { transform: 'translateX(0px)' }], { easing: E });
      track(b, [{ transform: `translateX(${gap}px)` }, { transform: 'translateX(-2px)', offset: 0.7 }, { transform: 'translateX(0px)', offset: 0.83 }, { transform: 'translateX(0px)' }], { easing: E });
      track(t.beam, [{ opacity: 0, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)' }], { delay: 380, duration: 140, easing: E });
      track(t.overlay, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0px)' }], { delay: 480, duration: 120, easing: E });
      break;
    }
    case 'C12': {
      // Contextual zoom: the camera (`stage`) scales and translates so `focus` is centred. No rotation. Others (`nodes`)
      // dim. params.exit = true runs the same path backwards (reset).
      const s0 = box(t.stage), f0 = box(t.focus);
      // Measure without the camera's current transform: callers should bind while the stage is untransformed.
      const scale = Math.min(num(p.maxScale, 1.6), (s0.width * 0.9) / (f0.width || 1), (s0.height * 0.9) / (f0.height || 1));
      const ocx = s0.left + s0.width / 2, ocy = s0.top + s0.height / 2;
      const fcx = f0.left + f0.width / 2, fcy = f0.top + f0.height / 2;
      const zoomed = `translate(${-(fcx - ocx) * scale}px, ${-(fcy - ocy) * scale}px) scale(${scale})`;
      const rest = 'translate(0px, 0px) scale(1)';
      const exit = p.exit === true;
      track(t.stage, [{ transformOrigin: '50% 50%', transform: exit ? zoomed : rest }, { transformOrigin: '50% 50%', transform: exit ? rest : zoomed }], { easing: IO });
      (t.nodes || []).forEach((el) => track(el, exit ? [{ opacity: 0.3 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0.3 }], { easing: IO }));
      break;
    }
  }
  return handle();
}

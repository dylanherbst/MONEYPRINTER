'use client';
// Development-only motion studio: all 33 presets with play / pause / replay / scrub / speed and a reduced-motion
// state. A/B demos use the V2 studio's markup and the canonical engine unchanged; C demos use c-markup.ts.
// URL: /lab/motion?id=A03&t=0.5 opens a preset paused at 50% (used for the A03/A04/A05 comparison screenshots).
import { useCallback, useEffect, useRef, useState } from 'react';
import { PRESETS, PRESET_BY_ID, createPreset, attachC05, type MotionHandle, type MotionTargets, type PresetId } from '../../../lib/motion/registry';
import { PARAMETERISED } from '../../../lib/motion/param-presets';
import { markup } from './v2-markup';
import { cMarkup, C_VARIANTS } from './c-markup';

const box = (el: Element | null) => { const r = el!.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };

function build(host: HTMLElement, id: PresetId, variant: string): MotionHandle {
  const isC = id[0] === 'C';
  const wide = (id[0] === 'B' && id !== 'B12') || id === 'A05' || isC;
  host.innerHTML = `<div class="stage ${wide ? 'wide' : ''}">${isC ? cMarkup(id, variant) : markup(id)}</div>` +
    (id === 'B12' ? '<div class="cta overlay"><b>Build your AI workforce</b><span>Get started</span></div>' : '');
  const q = (s: string) => host.querySelector<HTMLElement>(s);
  const qa = (s: string) => [...host.querySelectorAll<HTMLElement>(s)];
  const targets: MotionTargets = {
    stage: q('.stage'), shell: q('.shell'), layers: qa('.layer'), focus: q('.focus'), overlay: q('.overlay'),
    nodes: qa('.node'), beam: q('.beam'), waveform: qa('.wave i'), counter: q('#counter'),
  };
  if (!isC) return createPreset(id, targets); // canonical engine, exactly as the V2 studio
  // C demos mark their targets with data-t (the V2 classes .node/.overlay/.layer carry V2 demo positioning).
  Object.assign(targets, {
    layers: qa('[data-t="layer"]'), focus: q('[data-t="focus"]'), overlay: q('[data-t="overlay"]'),
    nodes: qa('[data-t="node"]'), beam: q('[data-t="beam"]'),
  });
  let params: Record<string, unknown> = {};
  switch (id) {
    case 'C01': params = { from: box(q('.c01-ghost')), to: box(q('[data-t="focus"]')) }; break;
    case 'C03': params = { from: 1, to: 2, count: 4 }; break;
    case 'C04': params = { phase: variant === 'unlock' ? 'unlock' : 'arrive' }; break;
    case 'C07': params = { open: variant !== 'close', height: q('.c07-body')!.scrollHeight }; break;
    case 'C08': params = { open: variant !== 'close' }; break;
    case 'C10': params = { width: box(q('[data-t="focus"]')).width }; break;
    case 'C11': params = { gap: 120 }; break;
    case 'C12': targets.stage = q('.c12-cam'); params = { exit: variant === 'exit' }; break;
  }
  return createPreset(id, targets, params);
}

export function MotionStudio() {
  const hostRef = useRef<HTMLDivElement>(null);
  const motion = useRef<MotionHandle | null>(null);
  const elapsed = useRef(0);
  const [id, setId] = useState<PresetId>('A01');
  const [variant, setVariant] = useState('');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [reduced, setReduced] = useState(false);
  const [time, setTime] = useState(0);
  const [parity, setParity] = useState<string>('');
  const playingRef = useRef(false);
  playingRef.current = playing;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // Initial state from the address (?id=A03&t=0.5&reduced=1) and the OS setting.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const want = p.get('id') as PresetId | null;
    if (want && PRESET_BY_ID[want]) setId(want);
    if (p.get('variant')) setVariant(p.get('variant')!);
    setReduced(p.get('reduced') === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return attachC05(document);
  }, []);

  const seek = useCallback((ms: number) => {
    const m = motion.current;
    if (!m) return;
    elapsed.current = Math.max(0, Math.min(m.duration, ms));
    m.seek(elapsed.current);
    setTime(elapsed.current);
  }, []);

  // Build the selected preset. One motion at a time: the cleanup destroys it.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const m = build(host, id, variant);
    motion.current = m;
    const p = new URLSearchParams(window.location.search);
    const t = p.get('id') === id && p.has('t') ? Number(p.get('t')) : null;
    if (reduced) { seek(m.duration); setPlaying(false); }
    else if (t !== null && Number.isFinite(t)) { seek(t * m.duration); setPlaying(false); }
    else { seek(0); setPlaying(true); }
    return () => { m.destroy(); if (motion.current === m) motion.current = null; };
  }, [id, variant, reduced, seek]);

  // One RAF loop for the whole studio; only A09 loops.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      const m = motion.current;
      if (m && playingRef.current) {
        let t = elapsed.current + dt * speedRef.current;
        if (t >= m.duration) {
          if (id === 'A09') t %= m.duration;
          else { t = m.duration; setPlaying(false); }
        }
        seek(t);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [id, seek]);

  const select = (next: PresetId) => { setId(next); setVariant(C_VARIANTS[next]?.[0] ?? ''); };
  const spec = PRESET_BY_ID[id];
  const duration = motion.current?.duration ?? spec.duration;

  // Parity: each parameterised twin, built with default numbers, must produce the same keyframes as the engine.
  const checkParity = () => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:350px;height:320px';
    document.body.append(host);
    const out: string[] = [];
    for (const pid of PARAMETERISED) {
      const snap = (m: MotionHandle) => JSON.stringify(m.animations.map((a) => {
        const e = a.effect as KeyframeEffect;
        const tm = e.getTiming();
        return [e.target?.className, e.getKeyframes(), tm.duration, tm.delay, tm.easing, tm.iterations];
      }));
      host.innerHTML = `<div class="stage">${markup(pid)}</div>`;
      const q = (s: string) => host.querySelector<HTMLElement>(s);
      const qa = (s: string) => [...host.querySelectorAll<HTMLElement>(s)];
      const tg = () => ({ stage: q('.stage'), layers: qa('.layer'), focus: q('.focus'), overlay: q('.overlay'), nodes: qa('.node'), beam: q('.beam'), waveform: qa('.wave i'), counter: q('#counter') });
      const a = globalThis.InsertMotion.createMotion(pid, tg());
      const sa = snap(a); a.seek(900); const ca = q('#counter')?.textContent; a.destroy();
      const b = createPreset(pid, tg(), {});
      const sb = snap(b); b.seek(900); const cb = q('#counter')?.textContent; b.destroy();
      out.push(`${pid}:${sa === sb && ca === cb ? 'same' : 'DIFFERENT'}`);
    }
    host.remove();
    setParity(out.join(' '));
  };

  return (
    <div className="ms">
      <header className="ms-head">
        <p className="ms-eyebrow">Development only · not in the sitemap or navigation · noindex</p>
        <h1>Insert Agentic motion studio</h1>
        <p>33 presets: A01–A09 and B01–B12 from the canonical V2 engine (unchanged), C01–C12 new. Illustrative data only.</p>
      </header>
      <div className="ms-layout">
        <nav className="ms-list" aria-label="Presets">
          {(['A', 'B', 'C'] as const).map((series) => (
            <div key={series} className="ms-group">
              <p className="ms-section">{series === 'A' ? 'Core motion collection · 9' : series === 'B' ? 'Feature motions · 12' : 'C-series (new) · 12'}</p>
              {PRESETS.filter((p) => p.series === series).map((p) => (
                <button key={p.id} type="button" className="ms-item" aria-pressed={p.id === id} data-id={p.id} onClick={() => select(p.id)}>
                  <span>{p.id}</span>{p.name}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <section className="ms-viewer" aria-labelledby="ms-name">
          <p className="ms-meta">{spec.id} / {spec.source} · {(spec.duration / 1000).toFixed(2)}s</p>
          <h2 id="ms-name">{spec.name}</h2>
          <p>{spec.meaning}</p>
          <div className="stagebox"><div className="perspective" ref={hostRef} /><span className="source-tag">{reduced ? 'Reduced motion: final state' : 'Illustrative demo'}</span></div>
          <div className="ms-controls">
            <button type="button" className="primary" data-act="play" disabled={reduced} onClick={() => { if (elapsed.current >= duration) seek(0); setPlaying((v) => !v); }}>{playing ? 'Pause' : 'Play'}</button>
            <button type="button" data-act="replay" disabled={reduced} onClick={() => { seek(0); setPlaying(true); }}>Replay</button>
            <input type="range" min={0} max={1000} value={duration ? Math.round((time / duration) * 1000) : 0} aria-label="Scrub"
              onChange={(e) => { setPlaying(false); seek((Number(e.target.value) / 1000) * duration); }} />
            <span className="ms-time" data-time>{(time / 1000).toFixed(2)} / {(duration / 1000).toFixed(2)}s</span>
            <label>Speed <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Speed">
              {[0.25, 0.5, 1, 1.5, 2].map((v) => <option key={v} value={v}>{v}×</option>)}
            </select></label>
            <label><input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} /> Reduced motion</label>
            {C_VARIANTS[id] && (
              <label>State <select value={variant} onChange={(e) => setVariant(e.target.value)} aria-label="State">
                {C_VARIANTS[id].map((v) => <option key={v} value={v}>{v}</option>)}
              </select></label>
            )}
          </div>
          <dl className="ms-spec">
            <dt>Targets</dt><dd>{spec.targets}</dd>
            <dt>Start → end</dt><dd>{spec.start} → {spec.end}</dd>
            <dt>Trigger</dt><dd>{spec.trigger}</dd>
            <dt>Reduced motion</dt><dd>{spec.reduced}</dd>
            <dt>Use for / avoid</dt><dd>{spec.useFor} / {spec.avoid}</dd>
            <dt>Used on the site</dt><dd>{spec.usedIn || 'Studio only'}</dd>
          </dl>
          <p className="ms-parity"><button type="button" onClick={checkParity}>Engine parity (parameterised twins vs canonical engine)</button> <output data-parity>{parity}</output></p>
        </section>
      </div>
    </div>
  );
}

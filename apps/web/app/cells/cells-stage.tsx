'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CellsScene } from './_scene/cells-scene';
import { defaults, limits, luminance, presets, readSettings, writeSettings, type CellSettings } from './_scene/settings';

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * The fixed cell canvas behind the page plus the Tune panel. Scroll position picks the formation: each chapter holds
 * its formation while you read, then morphs into the next one in the last part of the chapter.
 */
export function CellsStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CellsScene | null>(null);
  const settingsRef = useRef<CellSettings>(defaults);
  const [settings, setSettings] = useState<CellSettings>(defaults);
  const [open, setOpen] = useState(false);
  const [showTune, setShowTune] = useState(true);
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);

  // Paint the page colours and hand the settings to the scene whenever they change.
  const applyLook = useCallback((s: CellSettings) => {
    settingsRef.current = s;
    const root = document.querySelector<HTMLElement>('.cells');
    const dark = luminance(s.bg) < 0.35;
    if (root) {
      root.style.setProperty('--cells-bg', `#${s.bg}`);
      root.style.setProperty('--cells-accent', `#${s.c1}`);
      root.dataset.tone = dark ? 'dark' : 'light';
    }
    sceneRef.current?.apply(s, dark);
  }, []);

  useEffect(() => {
    const initial = readSettings(window.location.search);
    const params = new URLSearchParams(window.location.search);
    setShowTune(params.get('tune') !== '0');
    setSettings(initial);
    applyLook(initial);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) { setFallback(true); return; }

    let scene: CellsScene;
    try { scene = new CellsScene(canvas); } catch { setFallback(true); return; }
    sceneRef.current = scene;
    applyLook(settingsRef.current);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'));
    let tops: number[] = [];
    const measure = () => {
      scene.resize(window.innerWidth, window.innerHeight);
      tops = chapters.map((c) => c.getBoundingClientRect().top + window.scrollY);
    };
    measure();

    // Optional ?at=2.5 pins the scroll position to a formation, for screenshots and design review.
    const pinned = params.has('at') ? Number(params.get('at')) : null;
    const progress = () => {
      if (pinned !== null && Number.isFinite(pinned)) return pinned;
      const y = window.scrollY;
      let i = 0;
      while (i < tops.length - 1 && y >= tops[i + 1]) i++;
      if (i >= scene.formationCount - 1) return scene.formationCount - 1;
      const span = (tops[i + 1] ?? tops[i] + window.innerHeight) - tops[i];
      const u = span > 0 ? (y - tops[i]) / span : 0;
      return i + smooth(0.3, 0.92, u);
    };

    let raf = 0;
    let last = performance.now();
    let clock = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduced) clock += dt * settingsRef.current.speed;
      scene.render(progress(), clock);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.dataset.ready = '1';
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', onVisibility);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [applyLook]);

  const update = (patch: Partial<CellSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    setSettings(next);
    applyLook(next);
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${writeSettings(next, window.location.search)}${window.location.hash}`);
    } catch { /* the address is a convenience; the look still applies */ }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked: the address bar already holds the link */ }
  };

  return (
    <>
      <canvas ref={canvasRef} className="cells-canvas" aria-hidden="true" data-fallback={fallback ? '1' : undefined} />
      {showTune && (
        <div className="cells-tune" data-open={open ? '1' : undefined}>
          {open && (
            <section className="cells-tune-panel" aria-label="Tune the look">
              <div className="cells-tune-head">
                <h2>Tune the look</h2>
                <button type="button" className="cells-tune-x" onClick={() => setOpen(false)} aria-label="Close">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>

              <div className="cells-presets" role="group" aria-label="Presets">
                {presets.map((p) => (
                  <button key={p.name} type="button" onClick={() => update(p.values)}
                    style={{ background: `#${p.values.bg}`, color: luminance(p.values.bg ?? 'ffffff') < 0.35 ? '#fff' : '#1d1638' }}>
                    <span className="cells-swatch" style={{ background: `#${p.values.c1}` }} />
                    <span className="cells-swatch" style={{ background: `#${p.values.c2}` }} />
                    {p.name}
                  </button>
                ))}
              </div>

              {([['bg', 'Background'], ['c1', 'Cell colour'], ['c2', 'Second cell colour']] as const).map(([k, label]) => (
                <label key={k} className="cells-field">
                  <span>{label}</span>
                  <span className="cells-colour">
                    <input type="color" value={`#${settings[k]}`} onChange={(e) => update({ [k]: e.target.value.slice(1).toLowerCase() })} />
                    <input type="text" inputMode="text" spellCheck={false} maxLength={7} aria-label={`${label} hex`} value={`#${settings[k]}`}
                      onChange={(e) => { const v = e.target.value.replace('#', '').toLowerCase(); if (/^[0-9a-f]{6}$/.test(v)) update({ [k]: v }); }} />
                  </span>
                </label>
              ))}

              {([['count', 'Number of cells', (v: number) => `${v}k`], ['size', 'Cell size', (v: number) => `${v.toFixed(2)}×`], ['speed', 'Motion', (v: number) => (v === 0 ? 'Still' : `${v.toFixed(2)}×`)]] as const).map(([k, label, fmt]) => (
                <label key={k} className="cells-field">
                  <span>{label} <b>{fmt(settings[k])}</b></span>
                  <input type="range" min={limits[k].min} max={limits[k].max} step={limits[k].step} value={settings[k]}
                    onChange={(e) => update({ [k]: Number(e.target.value) })} />
                </label>
              ))}

              <div className="cells-tune-actions">
                <button type="button" onClick={copyLink}>{copied ? 'Link copied' : 'Copy link to this look'}</button>
                <button type="button" className="cells-ghost" onClick={() => update(defaults)}>Reset</button>
              </div>
            </section>
          )}
          <button type="button" className="cells-tune-open" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="10" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            Tune
          </button>
        </div>
      )}
    </>
  );
}

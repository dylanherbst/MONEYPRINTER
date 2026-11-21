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
export function CellsStage({ tuneByDefault = true }: { tuneByDefault?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CellsScene | null>(null);
  const settingsRef = useRef<CellSettings>(defaults);
  const [settings, setSettings] = useState<CellSettings>(defaults);
  const [open, setOpen] = useState(false);
  const [showTune, setShowTune] = useState(false);
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
    setShowTune(params.has('tune') ? params.get('tune') !== '0' : tuneByDefault);
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
    const morphs = chapters.map((c) => {
      const m = (c.dataset.morph ?? '').split(',').map(Number);
      return m.length === 2 && m.every(Number.isFinite) ? (m as [number, number]) : undefined;
    });
    let tops: number[] = [];
    // Phones change the visible height as their address bar shows and hides, and some browsers size fixed
    // elements to the smaller height. So the canvas is sized in pixels to the tallest the screen can be, and only
    // re-sized when the width changes or the screen gets taller; it never shrinks and leaves a gap.
    let sizedW = 0;
    let sizedH = 0;
    const paid = document.getElementById('cells-h-paid');
    const logoChapter = chapters.findIndex((c) => c.dataset.chapter === 'horizon');
    let paidCentreY = Number.NaN;
    let afterTop = 0;
    const measure = () => {
      const w = window.innerWidth;
      const tallest = Math.max(
        window.innerHeight,
        document.documentElement.clientHeight,
        window.visualViewport?.height ?? 0,
        w < 900 ? window.screen.height : 0,
      );
      if (w !== sizedW || tallest > sizedH) {
        sizedH = w !== sizedW ? tallest : Math.max(sizedH, tallest);
        sizedW = w;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${sizedH}px`;
        scene.resize(w, sizedH);
      }
      tops = chapters.map((c) => c.getBoundingClientRect().top + window.scrollY);
      const after = document.querySelector<HTMLElement>('.cells-after');
      afterTop = after ? after.getBoundingClientRect().top + window.scrollY : 0;
      if (paid) {
        const r = paid.getBoundingClientRect();
        // Scroll position at which the Getting paid heading is a little below the middle of the screen (68% down):
        // the cells finish the logo there and turn solid purple by the time the heading reaches the middle.
        paidCentreY = r.top + window.scrollY + r.height / 2 - window.innerHeight * 0.68;
      }
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
      const vh = window.innerHeight;
      // The cells finish forming the logo as the Getting paid heading comes up towards the middle of the screen.
      if (i === logoChapter && Number.isFinite(paidCentreY)) {
        return i + smooth(0, 1, (y - (paidCentreY - 0.55 * vh)) / (0.55 * vh));
      }
      const span = (tops[i + 1] ?? tops[i] + vh) - tops[i];
      const u = span > 0 ? (y - tops[i]) / span : 0;
      // A chapter can morph earlier than the default with data-morph="from,to" (fractions of its scroll).
      const [from, to] = morphs[i] ?? [0.3, 0.92];
      return i + smooth(from, to, u);
    };

    // From that same moment the logo turns solid purple straight away, within a sixth of a screen of scrolling,
    // then takes on the brand colours over the next half screen.
    const ending = () => {
      if (!Number.isFinite(paidCentreY) || pinned !== null) return undefined;
      const vh = window.innerHeight;
      const d = window.scrollY - paidCentreY;
      return { fuse: smooth(0, 1, d / (0.17 * vh)), brand: smooth(0, 1, (d - 0.3 * vh) / (0.45 * vh)) };
    };

    let raf = 0;
    let last = performance.now();
    let clock = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduced) clock += dt * settingsRef.current.speed;
      scene.render(progress(), clock, ending());
      // Once the story is over, fade the cells out so the sections after it read on a plain page.
      if (afterTop > 0) {
        const vh = window.innerHeight;
        const fade = smooth(0, 1, (window.scrollY + vh - afterTop - 0.15 * vh) / (0.55 * vh));
        const o = String(Math.round((1 - fade) * 1000) / 1000);
        if (canvas.style.opacity !== o) canvas.style.opacity = o;
        // Give the header a frosted backing once plain sections scroll under it.
        const solid = window.scrollY > afterTop - 80 ? '1' : '';
        const top = document.querySelector<HTMLElement>('.cells-top');
        if (top && (top.dataset.solid ?? '') !== solid) { if (solid) top.dataset.solid = solid; else delete top.dataset.solid; }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.dataset.ready = '1';
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', onVisibility);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [applyLook, tuneByDefault]);

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

              {([['bg', 'Background'], ['wave', 'Wave colour'], ['c1', 'Cell colour'], ['c2', 'Second cell colour']] as const).map(([k, label]) => (
                <label key={k} className="cells-field">
                  <span>{label}</span>
                  <span className="cells-colour">
                    <input type="color" value={`#${settings[k]}`} onChange={(e) => update({ [k]: e.target.value.slice(1).toLowerCase() })} />
                    <input type="text" inputMode="text" spellCheck={false} maxLength={7} aria-label={`${label} hex`} value={`#${settings[k]}`}
                      onChange={(e) => { const v = e.target.value.replace('#', '').toLowerCase(); if (/^[0-9a-f]{6}$/.test(v)) update({ [k]: v }); }} />
                  </span>
                </label>
              ))}

              {([['count', 'Number of cells', (v: number) => `${v}k`], ['size', 'Cell size', (v: number) => `${v.toFixed(2)}×`], ['speed', 'Motion', (v: number) => (v === 0 ? 'Still' : `${v.toFixed(2)}×`)], ['waveAmt', 'Wave strength', (v: number) => (v === 0 ? 'Off' : `${Math.round(v * 100)}%`)]] as const).map(([k, label, fmt]) => (
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

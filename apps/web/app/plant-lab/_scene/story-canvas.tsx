'use client';
import { useEffect, useRef } from 'react';
import { track } from '../../../lib/aimp/analytics';
import { stageAt, type StageId } from '../../../lib/aimp/plant/timeline';

/** The word the growth ring's marker shows at each stage. */
const stageWords: Record<StageId, string> = { potential: 'Seed', foundation: 'Planted', creation: 'Sprout', growth: 'Tree' };

/**
 * Binds the 3D scene to the story section's scroll position. Progressive enhancement: the page shows authored still
 * frames until the scene has loaded; with reduced motion, no WebGL, or a load failure, the stills simply stay.
 */
export function StoryCanvas({ storyId }: { storyId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const story = document.getElementById(storyId);
    const root = story?.closest<HTMLElement>('.amp');
    if (!canvas || !story || !root) return;
    const params = new URLSearchParams(window.location.search);
    const still = params.get('still');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced && still === null) { root.dataset.scene = 'static'; return; }
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) { root.dataset.scene = 'static'; return; }

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    let disposed = false;
    let cleanup = () => {};

    import('./plant-scene').then(async ({ PlantScene }) => {
      if (disposed) return;
      // Transmission glass is affordable on current phones at a capped pixel ratio; 'low' is the fallback for WebGL1-only
      // devices or ?quality=low.
      const webgl2 = !!document.createElement('canvas').getContext('webgl2');
      const quality = params.get('quality') === 'low' || !webgl2 ? 'low' : 'high';
      const scene = new PlantScene(canvas, quality);
      // Growth ring: a marker travels along the front of the ring from left to right as the story is scrolled.
      const ring = story.querySelector<HTMLElement>('.amp-ring');
      const marker = story.querySelector<HTMLElement>('.amp-ring-marker');
      const arc = story.querySelector<SVGPathElement>('.amp-ring-done');
      const word = story.querySelector<HTMLElement>('.amp-ring-word');
      let ringBox = { x: 0, y: 0, rx: 0, ry: 0 };
      let lastP = 0;
      const placeMarker = (p: number) => {
        lastP = p;
        if (!marker) return;
        const a = Math.PI * (0.8 - 0.6 * p);                   // stays on the front of the ring, clear of the screen edges
        marker.style.transform = `translate(${(ringBox.x + ringBox.rx * Math.cos(a)).toFixed(1)}px, ${(ringBox.y + ringBox.ry * Math.sin(a)).toFixed(1)}px) translate(-50%, -24.5px)`;
        // the travelled part of the ring, drawn from its left end to the marker (the ring is a unit circle, stretched)
        if (arc) arc.setAttribute('d', `M-1 0A1 1 0 0 0 ${Math.cos(a).toFixed(4)} ${Math.sin(a).toFixed(4)}`);
      };
      const layout = () => {
        const r = canvas.parentElement!.getBoundingClientRect();
        scene.resize(r.width, r.height, window.matchMedia('(max-width: 899px)').matches ? 'mobile' : 'desktop');
        if (ring) {                                            // the growth ring lies on the ground under the plant
          const g = scene.groundAnchor();
          ringBox = g;
          ring.style.cssText = `left:${(g.x - g.rx).toFixed(1)}px;top:${(g.y - g.ry).toFixed(1)}px;width:${(g.rx * 2).toFixed(1)}px;height:${(g.ry * 2).toFixed(1)}px`;
          placeMarker(lastP);
        }
      };
      layout();
      try { await scene.load(); } catch { root.dataset.scene = 'static'; scene.dispose(); return; }
      if (disposed) { scene.dispose(); return; }

      if (still !== null) {                                    // capture mode for authored stills and QA
        scene.renderStill(Math.min(1, Math.max(0, Number(still) || 0)), Number(params.get('dpr')) || 0);   // ?dpr=3 for high-resolution stills
        (window as unknown as { __plantPNG: string }).__plantPNG = canvas.toDataURL('image/png'); // transparent still
        root.dataset.scene = 'on'; root.dataset.capture = '1';
        (window as unknown as { __plantReady: boolean }).__plantReady = true;
        cleanup = () => scene.dispose();
        return;
      }

      let lastStage: StageId | null = null;
      let lastFade = '';
      const progress = () => {
        const r = story.getBoundingClientRect();
        const total = Math.max(1, story.offsetHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, -r.top / total));
        scene.setProgress(p);
        placeMarker(p);
        // Once the story ends, the plant drifts over the next section; fade it to a soft backdrop behind that content.
        const past = Math.min(1, Math.max(0, (window.innerHeight - r.bottom) / (window.innerHeight * 0.5)));
        const fade = (1 - Math.round(past * 0.4 * 50) / 50).toFixed(2);   // written only when it changes, so most scroll events cost nothing
        if (fade !== lastFade) { lastFade = fade; canvas.style.setProperty('--amp-plant-fade', fade); }
        const stage = stageAt(p);
        if (stage !== lastStage) {
          lastStage = stage; root.dataset.stage = stage; track('story_stage_view', { stage });
          if (word) word.textContent = stageWords[stage];
        }
      };
      const onPointer = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      };
      const onTap = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest('a,button,input,select,textarea,label')) return;
        scene.tap();
      };
      const onVisibility = () => scene.setVisible(!document.hidden);
      const ro = new ResizeObserver(layout);
      ro.observe(canvas.parentElement!);
      const io = new IntersectionObserver(([entry]) => scene.setVisible(entry.isIntersecting && !document.hidden));
      io.observe(story);
      window.addEventListener('scroll', progress, { passive: true });
      if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true });
      story.addEventListener('pointerdown', onTap);
      document.addEventListener('visibilitychange', onVisibility);
      progress();
      root.dataset.scene = 'on';
      cleanup = () => {
        ro.disconnect(); io.disconnect();
        window.removeEventListener('scroll', progress);
        window.removeEventListener('pointermove', onPointer);
        story.removeEventListener('pointerdown', onTap);
        document.removeEventListener('visibilitychange', onVisibility);
        scene.dispose();
      };
    }).catch(() => { root.dataset.scene = 'static'; });

    return () => { disposed = true; cleanup(); };
  }, [storyId]);

  return <canvas ref={canvasRef} className="amp-canvas" aria-hidden="true" />;
}

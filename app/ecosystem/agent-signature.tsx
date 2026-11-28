'use client';
import { useLayoutEffect, useRef } from 'react';
import { runMotion } from '../../lib/motion/run';
import type { MotionTargets, PresetId } from '../../lib/motion/registry';

/**
 * One small illustrative animation per agent, shown in the ecosystem info card when that agent is selected.
 * It plays once per selection (one agent at a time) and ends in a readable still. Reduced motion: the still only.
 *   Sales B04 · Job Manager B07 · Business Optimisation B11 · Integrations C02 · Growth Manager B10 ·
 *   Receptionist B05 · Socials & Marketing B09
 */
const SIG: Record<string, PresetId> = { sales: 'B04', jobs: 'B07', optimise: 'B11', integrations: 'C02', growth: 'B10', receptionist: 'B05', socials: 'B09' };

export function AgentSignature({ id }: { id: string }) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const q = (s: string) => el.querySelector<HTMLElement>(`[data-t="${s}"]`);
    const qa = (s: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-t="${s}"]`));
    const preset = SIG[id];
    let targets: MotionTargets = {};
    let params: Record<string, unknown> | undefined;
    let speed = 1.6;
    switch (preset) {
      case 'B04': targets = { nodes: qa('node') }; break;
      case 'B07': {
        const cols = qa('col');
        targets = { focus: q('focus'), overlay: q('overlay') };
        params = { travel: cols.length === 2 ? cols[1].offsetLeft - cols[0].offsetLeft : 100 };
        break;
      }
      case 'B11': targets = { beam: q('beam'), focus: q('focus') }; params = { scanTravel: Math.max(0, (q('list')?.offsetHeight ?? 60) - 4) }; break;
      case 'C02': targets = { beam: q('beam'), focus: q('focus'), overlay: q('overlay') }; speed = 0.9; break;
      case 'B10': targets = { focus: q('focus'), beam: q('beam'), nodes: qa('node') }; speed = 2; break;
      case 'B05': targets = { waveform: qa('bar') }; speed = 1.2; break;
      case 'B09': targets = { nodes: qa('node') }; params = { spread: Math.round(el.offsetWidth * 0.27) }; break;
    }
    // B05, B07, B09 and B11 end away from their CSS state, so they keep their final fill (cleared when the card closes).
    return runMotion(preset, targets, { params, speed, keep: preset === 'B05' || preset === 'B07' || preset === 'B09' || preset === 'B11' });
  }, [id]);

  return (
    <div className={`sig sig-${id}`} ref={box} aria-hidden="true">
      {id === 'sales' && (
        <>
          <span className="sig-bub" data-t="node">Do you have Thursday free?</span>
          <span className="sig-bub sig-us" data-t="node">Draft: Yes, 9 am works. Shall I hold it?</span>
          <span className="sig-note">Waits for your OK</span>
        </>
      )}
      {id === 'jobs' && (
        <div className="sig-board">
          <span className="sig-col" data-t="col">To quote</span>
          <span className="sig-col" data-t="col">Quote drafted</span>
          <span className="sig-job" data-t="focus">Deep clean</span>
          <span className="sig-st" data-t="overlay">Draft · waiting for your OK</span>
        </div>
      )}
      {id === 'optimise' && (
        <div className="sig-list" data-t="list">
          <span>Quote follow-ups</span>
          <span data-t="focus" className="sig-hit">Overdue invoice · fix suggested</span>
          <span>Lapsed customers</span>
          <i className="sig-beam" data-t="beam" />
        </div>
      )}
      {id === 'integrations' && (
        <svg className="sig-svg" viewBox="0 0 260 64">
          <path d="M30 32 C 90 4, 160 4, 214 32" className="sig-path" data-t="beam" />
          <circle cx="30" cy="32" r="9" className="sig-dot" /><circle cx="214" cy="32" r="9" className="sig-dot" />
          <circle cx="214" cy="32" r="14" className="sig-ring" data-t="overlay" />
          <circle cx="0" cy="0" r="4.5" className="sig-token" data-t="focus" />
          <text x="30" y="58" textAnchor="middle">Integrations</text><text x="214" y="58" textAnchor="middle">Your calendar</text>
        </svg>
      )}
      {id === 'growth' && (
        <div className="sig-net">
          <svg className="sig-net-lines" data-t="beam" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M50 20L12 20M50 20L88 20M50 20L50 38" /></svg>
          <span className="sig-hub" data-t="focus">Same facts</span>
          <span className="sig-n sig-n1" data-t="node">Sales</span><span className="sig-n sig-n2" data-t="node">Job Manager</span>
        </div>
      )}
      {id === 'receptionist' && (
        <div className="sig-wave">{Array.from({ length: 16 }, (_, i) => <i key={i} data-t="bar" />)}</div>
      )}
      {id === 'socials' && (
        <div className="sig-fan">
          {['Post', 'Story', 'Offer'].map((t) => <span key={t} data-t="node">{t}</span>)}
        </div>
      )}
    </div>
  );
}

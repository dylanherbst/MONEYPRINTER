'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useInsertMotion } from '../../lib/motion/useInsertMotion';
import { prefersReducedMotion, supportsWaapi } from '../../lib/motion/core';
import { belowViewport, runMotion } from '../../lib/motion/run';
import { AgentSignature } from './agent-signature';

// Animated, interactive ecosystem map. Pure SVG + CSS (no extra libraries):
// - the hub glows and ripples, the Growth Manager ring turns, data pulses travel both ways along every live link;
// - links draw in when the diagram scrolls into view;
// - hovering, focusing or tapping an agent lights up the agents it works with and shows what it does.
// Everything calms down under prefers-reduced-motion.
//
// Motion presets (lib/motion, docs/motion/MOTION_LIBRARY.md):
// - B10 network activation the first time the map scrolls into view (hub, Growth Manager ring, then each agent);
// - B01 lift for the selected agent (flat SVG version: a short rise and shadow, no tilt);
// - C02 connector routing on selection: one path draws from the agent to your business and one token arrives;
// - one signature per agent inside the info card, on interaction only, one agent at a time:
//   Sales B04, Job Manager B07, Business Optimisation B11, Integrations C02, Growth Manager B10,
//   Receptionist B05, Socials & Marketing B09.
// All six mapped agents are live (owner, 28 Nov 2026); Growth Manager works behind the scenes.

type Status = 'live' | 'soon';
type Agent = { id: string; name: string; status: Status; does: string; with: string[]; icon: ReactNode };

type Layout = { w: number; h: number; cx: number; cy: number; hubR: number; ringR: number; font: number; pos: Record<string, [number, number, number]> };
// [x, y, pill width] per agent, for wide screens and for phones.
const WIDE: Layout = { w: 760, h: 560, cx: 380, cy: 280, hubR: 104, ringR: 150, font: 16, pos: {
  sales: [380, 66, 208], jobs: [646, 172, 208], integrations: [646, 388, 208], optimise: [380, 494, 236], socials: [114, 388, 208], receptionist: [114, 172, 208], growth: [614, 280, 168] } };
// Phones: the hub on top, agents in one column below, joined by curves down the left.
const TALL: Layout = { w: 340, h: 790, cx: 170, cy: 132, hubR: 92, ringR: 118, font: 15, pos: {
  sales: [170, 346, 300], jobs: [170, 420, 300], integrations: [170, 494, 300], optimise: [170, 568, 300], receptionist: [170, 652, 300], socials: [170, 726, 300], growth: [170, 273, 200] } };

const I = { // 24px line icons, drawn around (0,0)
  sales: <path d="M-9-7h18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H-2l-6 5v-5h-1a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3z" />,
  jobs: <><rect x="-8" y="-10" width="16" height="20" rx="3" /><path d="M-4-4h8M-4 1h8M-4 6h5" /></>,
  optimise: <path d="M-10 9h20M-7 5v-5M-1 5v-10M5 5v-6M-8-3l6-5 5 3 6-6" />,
  integrations: <><path d="M-3-11v6M3-11v6M-7-5h14v5a7 7 0 0 1-14 0z" /><path d="M0 7v5" /></>,
  receptionist: <path d="M-8-10h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1-10-8a2 2 0 0 1 2-2z" />,
  socials: <><path d="M-9-3v6h4l8 5V-8l-8 5z" /><path d="M7-4a5 5 0 0 1 0 8" /></>,
};

const AGENTS: Agent[] = [
  { id: 'sales', name: 'Sales', status: 'live', icon: I.sales, does: 'Replies to new enquiries from your services and prices, qualifies the customer and holds a time in your calendar.', with: ['jobs', 'integrations', 'optimise', 'receptionist', 'socials'] },
  { id: 'jobs', name: 'Job Manager', status: 'live', icon: I.jobs, does: 'Quotes from your price list, invoices when the work is done and chases payment politely, with correct GST.', with: ['sales', 'integrations', 'optimise'] },
  { id: 'integrations', name: 'Integrations', status: 'live', icon: I.integrations, does: 'Connects Stripe, Google Calendar, Xero or a spreadsheet with the least access needed, and automates repeated jobs.', with: ['sales', 'jobs', 'optimise', 'receptionist'] },
  { id: 'optimise', name: 'Business Optimisation', status: 'live', icon: I.optimise, does: 'Reads 18 measures every week, gives up to 8 fixes with the reason, and hands each fix to the right agent.', with: ['sales', 'jobs', 'integrations', 'socials'] },
  { id: 'socials', name: 'Socials & Marketing', status: 'live', icon: I.socials, does: 'Plans and drafts posts and campaigns in your own voice. The enquiries they bring go straight to Sales.', with: ['sales', 'optimise'] },
  { id: 'receptionist', name: 'Receptionist', status: 'live', icon: I.receptionist, does: 'Answers the phone as an AI assistant, takes details and books new customers into your calendar.', with: ['sales', 'integrations'] },
];
const GROWTH: Agent = { id: 'growth', name: 'Growth Manager', status: 'live', icon: null, does: 'Works behind the scenes: coordinates the team so no two agents give conflicting advice about the same customer or job.', with: ['sales', 'jobs', 'integrations', 'optimise', 'receptionist', 'socials'] };
const BY_ID: Record<string, Agent> = Object.fromEntries([...AGENTS, GROWTH].map((a) => [a.id, a]));

// Agent-to-agent hand-offs, drawn as arcs bowed away from the hub.
const PEERS: [string, string][] = [
  ['sales', 'jobs'], ['jobs', 'integrations'], ['integrations', 'optimise'], ['jobs', 'optimise'],
  ['receptionist', 'sales'], ['socials', 'sales'], ['socials', 'optimise'],
];
function linkPath(L: Layout, id: string, tall: boolean) {
  const [x, y, pw] = L.pos[id];
  const ex = x - pw / 2 + 27;
  return tall ? `M${L.cx} ${L.cy} C${L.cx - 150} ${L.cy + 70} ${ex - 34} ${y - 70} ${ex} ${y}` : `M${L.cx} ${L.cy} L${x} ${y}`;
}
function arc(L: Layout, a: string, b: string) {
  const [ax, ay] = L.pos[a];
  const [bx, by] = L.pos[b];
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  let dx = mx - L.cx;
  let dy = my - L.cy;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  const bow = L === WIDE ? 120 : 70;
  return `M${ax} ${ay} Q${mx + dx * bow} ${my + dy * bow} ${bx} ${by}`;
}

export function EcosystemDiagram({ siteName }: { siteName: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 719px)');
    const on = () => setTall(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const L = tall ? TALL : WIDE;
  const { cx: CX, cy: CY, hubR, ringR } = L;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // B10: assemble the network the first time it comes into view. Only armed when the map starts below the screen,
  // so it is never hidden and shown again; otherwise (and with reduced motion) it is simply there.
  const hubRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const nodeRefs = useRef<(SVGGElement | null)[]>([]);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!prefersReducedMotion() && supportsWaapi() && belowViewport(ref.current)) setArmed(true);
  }, []);
  const assemble = useInsertMotion('B10', () => (armed && hubRef.current ? {
    focus: hubRef.current as unknown as HTMLElement, beam: ringRef.current as unknown as HTMLElement,
    nodes: nodeRefs.current.filter(Boolean) as unknown as HTMLElement[],
  } : null), { targetsKey: `${armed}-${tall}`, params: { nodeStagger: 260 } });
  const { play: playAssemble } = assemble;
  useEffect(() => { if (armed && inView) playAssemble(); }, [armed, inView, playAssemble]);

  // C02: when an agent is selected, one path draws from it to your business and one token arrives at the hub.
  const routeRef = useRef<SVGPathElement>(null);
  const tokenRef = useRef<SVGCircleElement>(null);
  const arriveRef = useRef<SVGCircleElement>(null);
  useLayoutEffect(() => {
    if (!active || active === 'growth' || !routeRef.current) return;
    return runMotion('C02', { beam: routeRef.current as unknown as HTMLElement, focus: tokenRef.current as unknown as HTMLElement, overlay: arriveRef.current as unknown as HTMLElement }, { params: { reverse: true } });
  }, [active, tall]);

  const lit = (id: string) => !active || active === 'growth' || id === active || BY_ID[active].with.includes(id);
  const peerLit = (a: string, b: string) => active !== null && ((a === active && BY_ID[active].with.includes(b)) || (b === active && BY_ID[active].with.includes(a)));
  const current = active ? BY_ID[active] : null;
  const onKey = (id: string) => (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive((v) => (v === id ? null : id)); } };

  return (
    <div ref={ref} className="eco2" data-in={inView ? 'true' : 'false'} data-active={active ?? undefined}>
      <div className="eco2-stage">
      <svg className="eco2-svg" viewBox={`0 0 ${L.w} ${L.h}`} style={{ ["--eco2-font" as string]: `${L.font}px` }} role="group" aria-label={`${siteName} ecosystem map. Choose an agent to see what it does and who it works with.`}>
        <defs>
          <radialGradient id="eco2-hub" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" style={{ stopColor: 'color-mix(in srgb, var(--cells-accent) 14%, #fff)' }} />
            <stop offset="100%" style={{ stopColor: 'color-mix(in srgb, var(--cells-accent) 28%, #fff)' }} />
          </radialGradient>
          <radialGradient id="eco2-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: 'var(--cells-accent)', stopOpacity: 0.32 }} />
            <stop offset="100%" style={{ stopColor: 'var(--cells-accent)', stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id="eco2-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--cells-accent)', stopOpacity: 0.9 }} />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.25" />
            <stop offset="100%" style={{ stopColor: 'var(--cells-accent)', stopOpacity: 0.9 }} />
          </linearGradient>
          <filter id="eco2-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="eco2-shadow" x="-30%" y="-50%" width="160%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#2e1a54" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* agent-to-agent hand-offs */}
        {!tall && PEERS.map(([a, b], i) => (
          <path key={`p-${a}-${b}`} d={arc(L, a, b)} pathLength={1}
            className={`eco2-peer${peerLit(a, b) ? ' is-lit' : ''}`} style={{ ['--i' as string]: i }} />
        ))}

        {/* hub aura and ripples */}
        <circle cx={CX} cy={CY} r={ringR + 40} fill="url(#eco2-aura)" className="eco2-aura" />
        <circle cx={CX} cy={CY} r={hubR} className="eco2-ripple" style={{ transformOrigin: `${CX}px ${CY}px` }} />
        <circle cx={CX} cy={CY} r={hubR} className="eco2-ripple eco2-ripple-2" style={{ transformOrigin: `${CX}px ${CY}px` }} />

        {/* hub-to-agent links with travelling data pulses */}
        {AGENTS.map((a, i) => {
          const d = linkPath(L, a.id, tall);
          return (
            <g key={`l-${a.id}`} className={`eco2-link${lit(a.id) ? '' : ' is-dim'}`} style={{ ['--i' as string]: i }}>
              <path d={d} pathLength={1} className="eco2-link-base" />
              <path d={d} className="eco2-link-flow" />
              {(
                <>
                  <circle r="4.5" className="eco2-pulse" filter="url(#eco2-glow)">
                    <animateMotion dur={`${2.6 + i * 0.25}s`} repeatCount="indefinite" path={d} begin={`${i * 0.4}s`} />
                  </circle>
                  <circle r="3.5" className="eco2-pulse eco2-pulse-back" filter="url(#eco2-glow)">
                    <animateMotion dur={`${3.1 + i * 0.2}s`} repeatCount="indefinite" path={d} keyPoints="1;0" keyTimes="0;1" calcMode="linear" begin={`${0.9 + i * 0.3}s`} />
                  </circle>
                </>
              )}
            </g>
          );
        })}

        {/* Growth Manager: a slowly turning ring with an orbiting spark */}
        <g className="eco2-in" ref={ringRef}>
        <g className="eco2-gm" style={{ transformOrigin: `${CX}px ${CY}px` }}>
          <circle cx={CX} cy={CY} r={ringR} className="eco2-ring" stroke="url(#eco2-ring)" />
          <circle cx={CX} cy={CY - ringR} r="5" className="eco2-orbit" filter="url(#eco2-glow)" />
        </g>
        </g>

        {/* C02 route for the selected agent (drawn over its solid link) */}
        {active && active !== 'growth' && (
          <g className="eco2-route-g" key={`r-${active}`}>
            <path ref={routeRef} d={linkPath(L, active, tall)} className="eco2-route" />
            <circle ref={arriveRef} cx={CX} cy={CY} r={hubR + 6} className="eco2-arrive" />
            <circle ref={tokenRef} cx={0} cy={0} r="6" className="eco2-token" filter="url(#eco2-glow)" />
          </g>
        )}
        {/* Growth Manager works behind the scenes; selectable like the agents (signature: B10). */}
        <g className={`eco2-gm-btn${active === 'growth' ? ' is-active' : ''}`} role="button" tabIndex={0} aria-pressed={active === 'growth'}
          aria-label={`Growth Manager, behind the scenes. ${GROWTH.does}`}
          onMouseEnter={() => setActive('growth')} onMouseLeave={() => setActive(null)}
          onFocus={() => setActive('growth')} onBlur={() => setActive(null)}
          onClick={() => setActive('growth')} onKeyDown={onKey('growth')}>
        {tall ? (
          <g className="eco2-gm-label">
            <rect x={CX - 100} y={CY + ringR + 12} width="200" height="46" rx="14" className="eco2-gm-chip" />
            <text x={CX} y={CY + ringR + 31} className="eco2-gm-title" textAnchor="middle">Growth Manager</text>
            <text x={CX} y={CY + ringR + 49} className="eco2-gm-sub" textAnchor="middle">keeps everyone in sync</text>
          </g>
        ) : (
          <g className="eco2-gm-label">
            <rect x={CX + ringR + 6} y={CY - 26} width="168" height="50" rx="14" className="eco2-gm-chip" />
            <text x={CX + ringR + 20} y={CY - 4} className="eco2-gm-title">Growth Manager</text>
            <text x={CX + ringR + 20} y={CY + 14} className="eco2-gm-sub">keeps everyone in sync</text>
          </g>
        )}
        </g>

        {/* hub */}
        <g className="eco2-hub eco2-in" ref={hubRef}>
          <circle cx={CX} cy={CY} r={hubR} fill="url(#eco2-hub)" className="eco2-hub-disc" filter="url(#eco2-shadow)" />
          <image href="/brand/logo.webp" x={CX - 18} y={CY - hubR + 24} width="36" height="36" />
          <text x={CX} y={CY - 6} className="eco2-hub-title" textAnchor="middle">Your business</text>
          <text x={CX} y={CY + 20} className="eco2-hub-sub" textAnchor="middle">Services, prices, customers,</text>
          <text x={CX} y={CY + 40} className="eco2-hub-sub" textAnchor="middle">jobs, calendar and payments</text>
        </g>

        {/* agents */}
        {AGENTS.map((a, i) => {
          const [x, y, pw] = L.pos[a.id];
          const left = x - pw / 2;
          return (
          <g key={a.id} className={`eco2-node${a.status === 'soon' ? ' is-soon' : ''}${lit(a.id) ? '' : ' is-dim'}${active === a.id ? ' is-active' : ''}`}
            style={{ ['--i' as string]: i, transformOrigin: `${x}px ${y}px` }}
            role="button" tabIndex={0} aria-pressed={active === a.id}
            aria-label={`${a.name}${a.status === 'soon' ? ', coming soon' : ''}. ${a.does}`}
            onMouseEnter={() => setActive(a.id)} onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(a.id)} onBlur={() => setActive(null)}
            onClick={() => setActive(a.id)} onKeyDown={onKey(a.id)}>
            <g className="eco2-in" ref={(el) => { nodeRefs.current[i] = el; }}>
            <g className="eco2-lift">
            <rect x={left} y={y - 29} width={pw} height="58" rx="29" className="eco2-pill" filter="url(#eco2-shadow)" />
            <circle cx={left + 27} cy={y} r="17" className="eco2-icon-bg" />
            <g transform={`translate(${left + 27} ${y}) scale(0.72)`} className="eco2-icon">{a.icon}</g>
            {a.status === 'soon' ? (
              <>
                <text x={left + 52} y={y - 2} className="eco2-name">{a.name}</text>
                <text x={left + 52} y={y + 15} className="eco2-soon">Coming soon</text>
              </>
            ) : <text x={left + 52} y={y + 5} className="eco2-name">{a.name}</text>}
            {a.status === 'live' && <circle cx={left + pw - 18} cy={y - 13} r="4" className="eco2-live" />}
            </g>
            </g>
          </g>
          );
        })}
      </svg>

      {current && (() => {
        const [x, y, pw] = L.pos[current.id];
        const above = y > L.h * (tall ? 0.72 : 0.6);
        const style: Record<string, string> = {};
        if (tall) {
          style.left = `${((x - pw / 2) / L.w) * 100}%`;
          style.width = `${(pw / L.w) * 100}%`;
        } else if (x < L.w * 0.3) {
          style.left = `${((x - pw / 2) / L.w) * 100}%`;
        } else if (x > L.w * 0.7) {
          style.right = `${((L.w - (x + pw / 2)) / L.w) * 100}%`;
        } else {
          style.left = `${(x / L.w) * 100}%`;
          style.transform = 'translateX(-50%)';
        }
        if (above) style.bottom = `${((L.h - (y - 36)) / L.h) * 100}%`;
        else style.top = `${((y + 36) / L.h) * 100}%`;
        return (
          <div className="eco2-card" style={style} role="status" key={current.id}>
            <p className="eco2-card-name">{current.name}{current.status === 'soon' && <em className="cells-tag eco2-card-tag">Coming soon</em>}{current.id === 'growth' && <em className="cells-tag eco2-card-tag">Behind the scenes</em>}</p>
            <AgentSignature id={current.id} />
            <p className="eco2-card-does">{current.does}</p>
            <p className="eco2-card-with">Works with: {current.with.map((id) => BY_ID[id].name).join(', ')}</p>
          </div>
        );
      })()}
      </div>
      <p className="eco2-hint">Hover or tap an agent to see what it does and who it works with. Nothing reaches a customer until you approve it.</p>
    </div>
  );
}

// The Insert Agentic motion registry: all 33 presets behind one entry point.
//   A01–A09, B01–B12: the canonical V2 engine (insert-motion.js, unchanged). When a preset has prototype numbers and
//                     the caller passes measured params, the parameterised twin in param-presets.ts is used instead
//                     (same choreography, measured numbers).
//   C01–C12:          new presets (c-series.ts), implemented to the handoff's C-series specifications.
// Reference: docs/motion/MOTION_LIBRARY.md. Studio (development only): /lab/motion.
import './insert-motion.js';
import type { MotionHandle, MotionTargets } from './insert-motion';
import { createCPreset, C_DURATION, type CId } from './c-series';
import { createParamPreset, PARAMETERISED, type MotionParams } from './param-presets';

export type { MotionHandle, MotionTargets, MotionParams };
export type AbId =
  | 'A01' | 'A02' | 'A03' | 'A04' | 'A05' | 'A06' | 'A07' | 'A08' | 'A09'
  | 'B01' | 'B02' | 'B03' | 'B04' | 'B05' | 'B06' | 'B07' | 'B08' | 'B09' | 'B10' | 'B11' | 'B12';
export type PresetId = AbId | CId;

export interface PresetSpec {
  id: PresetId;
  name: string;
  series: 'A' | 'B' | 'C';
  /** 'Reference' / 'Reference reconstruction' / 'Extension' (V2), or 'New (C-series)'. */
  source: string;
  /** Default (catalogue) duration in ms. Product UI may run it faster with the adapter's `speed`. */
  duration: number;
  meaning: string;
  targets: string;
  start: string;
  end: string;
  trigger: string;
  reduced: string;
  useFor: string;
  avoid: string;
  /** Where the website uses it ('' = studio only). */
  usedIn: string;
}

const S = (s: Omit<PresetSpec, 'series'>): PresetSpec => ({ ...s, series: s.id[0] as 'A' | 'B' | 'C' });

export const PRESETS: PresetSpec[] = [
  S({ id: 'A01', name: 'Backward tilt', source: 'Reference', duration: 1600, meaning: 'Whole interface tilts from front-on to 55° backward.', targets: 'stage', start: 'Flat', end: 'rotateX 55°', trigger: 'Once, product reveal', reduced: 'Flat, no tilt', useFor: 'Opening a product reveal', avoid: 'Text-heavy or form UI', usedIn: 'Hero (inside A09)' }),
  S({ id: 'A02', name: 'Isometric rotation', source: 'Reference', duration: 1600, meaning: 'Already tilted stage turns sideways to −42°.', targets: 'stage', start: 'rotateX 55°', end: 'rotateX 55° rotateY −42°', trigger: 'After A01', reduced: 'Flat', useFor: 'Establishing perspective', avoid: 'Standing alone without A01', usedIn: 'Hero (inside A09)' }),
  S({ id: 'A03', name: 'Exploded layers', source: 'Reference', duration: 1800, meaning: 'All layers rise SIMULTANEOUSLY to distinct depths on a fixed isometric camera.', targets: 'stage, layers[] (bottom→top)', start: 'Isometric, layers at Z 0', end: 'Layers at depthStep×(i+1)', trigger: 'Once, explain anatomy', reduced: 'Flat stack', useFor: 'Showing what a screen is made of', avoid: 'Introducing new cards (A04) or flipping one card (A05)', usedIn: '' }),
  S({ id: 'A04', name: 'Staggered side-entry', source: 'Extension', duration: 2400, meaning: 'Flat camera; different cards enter from ALTERNATING sides one at a time; no Z lift.', targets: 'stage, layers[]', start: 'Cards hidden, offset ±sideOffset', end: 'Cards in place', trigger: 'Once on intersection', reduced: 'All cards in place', useFor: 'Assembling a dashboard', avoid: 'Morphing one element between layouts (that is C01)', usedIn: 'Home benefits card “1 platform”; Understand step panel' }),
  S({ id: 'A05', name: '3D card flip', source: 'Extension', duration: 2200, meaning: 'ONE two-sided card rotates Y 180° to reveal a different reverse face.', targets: 'stage, focus (card with two faces)', start: 'Front face', end: 'Reverse face', trigger: 'Explicit user action', reduced: 'Show both faces flat', useFor: 'Revealing capabilities', avoid: 'Automatic flipping; hover-only reveals', usedIn: '' }),
  S({ id: 'A06', name: 'Camera drift', source: 'Reference', duration: 2700, meaning: 'Separated layers hold while the camera turns −42° → −36°.', targets: 'stage, layers[]', start: 'Iso, separated', end: 'Drifted, separated', trigger: 'Hold inside a sequence', reduced: 'Flat', useFor: 'Calm hold', avoid: 'Loops', usedIn: 'Hero (inside A09)' }),
  S({ id: 'A07', name: 'Layer collapse', source: 'Reference', duration: 1500, meaning: 'Separated layers reconnect bottom-up with a 60ms stagger.', targets: 'stage, layers[]', start: 'Separated', end: 'Layers at Z 0', trigger: 'Resolve an exploded view', reduced: 'Collapsed', useFor: 'Ending A03', avoid: 'Without a prior separation', usedIn: 'Hero (inside A09)' }),
  S({ id: 'A08', name: 'Flat restoration', source: 'Reference', duration: 1500, meaning: 'Reassembled stage turns from perspective back to front-on.', targets: 'stage', start: 'Isometric', end: 'Flat', trigger: 'Return to legibility', reduced: 'Flat', useFor: 'Restoring readability', avoid: 'Starting from flat', usedIn: 'Hero (inside A09); Grow step panel (restores to flat)' }),
  S({ id: 'A09', name: 'Full cinematic loop', source: 'Reference reconstruction', duration: 6000, meaning: 'Flat hold, tilt, staggered depth, drift, collapse, restoration. Starts and ends flat.', targets: 'stage, layers[]', start: 'Flat', end: 'Flat (same pose)', trigger: 'Once on first view; replay button', reduced: 'Static flat product view', useFor: 'Signature hero, once per page', avoid: 'More than once per page; auto-looping', usedIn: 'Home hero product view' }),
  S({ id: 'B01', name: 'Hero card lift', source: 'Extension', duration: 1800, meaning: 'One card rises; surrounding UI stays grounded.', targets: 'stage, focus', start: 'Card grounded', end: 'Card lifted, scaled 1.06', trigger: 'Hover/focus/tap selection', reduced: 'Outline highlight only', useFor: 'Selected item', avoid: 'Lifting several cards', usedIn: 'Ecosystem map: selected agent (flat SVG version, 200ms)' }),
  S({ id: 'B02', name: 'Card fly-in', source: 'Extension', duration: 1700, meaning: 'ONE new card travels in from the right with depth and decelerates into its slot.', targets: 'focus', start: 'Off to the right, hidden', end: 'In slot', trigger: 'A new item arrives', reduced: 'Card in place', useFor: 'New enquiry or notification', avoid: 'Assembling many cards (A04)', usedIn: 'Home benefits card “Less admin”; enquiry journey step 1' }),
  S({ id: 'B03', name: 'Depth carousel', source: 'Extension', duration: 2200, meaning: 'Three cards fan out with Y rotation and depth; centre card forward.', targets: 'stage, nodes[3]', start: 'Stacked', end: 'Fanned in depth', trigger: 'Choice between options', reduced: 'Three cards side by side', useFor: 'Agent selection', avoid: 'Planar content fans (B09)', usedIn: '' }),
  S({ id: 'B04', name: 'Conversation cascade', source: 'Extension', duration: 2300, meaning: 'Chat bubbles reveal one after another.', targets: 'nodes[] (bubbles)', start: 'Hidden', end: 'All bubbles shown', trigger: 'Conversation demo', reduced: 'All bubbles shown', useFor: 'Sales replies', avoid: 'Implying a message was sent', usedIn: 'Ecosystem: Sales signature; enquiry journey step 2' }),
  S({ id: 'B05', name: 'Voice waveform', source: 'Extension', duration: 2200, meaning: 'Audio bars pulse independently (two cycles, then stop).', targets: 'waveform[]', start: 'Bars low', end: 'Bars low', trigger: 'Call demo', reduced: 'Static bars', useFor: 'Receptionist (coming soon)', avoid: 'Endless loops', usedIn: 'Ecosystem: Receptionist signature (coming soon)' }),
  S({ id: 'B06', name: 'Booking confirmation', source: 'Extension', duration: 1900, meaning: 'Confirmation card rises, then a check appears.', targets: 'focus, overlay (check)', start: 'Hidden', end: 'Card + check', trigger: 'ONLY after a confirmed state change (or labelled demo)', reduced: 'Card + check', useFor: 'Booking result', avoid: 'Unconfirmed events', usedIn: 'Enquiry journey step 4 (labelled demo)' }),
  S({ id: 'B07', name: 'Job status transfer', source: 'Extension', duration: 2200, meaning: 'One card lifts, travels between two columns, lands; status reveals.', targets: 'focus, overlay', start: 'Card in first column', end: 'Card in second column', trigger: 'Status change', reduced: 'Card in second column', useFor: 'Job tracking', avoid: 'Explaining a multi-step sequence (C03)', usedIn: 'Ecosystem: Job Manager signature; enquiry journey step 4' }),
  S({ id: 'B08', name: 'Metric count-up', source: 'Extension', duration: 1800, meaning: 'A number interpolates to a REAL value (param target).', targets: 'counter', start: '0', end: 'target', trigger: 'Once on intersection', reduced: 'Final value', useFor: 'A fixed, published number', avoid: 'Invented metrics; the demo 24', usedIn: 'Home benefits card: the published “7” AI agents' }),
  S({ id: 'B09', name: 'Content fan-out', source: 'Extension', duration: 2100, meaning: 'Three content tiles spread from one centre with planar rotation.', targets: 'nodes[3]', start: 'Stacked', end: 'Fanned flat', trigger: 'Marketing demo', reduced: 'Three tiles side by side', useFor: 'Socials & Marketing (coming soon)', avoid: 'Depth carousels (B03)', usedIn: 'Ecosystem: Socials & Marketing signature (coming soon)' }),
  S({ id: 'B10', name: 'Network activation', source: 'Extension', duration: 2500, meaning: 'Hub, connectors and nodes reveal in sequence.', targets: 'focus (hub), beam (connectors), nodes[]', start: 'Hidden', end: 'Network shown', trigger: 'Once on first view', reduced: 'Network shown', useFor: 'Agents working together', avoid: 'Single path routing (C02)', usedIn: 'Ecosystem map assembly; Growth Manager signature; Activate step panel' }),
  S({ id: 'B11', name: 'Scan and highlight', source: 'Extension', duration: 2200, meaning: 'A scan beam sweeps; one target glows.', targets: 'beam, focus', start: 'No beam', end: 'Target highlighted', trigger: 'Analysis demo', reduced: 'Target highlighted', useFor: 'Business Optimisation', avoid: 'Implying real findings', usedIn: 'Ecosystem: Business Optimisation signature' }),
  S({ id: 'B12', name: 'CTA reveal', source: 'Extension', duration: 2000, meaning: 'Background stage recedes; CTA takes focus.', targets: 'stage (overlay optional)', start: 'Stage forward', end: 'Stage receded', trigger: 'Once on intersection', reduced: 'Receded stage', useFor: 'Closing scene', avoid: 'Hiding a CTA until the motion runs', usedIn: 'Home final CTA (stage only; the CTA itself is never animated)' }),
  S({ id: 'C01', name: 'Shared-element morph', source: 'New (C-series)', duration: 450, meaning: 'ONE element interpolates its bounds between two layouts (FLIP); adjacent details crossfade.', targets: 'focus (in last layout), params.from (first box), overlay (outgoing detail), nodes[] (incoming details)', start: 'Element at its old box', end: 'Element at its new box', trigger: 'Layout/state change', reduced: 'Jump to the new layout', useFor: 'One thing changing role or place', avoid: 'Introducing new cards (A04)', usedIn: 'Activate and Grow step panels (blocks morph setup → team → operations)' }),
  S({ id: 'C02', name: 'Connector routing', source: 'New (C-series)', duration: 650, meaning: 'ONE SVG path draws from source to target, then ONE token travels it and arrives.', targets: 'beam (SVG path), focus (token at 0,0), overlay (target mark)', start: 'Path undrawn', end: 'Path drawn, token arrived', trigger: 'Selection', reduced: 'Path drawn, no token', useFor: 'A specific hand-off', avoid: 'Whole-network reveals (B10)', usedIn: 'Ecosystem map: selected agent → your business; Integrations signature' }),
  S({ id: 'C03', name: 'Workflow progress', source: 'New (C-series)', duration: 450, meaning: 'Progress rail fills between discrete step markers; completed marker settles, next activates, panel swaps.', targets: 'beam (rail fill), nodes[] (markers), layers[] (panels); params from/to/count/axis', start: 'Rail at step from', end: 'Rail at step to', trigger: 'Step change (play or user)', reduced: 'Rail and panel at the new step', useFor: 'Explaining a sequence', avoid: 'Moving a job card (B07)', usedIn: 'Enquiry journey rail; /how-it-works five-step timeline' }),
  S({ id: 'C04', name: 'Approval gate', source: 'New (C-series)', duration: 350, meaning: 'Draft stops at a gate; an explicit owner action unlocks it; status label swaps.', targets: 'focus (draft), beam (gate), overlay (owner control), nodes[waiting, approved]; params.phase arrive|unlock', start: 'Draft before gate', end: 'arrive: waiting at gate; unlock (400ms): approved, moved on', trigger: 'arrive on step; unlock ONLY on owner action', reduced: 'Same states, no movement', useFor: 'Anything sent, quoted, booked or charged', avoid: 'Auto-approving without showing the owner action', usedIn: 'Enquiry journey (reply, quote, booking, reminder); /about approval illustration' }),
  S({ id: 'C05', name: 'Directional glass reflection', source: 'New (C-series)', duration: 900, meaning: 'A highlight follows the pointer along the card border; no rotation or depth. Focus shows a static highlight.', targets: 'focus ([data-c05] card); live use via attachC05 / data-c05', start: 'No highlight', end: 'Highlight at pointer', trigger: 'Pointer move (120–180ms response), focus-visible', reduced: 'Static highlight on hover/focus', useFor: 'Premium cards, price cards', avoid: 'Tilt effects; text cards inside 3D stages', usedIn: 'Home benefits strip and ecosystem map frame; /how-it-works price cards' }),
  S({ id: 'C06', name: 'Ambient gradient reveal', source: 'New (C-series)', duration: 700, meaning: 'A low-opacity background glow blooms once and settles; text never moves.', targets: 'beam or overlay (glow element)', start: 'Glow hidden', end: 'Glow at rest opacity', trigger: 'Once on intersection', reduced: 'Glow at rest', useFor: 'Closing sections', avoid: 'Looping glows', usedIn: 'Home final CTA' }),
  S({ id: 'C07', name: 'Accordion expansion', source: 'New (C-series)', duration: 200, meaning: 'Content region grows/collapses; disclosure indicator rotates.', targets: 'focus (content), overlay (indicator); params.open, height', start: 'Closed', end: 'Open (or reverse)', trigger: 'User toggle', reduced: 'Instant toggle', useFor: 'FAQs', avoid: 'Scroll-jacking to the item', usedIn: '/faq' }),
  S({ id: 'C08', name: 'Navigation sheet', source: 'New (C-series)', duration: 220, meaning: 'Mobile menu slides and fades in; focus moves to the first link; Escape closes.', targets: 'focus (sheet), nodes[] (links); params.open', start: 'Hidden', end: 'Shown', trigger: 'Menu button', reduced: 'Instant', useFor: 'Mobile nav', avoid: 'Trapping users', usedIn: 'Site header Menu (all pages, phones)' }),
  S({ id: 'C09', name: 'Route transition', source: 'New (C-series)', duration: 180, meaning: 'Brief crossfade of page content; header stays still; native navigation and scroll untouched.', targets: 'layers[out, in], shell (header, untouched)', start: 'Old page', end: 'New page', trigger: 'Same-site navigation', reduced: 'No transition', useFor: 'Page changes', avoid: 'Blocking navigation', usedIn: 'All public pages via CSS cross-document view transitions (browsers without support navigate normally)' }),
  S({ id: 'C10', name: 'Masked detail reveal', source: 'New (C-series)', duration: 400, meaning: 'Details revealed by a moving clip; geometry stays fixed.', targets: 'focus (clipped), beam (edge highlight)', start: 'Clipped away', end: 'Fully shown', trigger: 'Once on intersection', reduced: 'Shown', useFor: 'Revealing record details', avoid: 'Hiding essential text without JS', usedIn: '/ecosystem shared records' }),
  S({ id: 'C11', name: 'Integration handshake', source: 'New (C-series)', duration: 600, meaning: 'Two endpoints move together, lock, then a connection state appears (verified or clearly “demo”).', targets: 'nodes[a, b], beam (link), overlay (state); params.gap', start: 'Endpoints apart', end: 'Locked, state shown', trigger: 'ONLY after a verified connection event, or labelled demo', reduced: 'Locked state', useFor: 'Confirmed integrations in the app', avoid: 'Marketing pages implying a live connection', usedIn: '' }),
  S({ id: 'C12', name: 'Contextual focus zoom', source: 'New (C-series)', duration: 450, meaning: 'Camera reframes one panel without rotating; neighbours dim; resets on exit.', targets: 'stage (camera), focus, nodes[]; params.exit', start: 'Overview', end: 'Panel centred, others dimmed', trigger: 'User selects a panel', reduced: 'Highlight without zoom', useFor: 'Dense dashboards', avoid: 'Rotations; text that becomes blurry', usedIn: '' }),
];

export const PRESET_BY_ID = Object.fromEntries(PRESETS.map((p) => [p.id, p])) as Record<PresetId, PresetSpec>;

/** Build a motion. A/B without params → canonical engine; A/B with params → parameterised twin; C → c-series. */
export function createPreset(id: PresetId, targets: MotionTargets, params?: MotionParams): MotionHandle {
  if (id[0] === 'C') return createCPreset(id as CId, targets, params);
  if (params && (PARAMETERISED as readonly string[]).includes(id)) return createParamPreset(id as (typeof PARAMETERISED)[number], targets, params);
  return globalThis.InsertMotion.createMotion(id as AbId, targets);
}

export function presetDuration(id: PresetId) {
  return id[0] === 'C' ? C_DURATION[id as CId] : PRESET_BY_ID[id].duration;
}

/** C05 live use: the highlight follows the pointer along the border of [data-c05] elements (one delegated listener). */
export function attachC05(root: Document | HTMLElement = document) {
  const onMove = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.('[data-c05]') as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--c05x', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--c05y', `${((e.clientY - r.top) / r.height) * 100}%`);
    el.style.setProperty('--c05o', '1');
  };
  const onLeave = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.('[data-c05]') as HTMLElement | null;
    if (el && !el.contains(e.relatedTarget as Node | null)) el.style.setProperty('--c05o', '0');
  };
  root.addEventListener('pointermove', onMove as EventListener, { passive: true });
  root.addEventListener('pointerout', onLeave as EventListener, { passive: true });
  return () => {
    root.removeEventListener('pointermove', onMove as EventListener);
    root.removeEventListener('pointerout', onLeave as EventListener);
  };
}

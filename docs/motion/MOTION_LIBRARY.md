# Insert Agentic motion library (33 presets)

Reusable reference for the website and future UI work. Source of truth in code: `lib/motion/registry.ts`
(metadata + `createPreset`), `lib/motion/insert-motion.js` (canonical V2 engine, byte-for-byte unchanged),
`lib/motion/param-presets.ts` (measured twins), `lib/motion/c-series.ts` (C01–C12), `lib/motion/run.ts`
(`runMotion`, `poseStart`, `onceVisible`, `belowViewport`), `lib/motion/useInsertMotion.ts` (React adapter, extended
with `params`), `lib/motion/c05.css`. Development-only studio: `/lab/motion` (404 on production, noindex, not in the
sitemap or nav; `?id=A03&t=0.5` opens a preset paused at 50%).

Status, 28 Nov 2026: A/B presets run in the studio from the canonical engine; the measured twins produce identical
keyframes to the engine with default numbers (studio "Engine parity" check: all 12 "same"). C-series are new
implementations of the handoff specs, checked in the studio and, where "Used on the site" says so, on the website in
local production builds (Playwright). Not verified on a deployed preview (Vercel deployment protection).

## Contract (all 33)
`createPreset(id, targets, params?)` returns `{ duration, animations, seek(ms), destroy() }`. Tracks are paused Web
Animations; the caller drives time with one requestAnimationFrame loop (`useInsertMotion` for component-bound
motion with play/pause/replay, `runMotion` for event-triggered one-offs). `seek` is deterministic and clamped. Always
`destroy()` on unmount or change. Targets: `stage`, `shell`, `layers[]` (bottom→top), `focus`, `overlay`, `nodes[]`,
`beam`, `waveform[]`, `counter`; bind only what the preset needs.

- A/B without `params` → canonical engine. A03/A04/A06/A07/A09/B02/B03/B07/B08/B09/B10/B11 with `params` →
  parameterised twin (same choreography; measured `depthStep`, `sideOffset`, `flyDistance`/`flyDepth`, `spread`,
  `travel`, `target`, `nodeStagger`, `scanTravel`). Never ship the demo numbers (165px travel, count to 24).
- `runMotion` calls `onEnd` before it cancels the tracks, so React can commit the matching end state (flushSync)
  without a one-frame flicker. Design each motion so its end pose equals the element's CSS state (`keep: false`).
- Entrances: only hide-then-reveal elements that are BELOW the screen at mount (`belowViewport`); pose the start with
  `poseStart`, play on `onceVisible`. Anything on screen at load, without JS, or with reduced motion shows its final
  state.
- Reduced motion: no autoplay, no perspective, final meaningful state; controls still work.
- FLIP without layout movement: keep elements in their final layout and animate transforms only (see
  `app/cells/motion/step-panel.tsx`), so nothing counts as a layout shift.
- No backdrop-filter glass inside 3D stages (A01–A09); plain panels there.

## Selection rules
- Match motion to the meaning of the event; one primary motion per section, at most one supporting one.
- A03 (simultaneous Z separation) ≠ A04 (alternating lateral entry, flat) ≠ A05 (one two-sided card, 180° flip).
- B03 (depth carousel, Y rotation) ≠ B09 (planar fan). B02 (one arrival) ≠ A04 (assembling many).
- C01 (one element morphs between layouts) ≠ A04. C02 (one path, one token) ≠ B10 (whole network) ≠ C11 (two
  endpoints lock). C03 (progress through discrete steps) ≠ B07 (one card carried between columns).
- A09 at most once per page; never auto-looping on the website.
- Truth: success motions (B06 tick, B07 "Booked", C11 connected, B08 count) only after a confirmed state change, or
  clearly labelled "Illustrative demo". Approval gate (C04) before anything is sent, quoted, booked or charged.
- Never gate the headline, CTA or form behind a motion; never scroll-jack or pin on mobile; no hover-only information.

## Catalogue
| ID | Name | Source | ms | Meaning | Targets | Start → end | Trigger | Reduced motion | Use for | Avoid | Used on the site |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| A01 | Backward tilt | Reference | 1600 | Whole interface tilts from front-on to 55° backward. | stage | Flat → rotateX 55° | Once, product reveal | Flat, no tilt | Opening a product reveal | Text-heavy or form UI | Hero (inside A09) |
| A02 | Isometric rotation | Reference | 1600 | Already tilted stage turns sideways to −42°. | stage | rotateX 55° → rotateX 55° rotateY −42° | After A01 | Flat | Establishing perspective | Standing alone without A01 | Hero (inside A09) |
| A03 | Exploded layers | Reference | 1800 | All layers rise SIMULTANEOUSLY to distinct depths on a fixed isometric camera. | stage, layers[] (bottom→top) | Isometric, layers at Z 0 → Layers at depthStep×(i+1) | Once, explain anatomy | Flat stack | Showing what a screen is made of | Introducing new cards (A04) or flipping one card (A05) | Studio only |
| A04 | Staggered side-entry | Extension | 2400 | Flat camera; different cards enter from ALTERNATING sides one at a time; no Z lift. | stage, layers[] | Cards hidden, offset ±sideOffset → Cards in place | Once on intersection | All cards in place | Assembling a dashboard | Morphing one element between layouts (that is C01) | Home benefits card “1 platform”; Understand step panel |
| A05 | 3D card flip | Extension | 2200 | ONE two-sided card rotates Y 180° to reveal a different reverse face. | stage, focus (card with two faces) | Front face → Reverse face | Explicit user action | Show both faces flat | Revealing capabilities | Automatic flipping; hover-only reveals | Studio only |
| A06 | Camera drift | Reference | 2700 | Separated layers hold while the camera turns −42° → −36°. | stage, layers[] | Iso, separated → Drifted, separated | Hold inside a sequence | Flat | Calm hold | Loops | Hero (inside A09) |
| A07 | Layer collapse | Reference | 1500 | Separated layers reconnect bottom-up with a 60ms stagger. | stage, layers[] | Separated → Layers at Z 0 | Resolve an exploded view | Collapsed | Ending A03 | Without a prior separation | Hero (inside A09) |
| A08 | Flat restoration | Reference | 1500 | Reassembled stage turns from perspective back to front-on. | stage | Isometric → Flat | Return to legibility | Flat | Restoring readability | Starting from flat | Hero (inside A09); Grow step panel (restores to flat) |
| A09 | Full cinematic loop | Reference reconstruction | 6000 | Flat hold, tilt, staggered depth, drift, collapse, restoration. Starts and ends flat. | stage, layers[] | Flat → Flat (same pose) | Once on first view; replay button | Static flat product view | Signature hero, once per page | More than once per page; auto-looping | Home hero product view |
| B01 | Hero card lift | Extension | 1800 | One card rises; surrounding UI stays grounded. | stage, focus | Card grounded → Card lifted, scaled 1.06 | Hover/focus/tap selection | Outline highlight only | Selected item | Lifting several cards | Ecosystem map: selected agent (flat SVG version, 200ms) |
| B02 | Card fly-in | Extension | 1700 | ONE new card travels in from the right with depth and decelerates into its slot. | focus | Off to the right, hidden → In slot | A new item arrives | Card in place | New enquiry or notification | Assembling many cards (A04) | Home benefits card “Less admin”; enquiry journey step 1 |
| B03 | Depth carousel | Extension | 2200 | Three cards fan out with Y rotation and depth; centre card forward. | stage, nodes[3] | Stacked → Fanned in depth | Choice between options | Three cards side by side | Agent selection | Planar content fans (B09) | Studio only |
| B04 | Conversation cascade | Extension | 2300 | Chat bubbles reveal one after another. | nodes[] (bubbles) | Hidden → All bubbles shown | Conversation demo | All bubbles shown | Sales replies | Implying a message was sent | Ecosystem: Sales signature; enquiry journey step 2 |
| B05 | Voice waveform | Extension | 2200 | Audio bars pulse independently (two cycles, then stop). | waveform[] | Bars low → Bars low | Call demo | Static bars | Receptionist (coming soon) | Endless loops | Ecosystem: Receptionist signature (coming soon) |
| B06 | Booking confirmation | Extension | 1900 | Confirmation card rises, then a check appears. | focus, overlay (check) | Hidden → Card + check | ONLY after a confirmed state change (or labelled demo) | Card + check | Booking result | Unconfirmed events | Enquiry journey step 4 (labelled demo) |
| B07 | Job status transfer | Extension | 2200 | One card lifts, travels between two columns, lands; status reveals. | focus, overlay | Card in first column → Card in second column | Status change | Card in second column | Job tracking | Explaining a multi-step sequence (C03) | Ecosystem: Job Manager signature; enquiry journey step 4 |
| B08 | Metric count-up | Extension | 1800 | A number interpolates to a REAL value (param target). | counter | 0 → target | Once on intersection | Final value | A fixed, published number | Invented metrics; the demo 24 | Home benefits card: the published “7” AI agents |
| B09 | Content fan-out | Extension | 2100 | Three content tiles spread from one centre with planar rotation. | nodes[3] | Stacked → Fanned flat | Marketing demo | Three tiles side by side | Socials & Marketing (coming soon) | Depth carousels (B03) | Ecosystem: Socials & Marketing signature (coming soon) |
| B10 | Network activation | Extension | 2500 | Hub, connectors and nodes reveal in sequence. | focus (hub), beam (connectors), nodes[] | Hidden → Network shown | Once on first view | Network shown | Agents working together | Single path routing (C02) | Ecosystem map assembly; Growth Manager signature; Activate step panel |
| B11 | Scan and highlight | Extension | 2200 | A scan beam sweeps; one target glows. | beam, focus | No beam → Target highlighted | Analysis demo | Target highlighted | Business Optimisation | Implying real findings | Ecosystem: Business Optimisation signature |
| B12 | CTA reveal | Extension | 2000 | Background stage recedes; CTA takes focus. | stage (overlay optional) | Stage forward → Stage receded | Once on intersection | Receded stage | Closing scene | Hiding a CTA until the motion runs | Home final CTA (stage only; the CTA itself is never animated) |
| C01 | Shared-element morph | New (C-series) | 450 | ONE element interpolates its bounds between two layouts (FLIP); adjacent details crossfade. | focus (in last layout), params.from (first box), overlay (outgoing detail), nodes[] (incoming details) | Element at its old box → Element at its new box | Layout/state change | Jump to the new layout | One thing changing role or place | Introducing new cards (A04) | Activate and Grow step panels (blocks morph setup → team → operations) |
| C02 | Connector routing | New (C-series) | 650 | ONE SVG path draws from source to target, then ONE token travels it and arrives. | beam (SVG path), focus (token at 0,0), overlay (target mark) | Path undrawn → Path drawn, token arrived | Selection | Path drawn, no token | A specific hand-off | Whole-network reveals (B10) | Ecosystem map: selected agent → your business; Integrations signature |
| C03 | Workflow progress | New (C-series) | 450 | Progress rail fills between discrete step markers; completed marker settles, next activates, panel swaps. | beam (rail fill), nodes[] (markers), layers[] (panels); params from/to/count/axis | Rail at step from → Rail at step to | Step change (play or user) | Rail and panel at the new step | Explaining a sequence | Moving a job card (B07) | Enquiry journey rail; /how-it-works five-step timeline |
| C04 | Approval gate | New (C-series) | 350 | Draft stops at a gate; an explicit owner action unlocks it; status label swaps. | focus (draft), beam (gate), overlay (owner control), nodes[waiting, approved]; params.phase arrive/unlock | Draft before gate → arrive: waiting at gate; unlock (400ms): approved, moved on | arrive on step; unlock ONLY on owner action | Same states, no movement | Anything sent, quoted, booked or charged | Auto-approving without showing the owner action | Enquiry journey (reply, quote, booking, reminder); /about approval illustration |
| C05 | Directional glass reflection | New (C-series) | 900 | A highlight follows the pointer along the card border; no rotation or depth. Focus shows a static highlight. | focus ([data-c05] card); live use via attachC05 / data-c05 | No highlight → Highlight at pointer | Pointer move (120–180ms response), focus-visible | Static highlight on hover/focus | Premium cards, price cards | Tilt effects; text cards inside 3D stages | Home benefits strip and ecosystem map frame; /how-it-works price cards |
| C06 | Ambient gradient reveal | New (C-series) | 700 | A low-opacity background glow blooms once and settles; text never moves. | beam or overlay (glow element) | Glow hidden → Glow at rest opacity | Once on intersection | Glow at rest | Closing sections | Looping glows | Home final CTA |
| C07 | Accordion expansion | New (C-series) | 200 | Content region grows/collapses; disclosure indicator rotates. | focus (content), overlay (indicator); params.open, height | Closed → Open (or reverse) | User toggle | Instant toggle | FAQs | Scroll-jacking to the item | /faq |
| C08 | Navigation sheet | New (C-series) | 220 | Mobile menu slides and fades in; focus moves to the first link; Escape closes. | focus (sheet), nodes[] (links); params.open | Hidden → Shown | Menu button | Instant | Mobile nav | Trapping users | Site header Menu (all pages, phones) |
| C09 | Route transition | New (C-series) | 180 | Brief crossfade of page content; header stays still; native navigation and scroll untouched. | layers[out, in], shell (header, untouched) | Old page → New page | Same-site navigation | No transition | Page changes | Blocking navigation | All public pages via CSS cross-document view transitions (browsers without support navigate normally) |
| C10 | Masked detail reveal | New (C-series) | 400 | Details revealed by a moving clip; geometry stays fixed. | focus (clipped), beam (edge highlight) | Clipped away → Fully shown | Once on intersection | Shown | Revealing record details | Hiding essential text without JS | /ecosystem shared records |
| C11 | Integration handshake | New (C-series) | 600 | Two endpoints move together, lock, then a connection state appears (verified or clearly “demo”). | nodes[a, b], beam (link), overlay (state); params.gap | Endpoints apart → Locked, state shown | ONLY after a verified connection event, or labelled demo | Locked state | Confirmed integrations in the app | Marketing pages implying a live connection | Studio only |
| C12 | Contextual focus zoom | New (C-series) | 450 | Camera reframes one panel without rotating; neighbours dim; resets on exit. | stage (camera), focus, nodes[]; params.exit | Overview → Panel centred, others dimmed | User selects a panel | Highlight without zoom | Dense dashboards | Rotations; text that becomes blurry | Studio only |

## Implementation notes (C-series)
- C01: `params.from` / `to` boxes. Measure with `offsetLeft/Top/Width/Height` against a shared parent so ancestor
  transforms do not distort them. Children passed as `nodes` fade in from 45%; `overlay` fades out early.
- C02: `beam` must be an SVG geometry element; the token is drawn at (0,0) in the same coordinate space and moved
  along `getPointAtLength` samples. `params.reverse` draws from the path's end.
- C03: `params.from`, `to`, `count`, `axis: 'x' | 'y'`; give the rail CSS `scaleX/Y(var(--p))` matching the end.
- C04: two handles: `phase: 'arrive'` (350ms) and `phase: 'unlock'` (400ms, `advance` px). Only run unlock after an
  explicit owner action; in autoplay demos show the tap and label it as a demo.
- C05: CSS (`lib/motion/c05.css`) driven by `attachC05()`; registered `@property` gives the 150ms pointer follow.
- C07 / C08: `params.open`; closing finishes before `details.open = false`.
- C09: production uses `@view-transition { navigation: auto; }` (cells.css, 180ms); the header has its own
  `view-transition-name` and does not animate. Unsupported browsers navigate normally. Disabled for reduced motion.
- C11: studio only on marketing pages (no implication that integrations are connected).
- C12: bind while the camera is untransformed; `params.exit` resets.

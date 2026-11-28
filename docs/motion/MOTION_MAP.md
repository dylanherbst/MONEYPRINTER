# Motion map: audit of the live site (baseline `main` @ 4377c12) and planned presets

Phase 1 of the motion upgrade (28 Nov 2026). Inspected in the repository and in a local production build
(`VERCEL_ENV=production next start`). Before screenshots: `/home/claude/motion-shots/before/` (1440, 1280, 390, 320).

## What exists
- Next 16.4.6 App Router, React 19.3, three.js only for the WebGL "cells" scene (`app/cells/cells-stage.tsx`,
  `app/cells/_scene/*`). No animation library. Styles in `app/cells/cells.css` (+ `app/globals.css`).
- Scroll engine: every `[data-chapter]` element is a formation step (field, vortex, helix, horizon, ring, galaxy on
  `/`); the logo chapter ends when `#cells-h-paid` reaches 68% of the screen. Measured once on load and on resize.
  Constraint: never add, remove or reorder `[data-chapter]` elements, and keep section heights stable after hydration.
- Existing motion: the ecosystem map (`app/ecosystem/ecosystem-diagram.tsx`): CSS/SVG link draw-in, travelling
  pulses, turning Growth Manager ring, hover/focus/tap highlighting with solid lines and a floating info card;
  nodes were hidden (opacity 0) until the map scrolled into view. Header Menu is a `<details>`. FAQ is `<details>`.
- Early-access funnel: every CTA → `/signup` → `EarlyAccessForm` → `POST /api/early-access` (Vercel Blob).
- Availability on the map: no "Coming soon" labels (an earlier owner request); `/ecosystem` cards had no tag for
  Receptionist / Socials & Marketing.

## Section → preset plan (as implemented)
| Surface | Real component | Primary | Supporting | Trigger | Reduced / mobile |
|---|---|---|---|---|---|
| Home hero | `motion/hero-product.tsx` (illustrative workspace under the CTA) | A09 | — | once on first view, Replay | static front view (<720px, reduced) |
| Benefits | `motion/benefits.tsx` (the 3 hero points) | B08 (fixed "7") | A04, B02 | once on view | final state |
| Ecosystem map | `ecosystem/ecosystem-diagram.tsx` | B10 | B01, C02, per-agent signature | first view; hover/focus/tap | static map + text card |
| Understand / Activate / Grow | `motion/step-panel.tsx` in each step card | A04 → C01 + B10 → C01 + A08 | — | each step once on view | three static panels, no pinning |
| Enquiry to paid | `motion/enquiry-journey.tsx` (new non-chapter section after the ring chapter) | C03 | B02, B04, C04, B07, B06 | once on view or Play; Pause/Replay/steps | step-by-step, no autoplay |
| Final CTA | `motion/final-glow.tsx` (backdrop only) | B12 (stage only) | C06 | once on view | settled backdrop; CTA never animated |
| /how-it-works | `how-it-works/workflow-timeline.tsx`, price cards | C03 | C05 | once on view, Replay | complete timeline |
| /ecosystem | same map component, cards, `shared-records.tsx` | B10/C02 (map) | C10, quiet reveals | as above | static |
| /faq | `faq/faq-accordion.tsx` | C07 | — | user toggle | instant |
| /about | cards, `about/approval-demo.tsx` | quiet reveals | C04 | on view; owner click unlocks | static |
| Site-wide | `motion/motion-boot.tsx`, `cells.css` | C08 (Menu), C05 | C09 (CSS view transitions) | interaction / navigation | instant / none |

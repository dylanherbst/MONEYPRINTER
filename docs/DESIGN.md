# VENTRA design reference (DESIGN.md)

Single source for design agents (`ventra-frontend`, plugins `frontend-design`, `impeccable`, `taste-skill`, `web-design-guidelines`). Values below were read from the code on 2026-11-03; they describe what exists, they do not invent a new look. If a new request conflicts with this file, keep the approved design and tell the owner.

## Approved direction: V5 subtle teal glass

Light, white-dominant, pastel, frosted glass with one teal accent. Beginner-friendly, calm, minimal. Applies to the new shell (`.ventra-app`, `apps/web/app/design-system/tokens.css`). Do not restyle it into dark or neon.

## Tokens (`tokens.css`, scoped to `.ventra-app`)

| Token | Value | Use |
| --- | --- | --- |
| `--v-accent` | `#14BAB8` | the single accent: glows, highlights |
| `--v-ink-teal` / `--v-ink-deep` | `#07393D` / `#071F24` | primary button and active nav gradient (`#071F24 -> #07565A`) |
| `--v-text` / `--v-text-muted` / `--v-text-faint` | `#111D21` / `#5A696F` / `#7D8B91` | text |
| `--v-bg` / `--v-bg-cool` | `#E8EFF1` / `#DBE8EA` | page background gradient `#F0F5F5 -> #DCE8EA` |
| `--v-glass` / `--v-glass-strong` | `rgba(255,255,255,.42)` / `.68` | frosted surfaces |
| `--v-glass-stroke` / `-subtle` | `rgba(255,255,255,.72)` / `rgba(112,146,153,.15)` | 1px borders |
| `--v-success` / `--v-warning` / `--v-danger` | `#138969` / `#AC7728` / `#C84D56` | status |

Type: Inter, system fallbacks; body 14px/1.5; page title 28/36 weight 600; section titles 18/25 weight 600; overline 10px.
Shape: pill buttons (radius 999px, min height 44px), cards 18 to 24px radius, icon tiles 13px, nav rows 14px.
Depth: `0 12px 36px rgba(15,49,54,.08)` plus 1px inner white highlight. Layout: 248px sidebar, content max 1600px, 16 to 24px gaps.
Focus: 3px solid `#08777b`, offset 4px. Never remove it.

## Legacy authoring screens (`app/globals.css`)

Older course-authoring pages still use a dark purple palette (`--canvas #040217`, accent `#c2b4ff`, gradient indigo to purple to amber, DM Sans). It is legacy and scoped separately. New work uses the teal glass tokens; do not mix the two in one screen. Whether to migrate legacy screens is an owner decision.

## Rules for any UI work

1. Reuse components in `apps/web/app/design-system/primitives.tsx` and `apps/web/app/ui/` before creating new ones.
2. Use tokens, not new hex values. Add a token here first if one is truly missing.
3. Touch targets at least 44px; WCAG AA contrast; visible focus; honor `prefers-reduced-motion`.
4. Mobile first: check 375px, 768px and desktop. No horizontal scroll.
5. Plain beginner language. Show connection state (DEMO / LIVE) on tool pages.
6. Verify in a real browser (Playwright plugin), not only by reading code.

## Plugins that support design (all off until needed)

`frontend-design`, `impeccable`, `taste-skill`, `figma` (needs sign-in), `web-design-guidelines` (project skill), Playwright and Chrome DevTools. Generic skill output is advisory; this file and the existing screens win.

# UI regression report

Updated 24 November 2026. Tool: Playwright with Chrome. Sizes: mobile 390×844, desktop 1440×900. Home captured at all 7 scroll chapters; other pages as full-page shots.

## 1. Baseline copy vs live aimoneyprinter.com
At most 0.18% of pixels differ on every screen, all from the moving cells. Layout, fonts, colours, the cells scene, logo formation and header match exactly.

## 2. VentraAI rebrand vs baseline
| Screen | Pixels changed | Cause |
|---|---|---|
| Home chapters 2–6 | 1.5–5.7% | New wording only |
| Home chapters 0–1 | 9–23% | New hero and problem wording (longer text blocks) |
| Sign up | 3–9% | New heading and card text |
| FAQs | 2.4% desktop; mobile 32px shorter | New answers |
| How it works, About us | Page heights changed | New sections and wording |
| Policies | New page | — |

No change to CSS for layout, motion, cell scene, logo mask or header. The only CSS added is the "In development" tag and the policy page styles (taken from the aimoneyprinter.com preview).

Checked by eye: hero, problem section, step cards, logo ring, closing CTA, sign-up card and footer links render correctly on mobile and desktop.

Screenshots: kept with the session working files (`vw-shots/baseline`, `copy`, `rebrand`). Not committed.

## Known items
- The Tune design panel appears on preview builds and is hidden in production (same as live).
- On desktop, the "Less admin" description sits slightly higher than its two neighbours. This was inherited and is cosmetic.

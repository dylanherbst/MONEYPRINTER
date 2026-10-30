# PowerAI / Powerly reference brief

Inspected 2026-10-15. User reference: https://demo-powerai.sitesplaced.com/#cta

## Evidence and verification

- Public HTTPS document returned HTTP 200 using a normal GET. Canonical URL in its HTML: https://demo-powerai.sitesplaced.com . The title is “Demo PowerAI — Portfolio | SitesPlaced”; visible brand is Powerly.
- Findings below are verified from the returned HTML classes, inline styles, section contents and embedded design-system variables, not a rendered screenshot.
- Source document captured read-only at `/tmp/powerai-reference.html` (temporary local evidence; may expire). No form submissions, template downloads, account actions or third-party scripts were executed.
- Browser and browser-automation skill tools both returned “OpenClaw did not register a handler for this app-server tool call.” Consequently **no screenshots exist** and animation, rendered positioning, interaction and exact mobile appearance are unverified. This is a missing handler, not an explicit access-policy denial.

## Actual visual system

| Element | Verified source values |
|---|---|
| Canvas | Near-black navy `#040217`; warm-white `#f5f4f1` text |
| Signature gradient | `linear-gradient(to left, #6366f1 0%, #a855f7 50%, #fcd34d 100%)`: indigo at right, violet center, pale gold at left |
| Hero type | DM Sans / system sans, weight 400; `clamp(3.75rem, 16vw, 220px)`, line-height 1.02, tracking -0.024em |
| Section type | DM Sans, weight 500, `clamp(2rem, 5vw, 3.5rem)`, line-height 1.05, tracking -0.02em |
| UI and prose | Inter / system sans, mostly weight 400–600; 14px navigation/button text; body system token 1rem / 1.55 |
| Card treatment | White ~4% fill, warm-white 10% border, ~16–20px radii, soft dark shadows; no heavy opaque white dashboard surfaces |
| Buttons | Pill radius; restrained glass buttons and warm-white solid buttons; highlighted action uses signature gradient and dark text |
| Spatial rhythm | Wide centered containers; inline tokens max-width 76rem, section padding-y 8rem; section classes typically px-6 / py-24 / md:py-32 |
| Effects | Ambient indigo/purple radial glows, blurred shapes, hairline dividers, gradient clipped text; no grid/noise overlay enabled |

Important nuance: the root default font is Playfair/Georgia, but the actual hero/section headings explicitly use DM Sans and the actual interface uses Inter. Do not interpret this as a serif-led template. Generic design-system button variables differ from the actual visible section styles; prioritize the concrete element styles above.

## Page composition

1. Absolute top navigation: Powerly wordmark left, four small desktop navigation buttons centered/right, glass pill Sign Up at right. Main nav links are hidden below md (no visible mobile menu was identified in static HTML).
2. Full-screen hero with a decorative autoplay/muted/looping background video at 0.7 opacity, dark blurred central overlay, giant centered two-word “Power AI” headline (the AI span is gradient), brief talent-acquisition description, then glass Schedule a Consult pill. A fading-edge logo marquee runs beneath.
3. Comparison section: small Compare label, centered two-line heading with gradient emphasis, short explanatory text, large 480px-capped rounded before/after comparison panel with divider. Contrast between noisy stripe texture and purple/gold glows.
4. Capability section: centered title, gradient circular core with six translucent satellite cards connected by SVG on desktop. Below md, this becomes a normal one/two-column card grid rather than a compressed orbital diagram.
5. Four large gradient-number metrics in a dark translucent gradient-backed horizontal band (two columns mobile, four desktop).
6. Testimonial section: centered heading, brand logo tile grid, then two large translucent quote cards.
7. Pricing: centered title, compact pill billing toggle, two side-by-side dark cards; recommended card has a gradient outline, gradient badge and gradient CTA. Stacks to one column on mobile.
8. **Referenced #cta**: big rounded 28px indigo/violet/gold gradient banner, subtle white radial highlight at top-right. Dark headline and supporting copy left, black primary pill and dark-outline secondary pill right. Actual layout is `grid-cols-1` with gap 8, desktop `grid-cols-[minmax(0,1.4fr)_auto]` with gap 16. Banner padding 2.5rem mobile / 4rem desktop. CTA headline is `clamp(2.25rem,5vw,3.75rem)`, weight 500, line-height 1.0, tracking -0.03em.
9. Dark footer with brand summary and four link columns, hairline separator, copyright and social text links.

## Translation to LAUNCHPAD (design recommendation, not source facts)

- Carry the near-black navy canvas, warm-white type, violet/indigo/gold gradient, translucent cards and large lightweight sans-serif headlines into the existing app, preserving functional controls and actual creator/course content.
- Put the strongest template match in Home: an oversized “Create / Launch” or comparable product-relevant headline, concise creator value proposition, primary course-building action, and a real course preview/workflow panel. Keep title scale capped for the functional app viewport.
- Reuse the #cta banner composition for a genuine next-step course/storefront action; retain existing navigation and data actions. Do not insert fake sign-up, consult, sales links or billing behavior.
- Adapt core/capability cards into real course creation, storefront, offers, and learner workflow entry points; use dashboard actual state instead of invented platform metrics or testimonials.
- On workshop/forms/learner screens, use restrained dark surfaces and generous controls rather than oversized marketing typography everywhere. Inherit focus, contrast, labels, minimum target sizes and reduced-motion support.
- Avoid importing the remote hero video/font files or copying assets unless licensing and need are established. A local CSS ambient glow and existing licensed/system sans-serif provide a dependency-free rendition of the visual language.
- Do not copy talent-acquisition claims, invented brands, ROI metrics, pricing, testimonials, text, or logos. User requested template styling for their product, not a hiring-company clone.

## Uncertainty / next verification

This is a strong source-code-derived visual brief, not a visual QA pass. A permitted browser renderer should verify actual desktop/mobile appearance, clipping, keyboard flow and contrast after implementation. Screenshots must be captured from the actual implemented app; none were produced in this research task.

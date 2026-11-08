# VENTRA Liquid Glass — build spec for the app

**Scope:** the VENTRA app (what gym owners log into). Not the marketing website at aiventra.com.au, which keeps its own look.
**Approved reference:** `reference/kit-approved.png` (left = built with this library, right = Dylan's reference image). Every screen must look like the left half. `reference/home-approved.png` is the Home screen in light and dark.
**Source files:** `ventra-ui/tokens.css`, `ventra-ui/glass.css`, `ventra-ui/components.js` (React 18 components on `window.VentraGlass`; port to TSX when wiring into Next, keeping the class names), `ventra-ui/components.d.ts`, `ventra-ui/tokens.json`.
**Live library + guide:** design system https://claude.ai/artifact/1BSxDcrQ9HNoTR2XdUsskY · UI guide canvas https://claude.ai/artifact/2sik8p22KKEJfZ9W8jK6J4

## How to use this file

Before building or restyling any app screen:
1. Open `reference/kit-approved.png` and keep it visible.
2. Compose the screen from the components below. Do not invent new surfaces, colours or shadows: every value is a token in `tokens.css`.
3. Check the screen against "Must / never" and the per-component rules.
4. Render it at 390px (phone) and 1440px, light and dark, and compare with the reference before committing.

## The look in one paragraph

A photographed sheet of clear glass lying on a softly lit wall. Light comes from the top-left, so every shadow falls down and to the right in warm mauve. Cards are clear slabs that float above the sheet: you can see the wall and the bokeh lights through them, their edges catch a bright rim and a bevel, and a lighter band under the bottom edge shows their thickness. Buttons, fields, chips and tiles are milky, puffy glass beads. The one primary action is a glossy violet liquid pill; the secondary is aqua. Numbers are big, bold and tabular. The screen stays quiet because the AI does the busy work.

## Anatomy of a screen (phone first)

```
<div class="vg-stage vg-col">              <!-- the lit wall: warm top-left, slate top-right, bokeh lower right -->
  <AppFrame>                               <!-- ONE clear glass sheet with a visible slab edge (vg-frame vg-glass vg-sheet) -->
    <TopBar unread={n} />                  <!-- wordmark left, bell + account round beads right -->
    <StatCard … /> <StatCard … /> …        <!-- floating glass cards, 12–14px apart -->
    <AnalyticsCard … />
    <BottomNav active="home" />            <!-- Home · Leads · AI Team · Bookings · More; fixed to the bottom with safe-area inset -->
  </AppFrame>
</div>
```
Desktop (≥1024px): the bottom nav becomes a left glass sidebar with the same five items; cards flow into a two-column grid; card padding 24px.

## Surfaces (only these four)

| Surface | Class / component | Use for | Recipe |
| --- | --- | --- | --- |
| Lit wall | `.vg-stage` | The page background, always | Three gradients (`ground-glow-warm`, `ground-glow-cool`, `ground`) + light sweep (`::before`) + bokeh (`::after`). Never a photo or flat colour. |
| Sheet | `AppFrame` = `.vg-frame.vg-glass.vg-sheet` | The one frame around the screen | `glass`→`glass-2`, blur 18px, bright top rim, slab edge band under the bottom edge, long shadow. |
| Floating card | `GlassCard` / `StatCard` / `AnalyticsCard` = `.vg-card.vg-glass` | Every block of content | `glass-card`→`glass-card-2`, blur 10px, rim (`::before`), 9px bevel edge ring + specular streak (`::after`), `shadow-float`. Never nest a card inside a card. |
| Bead | `.vg-bead` (buttons, fields, chips, tiles, round buttons, knobs, selected tab) | Anything small you press or type in | `glass-strong`→`glass-strong-2`, blur 12px, white top highlight, darker underside, `shadow-raised`. |

Liquid fills (primary/secondary button, active nav pill, toggle on, checkbox on): vertical gradient `violet-fill`→`violet-fill-2` or `teal-fill`→`teal-fill-2`, glossy top-half sheen, white rim, deep inner bottom, coloured glow (`shadow-violet` / `shadow-teal`), label white semibold with text-shadow.

Optional on Chromium: `VentraGlass.enableRefraction({ scale: 18 })` adds true edge refraction to floating cards. Safari/Firefox ignore it (they keep the CSS bevel). Never required for the look.

## Components and when to use them

| Component | Use | Rules |
| --- | --- | --- |
| `Wordmark` | Top bar, sign-in | V mark in the violet gradient + VENTRA tracked 0.12–0.2em. Never recolour. |
| `GlassButton variant="primary"` | THE action of the screen | At most one per screen. Verb first, sentence case. Min height 48px (52 default). |
| `GlassButton variant="secondary"` | A second positive action | Aqua. Same rules. |
| `GlassButton` (glass) | Everything else | Milky bead. |
| `GlassButton variant="ghost"` | Low-priority links ("View all") | Hairline only. |
| `IconButton` | Bell, account, "…" menus (sm), violet "+" beside search | `label` required (accessible name). `dot` for unread. |
| `Chip` | Selected value / quick filter (workspace name, category) | Not for status (that's Badge), not for view switching (Tabs). |
| `StatCard` | One number + label | Icon tile tone fixed by meaning (below). `control` = period `SelectPill`; `badge` = status. "—" + caption when no data. |
| `AnalyticsCard` | Trend + up to 3 metrics | `points` oldest→newest. Note "Sample data" unless real. |
| `PromoCard` | One featured next step per screen | Peach→lilac→blue aurora. Never for data; never on every screen. |
| `IconTile` | Card identity | violet = bookings · teal = conversations · magenta = AI Receptionist/calls · indigo = analytics. |
| `Badge` | Status | violet+sparkle "In progress" · success ↑ · warning "Needs reply" · danger ↓ · neutral "Draft". Always a word or icon, never colour alone. |
| `SearchField` | Search | Placeholder says what can be found. Optional violet `action`. |
| `TextField` | Inputs | Label above, hint below; `state="invalid"` turns the edge red and the hint into the fix. |
| `SelectPill` | Period / sort | Native select inside. |
| `SegmentedTabs` | 2–4 views of one list | Not page navigation. |
| `Toggle` | Immediate settings | Confirm step for anything that sends real messages or charges money. |
| `Checkbox` | Multi-select / checklists | |
| `TopBar`, `BottomNav`, `AppFrame` | Screen chrome | One each per screen. |

## Must / never

- Text sits on glass (card or bead), never straight on the wall, except the page `h1`.
- One violet primary per screen. Liquid fills never for delete or payment (use a glass button + confirm).
- Colours keep their meaning (tile tones above; signals only for state).
- Real numbers only; otherwise "—" with a caption, or figures labelled "Sample data".
- Shadows are always the mauve `shade`, cast down-right. No grey-black shadows in light mode.
- Everything pressable is a pill. Cards 28px radius, tiles 20px, frame 36px.
- Australian English, sentence case, "you" to the owner, verbs on buttons, no emoji, no exclamation marks.
- Dark mode = `data-theme="dark"` on `<html>`; never hand-pick dark colours.
- Focus ring 2px `focus`, offset 3px, on every interactive element.

## Tokens

### Colour (Pearl = light, Night = dark)
| Token | Pearl | Night | Use |
| --- | --- | --- | --- |
| `--ground` | `#c3b4bb` | `#15121c` | Mid tone of the lit wall behind every screen (sampled from the reference). Never place text on it directly. |
| `--ground-glow-warm` | `#fdf3ec` | `#3a2535` | Warm light pooling at the top-left of the wall (large, soft). |
| `--ground-glow-cool` | `#66718a` | `#070912` | Dark slate shade on the top-right of the wall. The light comes from the top-left, so shadows fall down-right. |
| `--bokeh-pink` | `#f0a9e0` | `#c05fb0` | Out-of-focus pink light spot behind the glass (lower right). Decorative. |
| `--bokeh-blue` | `#8ec3ea` | `#3f7fb8` | Out-of-focus blue light spot behind the glass. Decorative. |
| `--bokeh-violet` | `#b48ae6` | `#7c4dff` | Out-of-focus lilac light spot behind the glass. Decorative. |
| `--bokeh-teal` | `#7fe0d8` | `#2bb5a6` | Out-of-focus teal light spot behind the glass. Decorative. |
| `--shade` | `rgba(74, 58, 82, 0.42)` | `rgba(0, 0, 0, 0.6)` | Colour of every drop shadow: warm mauve, cast down-right (light from the top-left). |
| `--glass` | `rgba(255, 255, 255, 0.14)` | `rgba(255, 255, 255, 0.06)` | Top-left stop of the big glass sheet and cards: nearly clear, so the lit wall shows through. |
| `--glass-2` | `rgba(255, 255, 255, 0.04)` | `rgba(255, 255, 255, 0.02)` | Bottom-right stop of sheet and card fill. |
| `--glass-card` | `rgba(255, 255, 255, 0.20)` | `rgba(255, 255, 255, 0.10)` | Top-left stop of a floating card: clear glass with a little light caught in it. |
| `--glass-card-2` | `rgba(255, 255, 255, 0.04)` | `rgba(255, 255, 255, 0.03)` | Middle/bottom stop of a floating card (nearly clear). |
| `--glass-edge` | `rgba(255, 255, 255, 0.34)` | `rgba(255, 255, 255, 0.10)` | The thin lighter band just under a floating card: the thickness of its glass. |
| `--glass-strong` | `rgba(255, 251, 251, 0.80)` | `rgba(255, 255, 255, 0.14)` | Milky glass of beads: buttons, fields, chips, tiles, round buttons, selected tab. Slight pink warmth. |
| `--glass-strong-2` | `rgba(250, 243, 246, 0.58)` | `rgba(255, 255, 255, 0.08)` | Lower stop of bead fill, so beads look thicker at the top. |
| `--glass-stroke` | `rgba(255, 255, 255, 0.95)` | `rgba(255, 255, 255, 0.28)` | Bright rim on the lit (top) edge of glass. |
| `--glass-stroke-dim` | `rgba(255, 255, 255, 0.30)` | `rgba(255, 255, 255, 0.06)` | Rim on the sides of glass. |
| `--glass-stroke-tint` | `rgba(226, 200, 255, 0.9)` | `rgba(190, 160, 255, 0.45)` | Lilac light caught on the bottom-right rim. |
| `--hairline` | `rgba(46, 36, 84, 0.16)` | `rgba(255, 255, 255, 0.16)` | Dividers inside cards and the outer edge of fields (meets 3:1 with `line-strong` where it marks a control). |
| `--line-strong` | `#807a99` | `#7d7694` | Control borders that must be seen: toggle track off, checkbox off. 3:1 on `ground` and on glass. |
| `--ink` | `#17141f` | `#f3f0fa` | Headings, numbers and body text on `ground` and every glass surface. |
| `--ink-muted` | `#5b556b` | `#b3acc6` | Labels, captions, inactive nav labels, placeholders on glass and `ground` (≥4.5:1). |
| `--violet` | `#6d32e0` | `#b69cff` | Brand violet as TEXT or icon: links, 'In progress' text, active chart line. On glass, `ground` and `violet-soft`. |
| `--violet-fill` | `#9579f2` | `#9579f2` | Top stop of the primary liquid button (sampled #8d70e7 from the reference). |
| `--violet-fill-2` | `#7257e4` | `#7257e4` | Bottom stop of the primary gradient. |
| `--violet-soft` | `#ece4ff` | `#2a2045` | Tinted chip background behind `violet` text; selected-row tint. |
| `--on-violet` | `#ffffff` | `#ffffff` | Text and icons on `violet-fill` (5.7:1). |
| `--teal` | `#0f7c76` | `#5fd8cc` | Teal as TEXT or icon: secondary actions, conversation icons. |
| `--teal-fill` | `#6cc9cc` | `#6cc9cc` | Top stop of the secondary liquid button (sampled #5ca2b9–#60bdc0). |
| `--teal-fill-2` | `#4fa8bb` | `#4fa8bb` | Bottom stop of the secondary gradient. |
| `--teal-glow` | `#5ed8cb` | `#5ed8cb` | Glow and sheen on teal fills and teal icon tiles only. Never text. |
| `--on-teal` | `#ffffff` | `#ffffff` | Label on the secondary button; always semibold with the soft text shadow. |
| `--magenta` | `#b5179e` | `#f07ae0` | AI Receptionist identity colour: its icon tile glyph and its chart series. Icon/text on glass. |
| `--indigo` | `#3d4fd6` | `#97a4ff` | Analytics identity colour: chart icon glyph, second chart series. |
| `--icon-violet-a` | `#c084fc` | `#d8b4fe` | Icon gradient start, bookings tile. |
| `--icon-violet-b` | `#7c3aed` | `#a78bfa` | Icon gradient end, bookings tile. |
| `--icon-teal-a` | `#38d6f0` | `#67e8f9` | Icon gradient start, conversations tile. |
| `--icon-teal-b` | `#14a3b8` | `#2dd4bf` | Icon gradient end, conversations tile. |
| `--icon-magenta-a` | `#f472b6` | `#f9a8d4` | Icon gradient start, AI Receptionist tile. |
| `--icon-magenta-b` | `#c026d3` | `#e879f9` | Icon gradient end, AI Receptionist tile. |
| `--icon-indigo-a` | `#60a5fa` | `#93c5fd` | Icon gradient start, analytics tile. |
| `--icon-indigo-b` | `#7c3aed` | `#a78bfa` | Icon gradient end, analytics tile. |
| `--aurora-peach` | `#fdb9b6` | `#5b2a3c` | Promo card light, top-left (sampled). |
| `--aurora-lilac` | `#b08bd6` | `#3f2a63` | Promo card light, middle (sampled). |
| `--aurora-blue` | `#b9d4ea` | `#22305e` | Promo card light, bottom-right (sampled). |
| `--cyan-wash` | `#a8c6cb` | `#1e3a40` | Top of the cyan feature card from the kit (gradient to glass). |
| `--success` | `#17733a` | `#7fe0a0` | Positive change text and check marks, on `success-soft` or glass. Always with an up arrow or word. |
| `--success-soft` | `#dcf2e2` | `#163423` | Background of positive trend chips. |
| `--warning` | `#8a4b00` | `#ffc46b` | Needs-attention text, on `warning-soft` or glass. Always with an icon or word. |
| `--warning-soft` | `#fff0d6` | `#3a2a10` | Background of needs-attention chips. |
| `--danger` | `#b42318` | `#ff9a8f` | Errors, failed sends, negative change; on `danger-soft` or glass. Always with an icon or word. |
| `--danger-soft` | `#fde2df` | `#3d1714` | Background of error chips and field error tints. |
| `--focus` | `#5b21d6` | `#c9b6ff` | 2px focus ring on every interactive element, offset 2px. ≥3:1 on `ground` and glass in both themes. |

### Shadows
- `--shadow-glass`: The big sheet and cards: bright top rim, long soft mauve shadow cast down-right.
- `--shadow-raised`: Beads (buttons, fields, chips, tiles, round buttons, knob): puffy top highlight, darker underside, shadow cast down-right.
- `--shadow-violet`: Primary liquid button and active nav pill: sheen, deep bottom, violet glow cast down-right.
- `--shadow-teal`: Secondary liquid button.
- `--shadow-float`: Floating cards: bright top rim, glass edge band and its underside line, a long shadow cast down-right with a darker core so the card sits well above the sheet.

### Type (class · size/line · weight)
| Class | Spec | Use |
| --- | --- | --- |
| `.number-xl` | 46px/50px · 700 · -0.02em | The big figure on a StatCard. Tabular numerals. |
| `.number-lg` | 30px/34px · 700 · -0.01em | Metric values in an AnalyticsCard row. |
| `.wordmark` | 22px/24px · 700 · 0.2em | The VENTRA wordmark only. Always uppercase. |
| `.h1` | 28px/34px · 700 · -0.01em | One per screen: the page title. |
| `.h2` | 21px/28px · 700 | Section titles and large card titles. |
| `.title` | 18px/24px · 600 | StatCard label, list-row title, dialog title. |
| `.body` | 15px/22px · 400 | Default running text. |
| `.body-strong` | 15px/22px · 600 | Button labels, emphasised inline text. |
| `.label` | 13px/18px · 500 | Metric labels, nav labels, field labels. |
| `.caption` | 12px/16px · 500 | Timestamps, helper text, chart axis. |
| `.overline` | 11px/14px · 700 · 0.12em | Eyebrows above a hero title. Uppercase. |

Font stack `--font-sans`: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, "Segoe UI", sans-serif`

### Spacing, radius, blur
- `--space-1` = 4px: Icon-to-label gap inside chips.
- `--space-2` = 8px: Gap between related controls; chip padding block.
- `--space-3` = 12px: Gap between stacked cards on phones; nav item padding.
- `--space-4` = 16px: Page side gutter on phones; field inner padding.
- `--space-5` = 20px: Card inner padding on phones.
- `--space-6` = 24px: Card inner padding on desktop; gap between card groups.
- `--space-8` = 32px: Section spacing.
- `--radius-sm` = 12px: Chart plot area, small tiles.
- `--radius-md` = 20px: Icon tiles (56px).
- `--radius-lg` = 28px: Cards.
- `--radius-xl` = 36px: The outer app frame and bottom nav bar.
- `--radius-pill` = 999px: Buttons, fields, chips, toggles, tabs, round icon buttons.
- `--blur-glass` = 18px: backdrop-filter blur for the sheet and cards (with saturate 150%).
- `--blur-raised` = 12px: backdrop-filter blur for beads.
- `--blur-card` = 10px: backdrop-filter blur for floating cards: lower than the sheet so the wall shows through clearly.

## Wiring into the Next app (when applying)

1. Copy `ventra-ui/tokens.css` and `ventra-ui/glass.css` to `apps/web/app/design-system/liquid-glass/` and import them once in the app shell after the existing `tokens.css`. The app's older `--v-*` tokens stay until each screen is ported.
2. Port components from `ventra-ui/components.js` to TSX one by one, keeping the `vg-*` class names so the CSS applies unchanged.
3. Wrap each ported screen in `.vg-stage` → `AppFrame`. Port Home first, then the front-office screens.
4. Do not touch `app/site/**` (the marketing website).

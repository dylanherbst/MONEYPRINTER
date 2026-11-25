# InsertAgentic website migration plan

Updated 24 November 2026.

## Goal
Run InsertAgentic's public site as its own repository and Vercel project, with the same look, motion and logo as aimoneyprinter.com, and copy rewritten for "your AI growth team" for existing small businesses. aimoneyprinter.com is not changed until the owner approves the cutover.

## Source
- Repository `MONEYPRINTER`, branch `website/public-site`, commit `6b022c6`, folder `apps/web`. This is what aimoneyprinter.com serves.
- Copied only what the public site uses: the cells home page and scene, the header, How it works, FAQs, About us, the sign-up page, fonts, brand images, icons, robots and manifest.
- Not copied: the rest of the monorepo (signed-in app, VENTRA routes, Supabase, Stripe, agents).

## Stages
| # | Stage | State |
|---|---|---|
| 1 | Baseline copy committed (`c0b0f4f`); build, lint and typecheck pass; Next 16.4.6, 0 audit findings | Done |
| 2 | Visual check of baseline against live (≤0.18% pixel difference, only moving cells) | Done |
| 3 | InsertAgentic copy, CTAs, SEO, legal and brand sweep | Done (this commit) |
| 4 | Private GitHub repo `INSERTAGENTIC-WEBSITE` and push | Needs owner: create the repo |
| 5 | New Vercel project, preview deployment, env values | Needs owner: approve project and values |
| 6 | Domain and DNS | Needs owner: choose and approve |
| 7 | Cutover: production deploy, then decide what aimoneyprinter.com does | Needs owner approval |

## Rules kept
- No invented company details, prices, testimonials or results. Legal entity, ABN and email come from env and show as "[to be added]" until set.
- Only verified features are advertised. The AI Receptionist and the "Never miss an opportunity" path are labelled "In development".
- Until an app URL exists, CTAs say "Join the early access list".

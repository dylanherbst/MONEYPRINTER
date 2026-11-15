# AiMoneyPrinter: keys, agents and test versions (16 Nov 2026)

One place for what has to be connected before final testing. No key values belong in this file or anywhere in the repository. The owner enters them in the Vercel project (`moneyprinter-web`), under environment variables.

## Keys by provider

| Provider | Environment variables (names only) | Unlocks | State |
| --- | --- | --- | --- |
| AI model | `ANTHROPIC_API_KEY` (the code's current expectation; changes if the owner picks OpenAI) | Idea research, brand, product writing, shop content, marketing drafts | Not set. Provider not decided. |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Sign-up and sign-in, the database, private file storage | Not set in Vercel |
| Stripe | `STRIPE_SECRET_KEY` (test key first), `STRIPE_WEBHOOK_SECRET` | Seller payment setup, checkout, verified orders, later subscription billing | Not set. Webhook address: `/api/aimp/webhooks/payments` |
| Resend | `RESEND_API_KEY` | Delivery emails to buyers, notices to owners | Not set |
| Pinterest | `PINTEREST_ACCESS_TOKEN` | Scheduled pins | Not set; developer app not created |
| Vercel domains | `VERCEL_API_TOKEN` | Custom domains for customers' shops (later) | Not set |

## Switches (not secrets)

| Variable | Meaning |
| --- | --- |
| `AIMP_TOOLS_ENABLED=1` | Lets the guided setup run on demo storage, shows the "Demo dashboard" shortcut and opens the `/tools` test pages. Set it for Preview only, never for Production. |
| `AIMP_STORE_ROOT_DOMAIN` | The domain customers' shops live under (each shop is a subdomain of it). |
| `LAUNCHPAD_APP_ORIGIN` | The site's own address, used in sitemaps and links. |
| `AIMP_FIXTURES_ALLOWED` | Default on: a provider with no key uses labelled demo data. |
| `AIMP_<PROVIDER>_ENABLED`, `AIMP_<PROVIDER>_LIVE` | Per provider (`LLM`, `PAYMENTS`, `EMAIL`, `STORAGE`, `SOCIAL`, `DOMAINS`). Live is off until the owner opts in; it is never inferred from a key being present. |

## Branches and addresses

| Branch | What it is | Where it shows |
| --- | --- | --- |
| `website/public-site` | The live site. Every push deploys to production. | aimoneyprinter.com |
| `test/final` | Final-test version: the mobile-launch app flow (milestone 1) merged with the live site. | Vercel preview for the branch |
| `ui/test-v2` | A copy of the live site for trying a different UI. | Vercel preview for the branch |
| `aimp/mobile-launch-m1`, `aimp/release` | The app rework before it was merged into `test/final`. | Not deployed |

## Agents (`.claude/agents/`)

| Agent | Owns |
| --- | --- |
| `aimp-research` | Specs and acceptance criteria (read-only) |
| `aimp-backend` | Database, API routes, provider adapters, job engine |
| `aimp-feature` | Feature logic: opportunity finder, product factory, catalogue, campaigns, automation |
| `aimp-web-design` | Signed-in app screens on the glass UI |
| `aimp-website` | The public website |
| `aimp-marketing` | The marketing engine (design in `docs/aimp/marketing-agents/DESIGN.md`) |
| `aimp-setup` | Connections and setup steps |
| `aimp-qa` | Independent testing (read-only) |
| `aimp-devops` | Build health and release reviews (read-only; never deploys) |

## Plans

- Feature-by-feature workflows and build order: https://claude.ai/artifact/FZbbELDUfEuFbqd57Pzm7V
- Launch ad campaigns: https://claude.ai/artifact/D5UJgwBgWvicdwMnwk4S8H

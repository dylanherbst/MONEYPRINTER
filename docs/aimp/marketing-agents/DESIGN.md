# Marketing agent system: design (15 Nov 2026)

Owner request: agents that handle AiMoneyPrinter's own marketing and that customers also use in the app. Robust, easy, automated. Status: DESIGN. Nothing in this file is built unless the "Exists today" column says so.

## One system, two users

There is one marketing engine. AiMoneyPrinter's own marketing runs through it as the first business ("tenant zero"), on the same code, approvals and limits a customer gets. We find the problems before customers do, and nothing is built twice.

## The team

Six roles. Each is a job on the existing runner (`lib/aimp/jobs`) with fixed inputs and outputs, not a free-roaming agent. That is what makes it robust: every step is saved, retried safely and can be inspected.

| Role | Job kind | Does | Reads | Writes | Exists today |
| --- | --- | --- | --- | --- | --- |
| Strategist | `marketing-plan` | Turns the business facts into a 30-day plan: channels, themes, how often | Brand kit, products, audience, first-buyer channel, owner's hours | Campaign plan | Yes: `campaigns/generate.ts` builds the plan by rule |
| Writer | `marketing-draft` | Writes each post: hook, angle, description, call to action | Plan, brand voice, product facts | Draft items | Partly: model copy fields and prompt exist; no live AI |
| Designer | `marketing-assets` | Makes the image or pin for each post from product covers and brand colours | Product covers, brand kit | Image files | Partly: `campaign-assets` renders from covers |
| Checker | `marketing-check` | Blocks income promises, wrong prices, phone numbers, platform length limits, off-brand voice | Draft, listing price, claim rules | Pass, or a plain-English reason | Yes for claims and prices: `campaigns/claims.ts`, `validate.ts` |
| Publisher | `scheduled-post` | Posts approved items at their time, once | Approved item, connection | Post id and link | Stub: queues only, no live Pinterest |
| Analyst | `marketing-report` | Pulls real numbers weekly, ties clicks and sales to posts, proposes next week's plan | Platform stats, tagged links, orders | Report and proposed changes | No; tagged links exist in `campaigns/links.ts` |

Later roles on the same pattern: Inbox (replies and DMs, draft-review first) and Ads (paid campaigns, always approval and a spend cap).

## How a week runs

1. Sunday night: Analyst reads last week's numbers and proposes changes.
2. Strategist updates the plan. Writer and Designer produce the week's posts.
3. Checker tests every post. A failed post is rewritten once, then dropped with a reason.
4. Monday morning: the owner gets one card, "Marketing this week", with the posts in order. Approve all, edit one, or skip one. Two taps for a normal week.
5. Publisher posts each approved item at its time.
6. Anything that fails shows on the same card in plain English with one action to fix it.

## Automation levels (per channel, owner's choice)

- **Ask me first** (default): nothing posts without approval.
- **Autopilot**: posts that pass the Checker go out without asking. Available only after the owner has approved a set number of weeks, and limited by a daily post cap.
- **Paused**: nothing is drafted or posted.

Safety rails that always apply: the Checker cannot be turned off; a platform rejection or a spike in failures pauses that channel and tells the owner; one switch stops all marketing for a business; paid spend is never automatic.

## What makes it robust

- Fallback copy: if the AI step fails or returns the wrong shape, the rule-based copy that already exists is used, so a week is never empty.
- Once-only actions: a post cannot go out twice, even after a crash or retry.
- Connection health: tokens are checked before the week is drafted, not at posting time.
- Per-platform validators: length, image size and link rules are code, not left to the model.
- Dry run: every channel can run a full week without posting, for testing and for demos.
- Full history: who or what drafted, checked, approved and posted each item.

## Channels and the posting API

One `SocialAdapter` interface per channel: connect, check connection, publish, fetch stats. Pinterest first (the plan's first channel), then Instagram and Facebook, then TikTok.

Open decision: build each platform's API directly, or use an aggregator that posts to many platforms through one API (Ayrshare was looked at in the 12 Nov provider research). Direct is cheaper per customer and slower to build, and each platform needs its own app review. An aggregator is faster and adds a per-profile cost.

## Build order

1. Real AI adapter (shared with every other workflow).
2. Wrap the existing campaigns module in the `marketing-plan`, `marketing-draft` and `marketing-check` job kinds.
3. The weekly approval card and activity log.
4. Pinterest publisher, live.
5. Tenant zero: run AiMoneyPrinter's own organic marketing through it.
6. Analyst and weekly report.
7. More channels through the adapter; then Inbox; then Ads.

## Not decided

- AI provider (blocks steps 1 and 2).
- Direct platform APIs or an aggregator.
- How many approved weeks unlock Autopilot, and the daily post cap.
- Whether AiMoneyPrinter's own paid ads run through this engine or stay with outside ad tools for now.

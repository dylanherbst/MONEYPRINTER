# Deployment runbook

Nothing here has been run. Every step marked "owner" needs the owner's approval.

## Local
```
npm ci
npm run lint && npx tsc --noEmit && npm run build
npx next start -p 3070      # http://127.0.0.1:3070
```

## 1. Repository (owner)
Create a private GitHub repo `INSERTAGENTIC-WEBSITE`. Then: `git remote add origin <url>` and `git push -u origin main`.

## 2. Vercel project (owner)
- Create a new project from the repo: framework Next.js, root `/`, Node 24.
- Do not reuse `moneyprinter-web`.
- Set the env values from `.env.example` for Preview and Production. Leave unknown values blank.
- The first deployment is a Preview. Check it against LAUNCH_CHECKLIST.md.

## 3. Domain (owner)
Add the chosen domain in Vercel, update DNS at the registrar, and set `NEXT_PUBLIC_SITE_DOMAIN`. Indexing turns on only for production deployments with a domain set.

## 4. Production (owner)
Promote the checked preview to production. Re-run the checklist on the live domain.

## 5. aimoneyprinter.com (owner, separate decision)
Leave unchanged, redirect to the new domain, or make private. This changes the `moneyprinter-web` project, so it is not done here.

## Rollback
In Vercel, use "Instant Rollback" to the previous production deployment. DNS changes are reversed at the registrar.

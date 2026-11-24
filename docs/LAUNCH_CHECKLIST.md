# Launch checklist

## Owner inputs
- [ ] Domain chosen and bought
- [ ] App URL (live growth app) or early-access form URL
- [ ] Contact email
- [ ] Legal entity name and ABN
- [ ] Policies reviewed by an Australian lawyer
- [ ] Private GitHub repo created
- [ ] Vercel project approved

## Before production (on the preview URL)
- [ ] Lint, typecheck and build pass
- [ ] Home scroll: all 7 chapters, logo forms, no pauses (mobile and desktop)
- [ ] Header links: Home, How it works, FAQs, About us; Sign in only if the app URL is set
- [ ] Every CTA goes to the app's `/start/existing`, or to early access, never to a dead link
- [ ] /policies shows the real entity, ABN and email (no "[to be added]")
- [ ] Receptionist still labelled "In development" unless verified live
- [ ] No AiMoneyPrinter wording anywhere
- [ ] Preview is noindex (`robots.txt` disallows)

## After production
- [ ] `robots.txt` allows and lists the sitemap
- [ ] `sitemap.xml` uses the real domain
- [ ] Canonical and Open Graph URLs use the real domain
- [ ] Favicon, app icon and share preview look right
- [ ] Decision made and recorded for aimoneyprinter.com

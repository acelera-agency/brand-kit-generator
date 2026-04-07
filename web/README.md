# brand-kit-generator / web

Landing page for the hosted version of the brand kit generator.
Next.js 15 + Tailwind CSS, App Router, TypeScript.

## Develop

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

## Deploy on Vercel

- Root Directory: `web`
- Build Command: `next build`
- Output Directory: `.next`
- Framework Preset: Next.js
- Domain: TBD (`brandkitgenerator.com` or `brandkit.acelera.agency`)

## Before launch

The waitlist form (`app/api/waitlist/route.ts`) currently logs submissions
to the server console only. Wire it up to a real email/CRM service before
the landing actually goes live. Recommended:

- **Resend** + a `RESEND_API_KEY` env var, send to a notify-list address
- **Loops.so** for waitlist management with automated welcome emails
- **Notion DB** via the official integration if you want manual triage

The TODO is in `app/api/waitlist/route.ts`.

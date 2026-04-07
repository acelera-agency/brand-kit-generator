# Polish & Launch Landing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Take `brand-kit-generator/web/` from "first draft committed" to
"live at https://brandkit.acelera.agency with a real waitlist that emails
the founder via Resend".

**Architecture:** Three sequential phases — (1) iterate copy + visual on the
existing Next.js landing section by section, (2) replace the placeholder
waitlist API route with a Resend integration, (3) deploy on Vercel with
DNS pointing at the agency subdomain. No SaaS code, no auth, no database
yet — Leg C from the previous plan stays out of scope.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Resend
SDK, Vercel hosting, Cloudflare/DNS provider for `acelera.agency` (TBD —
verify which provider the user controls during Phase 3).

**Reuse:** The existing visual system tokens in `web/tailwind.config.ts`
are 1:1 with `acelera-agency/brand/style-guide/styles.css`. Don't reinvent
them. Any new components must use the same tokens.

---

## Phase 0 — Pre-flight (one task, no code yet)

### Task 0.1: Confirm baseline runs cleanly

**Files:** none (read-only checks)

**Step 1:** Verify dev server is up
Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200`

**Step 2:** Verify build still passes
Run: `cd web && npm run build`
Expected: `✓ Compiled successfully` and 5 static pages generated

**Step 3:** Verify git is clean
Run: `cd brand-kit-generator && git status`
Expected: `nothing to commit, working tree clean`

If any of those fail, fix before starting Phase 1.

---

## Phase 1 — Polish copy + visual (section by section)

**Approach:** Each section of `web/app/page.tsx` is one task. For each task:
propose specific edits → user reviews → apply → reload dev server → commit.
Don't batch sections — small commits make the iteration tighter.

**Reference:** Current page is at `web/app/page.tsx`. Sections in order:
topbar, hero, problem, methodology, calibration, open-source band, hosted
product, pricing teaser, waitlist, FAQ, footer.

### Task 1.1: Hero polish

**Files:**
- Modify: `web/app/page.tsx` lines 99-131 (the `<section>` with eyebrow + h1 + subhead + CTAs)

**Step 1:** Read current hero (page.tsx:99-131)

**Step 2:** Propose 2-3 alternatives for the H1 to the user. Current is:
*"Brand kits that decide for you. Not decorate for you."*
Candidates to test:
- A) *"Brand kits that decide. Not decorate."* (tighter, 5 words)
- B) *"A brand kit that refuses your bad ideas."* (sharper, names the
  pushback as a feature)
- C) *"Stop shipping brand kits nobody opens."* (problem-first, less self-praise)

**Step 3:** User picks one (or proposes a fourth). Edit the file.

**Step 4:** Same drill for the eyebrow. Current: `BRAND KIT GENERATOR · COMING SOON`.
Candidates: `OPEN SOURCE · COMING SOON`, `BY ACELERA · COMING SOON`,
`ANTI-GENERIC SINCE DAY ONE`.

**Step 5:** Same for the subhead — currently 3 sentences, could go to 2.

**Step 6:** Reload `http://localhost:3000/` in browser, eyeball it.

**Step 7:** Commit
```bash
cd brand-kit-generator
git add web/app/page.tsx
git commit -m "polish(landing): tighter hero copy"
```

### Task 1.2: Problem section polish

**Files:**
- Modify: `web/app/page.tsx` lines 133-156

**Step 1:** Read current problem section.

**Step 2:** Propose to the user:
- The first paragraph (the "decoration" claim) is the strongest line. Keep.
- The second paragraph is 4 sentences and feels long. Trim to 2.
- The third paragraph (the contrast: "this generator produces the
  opposite") could be shortened or merged with the second.

**Step 3:** Apply edits.

**Step 4:** Reload + eyeball.

**Step 5:** Commit
```bash
git add web/app/page.tsx
git commit -m "polish(landing): trim problem section to land harder"
```

### Task 1.3: Methodology grid — visual fix (4-col → 2-col)

**Files:**
- Modify: `web/app/page.tsx` line 175 (the `<div>` with `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)

**Step 1:** The current 4-column grid on desktop makes each card narrow
and dense. Change to 2-column on desktop (4 rows of 2 cards) for breathing
room.

**Step 2:** Replace the className:
- From: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-rule border border-rule`
- To: `grid grid-cols-1 md:grid-cols-2 gap-px bg-rule border border-rule`

**Step 3:** Bigger cards now have room for slightly more content. Optionally
add a one-line "example question" per stage from `prompt.md` to make each
card feel concrete instead of abstract. (Skip if it makes the section too
heavy.)

**Step 4:** Reload `/methodology` anchor in browser.

**Step 5:** Commit
```bash
git add web/app/page.tsx
git commit -m "polish(landing): 2-col methodology grid for breathing room"
```

### Task 1.4: Calibration section — strongest section, minimal changes

**Files:**
- Modify: `web/app/page.tsx` lines 218-285 (the calibration section)

**Step 1:** Re-read. This is the strongest section because it shows real
artifacts. Don't break it.

**Step 2:** Optional improvements:
- Each example currently has a small label above. Keep.
- The do/don't pair could be more visually distinct — maybe a 2-column
  layout instead of stacked.
- Consider adding a 4th example: a non-negotiable rule with its reason
  (already in `prompt.md`'s calibration example, easy to copy).

**Step 3:** User picks which improvements to apply. Apply them.

**Step 4:** Reload + eyeball.

**Step 5:** Commit
```bash
git add web/app/page.tsx
git commit -m "polish(landing): tighten calibration section"
```

### Task 1.5: Open-source band — make the dark moment land

**Files:**
- Modify: `web/app/page.tsx` lines 288-326

**Step 1:** This is the only dark section in the page. It should feel like
a deliberate pause, not an afterthought.

**Step 2:** Visual ideas to propose:
- The headline could be larger (currently `clamp(2rem,4vw,3.25rem)`)
- The accent green could appear *somewhere* in this section to break up
  the monochrome (e.g., the GitHub link border, or a small accent dot
  next to the section number)
- The two CTAs at the bottom are decent — keep

**Step 3:** Copy ideas:
- The body paragraph is good but slightly long. Could trim "you can fork
  it, run it manually..." sentence.

**Step 4:** Apply edits, reload.

**Step 5:** Commit
```bash
git add web/app/page.tsx
git commit -m "polish(landing): sharpen the open-source moment"
```

### Task 1.6: Hosted product section — add a characteristic component

**Files:**
- Modify: `web/app/page.tsx` lines 329-405

**Step 1:** Currently a 2x2 grid of feature cards. Functional but flat —
could feel more "Acelera" by reusing one of the characteristic components
from the style guide.

**Step 2:** Two options to propose:
- **A)** Add a "criterion line" component (3-step horizontal with accent
  for active) showing "Interview → Pushback → Delivered kit"
- **B)** Add a "before / after" component comparing "Most brand kit
  generators" vs "This one" with concrete contrasts (e.g., 5 questions
  vs 80, deck vs decision tool, 5min vs 90min)

**Step 3:** User picks A, B, or both. Apply.

**Step 4:** Reload + eyeball.

**Step 5:** Commit
```bash
git add web/app/page.tsx
git commit -m "polish(landing): add characteristic component to hosted section"
```

### Task 1.7: Pricing teaser — flesh out

**Files:**
- Modify: `web/app/page.tsx` lines 408-422

**Step 1:** Currently empty (just one line). Could add a "what you get"
list to build anticipation without committing to a price.

**Step 2:** Propose:
- 3-4 bullet items: "Live interview UI", "Real-time forbidden-words
  detection", "Markdown + PDF + Notion export", "Optional 1:1 with the
  Acelera team"
- Plus the existing "pricing TBD, waitlist gets discount" line

**Step 3:** Apply, reload.

**Step 4:** Commit
```bash
git add web/app/page.tsx
git commit -m "polish(landing): pricing teaser with what-you-get list"
```

### Task 1.8: FAQ — add 2 sharper questions

**Files:**
- Modify: `web/app/page.tsx` lines 67-90 (the `FAQ` constant)

**Step 1:** Current FAQ has 5 questions. Decent. Two more sharp ones to
consider:
- *"What if I run the prompt and the generator refuses my answers?"*
  → "That's the point. The pushback rules exist because vague answers
  produce decoration. Sharpen the answer or change the question."
- *"Is the open-source prompt the same as what the SaaS will run?"*
  → "Yes. The SaaS adds the UI, the multi-stage flow, the export, and the
  database — but the methodology is the prompt, and the prompt is open."

**Step 2:** Add to the FAQ array.

**Step 3:** Reload + eyeball.

**Step 4:** Commit
```bash
git add web/app/page.tsx
git commit -m "polish(landing): two sharper FAQ entries"
```

### Task 1.9: Footer + topbar polish

**Files:**
- Modify: `web/app/page.tsx` topbar lines 84-105 + footer lines 510-540

**Step 1:** Topbar is fine. Optional: add a `← acelera.agency` link on
the left as the brand attribution.

**Step 2:** Footer: optionally add the version badge (`v0`), last commit
short SHA, or a "Star on GitHub" mini button.

**Step 3:** Apply minimal edits.

**Step 4:** Commit
```bash
git add web/app/page.tsx
git commit -m "polish(landing): topbar/footer micro-fixes"
```

---

## Phase 2 — Wire waitlist to Resend

### Task 2.1: Install Resend SDK

**Files:**
- Modify: `web/package.json`

**Step 1:** Install the package
Run: `cd web && npm install resend`
Expected: `+ resend@<version>` and updated lockfile

**Step 2:** Verify build still passes
Run: `npm run build`
Expected: `✓ Compiled successfully`

**Step 3:** Commit
```bash
cd brand-kit-generator
git add web/package.json web/package-lock.json
git commit -m "deps: add resend sdk for waitlist"
```

### Task 2.2: Create env var setup

**Files:**
- Create: `web/.env.local.example`
- Modify: `web/.gitignore` (verify `.env*.local` is excluded — it already is)

**Step 1:** Create the example file
```bash
# .env.local.example
# Copy to .env.local and fill in real values.
# Get a Resend API key at https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email address that receives waitlist notifications.
WAITLIST_NOTIFY_TO=hello@acelera.agency
```

**Step 2:** Commit
```bash
git add web/.env.local.example
git commit -m "feat(waitlist): add env var template"
```

### Task 2.3: Update the API route to use Resend

**Files:**
- Modify: `web/app/api/waitlist/route.ts`

**Step 1:** Read the current placeholder route handler.

**Step 2:** Replace with Resend integration:

```ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_TO = process.env.WAITLIST_NOTIFY_TO || "hello@acelera.agency";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email).trim().toLowerCase()
      : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  if (!process.env.RESEND_API_KEY) {
    // Local development without an API key — log and succeed so the form
    // is still testable end-to-end.
    console.log(`[waitlist] (no RESEND_API_KEY) signup: ${email}`);
    return NextResponse.json({ ok: true });
  }

  try {
    await resend.emails.send({
      from: "Brand Kit Generator <onboarding@resend.dev>",
      to: NOTIFY_TO,
      subject: `New waitlist signup: ${email}`,
      text: `${email} joined the brand-kit-generator waitlist.`,
    });
  } catch (err) {
    console.error("[waitlist] resend error:", err);
    return NextResponse.json(
      { error: "Could not record signup. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
```

**Step 3:** Note for production: the `from:` address uses Resend's default
`onboarding@resend.dev` to avoid needing domain verification on day one.
Once `brandkit.acelera.agency` is verified in Resend (Phase 3), swap to
`waitlist@brandkit.acelera.agency`.

**Step 4:** Verify build passes
Run: `cd web && npm run build`
Expected: `✓ Compiled successfully`

**Step 5:** Test locally without an API key (should still log + return 200)
Run: `curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com"}' http://localhost:3000/api/waitlist`
Expected: `{"ok":true}` and a console log line

**Step 6:** Test with invalid email
Run: `curl -s -X POST -H "Content-Type: application/json" -d '{"email":"not-an-email"}' http://localhost:3000/api/waitlist`
Expected: `{"error":"Please provide a valid email address."}`

**Step 7:** Commit
```bash
git add web/app/api/waitlist/route.ts
git commit -m "feat(waitlist): wire api route to resend with safe local fallback"
```

### Task 2.4: Test with a real Resend API key (user has to provide one)

**Files:** none — this is a runtime test

**Step 1:** User signs up at https://resend.com (free tier)
**Step 2:** User creates an API key in the Resend dashboard
**Step 3:** User creates `web/.env.local` from `.env.local.example` and
fills in the real `RESEND_API_KEY` and `WAITLIST_NOTIFY_TO`
**Step 4:** Restart dev server: `cd web && npm run dev`
**Step 5:** Submit a real test signup via the form on `http://localhost:3000`
**Step 6:** Verify the email arrives at `WAITLIST_NOTIFY_TO`
**Step 7:** No commit (this is a runtime test)

---

## Phase 3 — Deploy on Vercel + DNS

### Task 3.1: Connect Vercel to the GitHub repo

**Files:** none — Vercel UI work

**Step 1:** User goes to https://vercel.com/new and imports
`acelera-agency/brand-kit-generator`
**Step 2:** Configure project:
- Framework Preset: **Next.js** (auto-detected)
- Root Directory: `web`
- Build Command: `next build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)
**Step 3:** Add environment variables:
- `RESEND_API_KEY` = (paste from Resend dashboard)
- `WAITLIST_NOTIFY_TO` = `hello@acelera.agency` (or whichever inbox)
**Step 4:** Click Deploy.
**Step 5:** Wait for first build to complete (~2-3 min). Verify the
preview URL works (`brand-kit-generator-acelera.vercel.app` or similar).

### Task 3.2: First-deploy smoke test

**Files:** none — runtime test

**Step 1:** Open the Vercel preview URL in a browser.
**Step 2:** Verify the page renders with the brand visual system.
**Step 3:** Submit a real waitlist signup with your own email.
**Step 4:** Verify a notification email arrives at `WAITLIST_NOTIFY_TO`.
**Step 5:** Open Vercel's Function Logs and confirm the route handler
ran without errors.

If anything fails here, fix it before adding the custom domain.

### Task 3.3: Add `brandkit.acelera.agency` custom domain in Vercel

**Files:** none — Vercel UI

**Step 1:** Go to project Settings → Domains
**Step 2:** Add `brandkit.acelera.agency`
**Step 3:** Vercel will display a CNAME target — write it down (likely
`cname.vercel-dns.com`)

### Task 3.4: Add CNAME record at the DNS provider

**Files:** none — DNS provider UI (Cloudflare, Namecheap, etc.)

**Step 1:** User logs into wherever `acelera.agency` DNS is managed.
**Step 2:** Add a new CNAME record:
- Name/Host: `brandkit`
- Type: `CNAME`
- Value: `cname.vercel-dns.com` (use whatever Vercel actually showed)
- TTL: default (or 3600)
- Proxy/Cloudflare: **OFF** (orange cloud disabled — Vercel handles SSL)
**Step 3:** Save.
**Step 4:** Wait for propagation (5-30 min, sometimes faster).
Run: `nslookup brandkit.acelera.agency`
Expected: returns Vercel's edge IPs

### Task 3.5: Verify SSL + production domain works

**Files:** none — runtime check

**Step 1:** Open `https://brandkit.acelera.agency` in a browser
**Step 2:** Verify the lock icon shows valid SSL (Vercel auto-provisions)
**Step 3:** Verify the page renders correctly
**Step 4:** Submit a real waitlist signup
**Step 5:** Verify the email arrives

### Task 3.6: (Optional) Verify the domain in Resend and switch the from address

**Files:**
- Modify: `web/app/api/waitlist/route.ts` (the `from:` field)

**Step 1:** In Resend, add `brandkit.acelera.agency` as a verified domain
**Step 2:** Resend will show DNS records to add (SPF, DKIM, DMARC)
**Step 3:** User adds those records at the same DNS provider
**Step 4:** Wait for verification in Resend
**Step 5:** Edit `web/app/api/waitlist/route.ts`:
- From: `from: "Brand Kit Generator <onboarding@resend.dev>"`
- To: `from: "Brand Kit Generator <waitlist@brandkit.acelera.agency>"`
**Step 6:** Redeploy (Vercel auto-deploys on push)
**Step 7:** Test with another signup, verify the email comes from the
custom domain
**Step 8:** Commit
```bash
git add web/app/api/waitlist/route.ts
git commit -m "feat(waitlist): use brandkit.acelera.agency as from address"
```

This step is optional for launch — `onboarding@resend.dev` works fine for
notifications. Promote later when convenient.

---

## Verification (end-to-end smoke test after all phases)

1. **Open** `https://brandkit.acelera.agency` in a clean browser tab
2. **Verify** the topbar, hero, problem, methodology, calibration,
   open-source, hosted product, pricing, waitlist, FAQ, footer all render
   in the brand visual system (paper background, ink text, accent green)
3. **Click** "See the methodology" → opens the GitHub repo
4. **Click** the GitHub link in the footer → same
5. **Scroll** to the waitlist form
6. **Submit** a real email address
7. **See** the success state ("You're on the list.")
8. **Check** your `WAITLIST_NOTIFY_TO` inbox — an email should arrive
   from Resend with the new signup
9. **Submit** an invalid email — verify the error message
10. **Open** Vercel function logs — verify no errors

If all 10 pass, the landing is launched. Done.

---

## Critical files modified by this plan

| File | Phase | Action |
|---|---|---|
| `web/app/page.tsx` | 1 | Polish (multiple commits, one per section) |
| `web/package.json` | 2 | Add `resend` dep |
| `web/package-lock.json` | 2 | Auto-update |
| `web/.env.local.example` | 2 | Create |
| `web/app/api/waitlist/route.ts` | 2, 3.6 | Replace placeholder, later swap from address |
| Vercel project settings | 3 | UI work, no code |
| DNS for `acelera.agency` | 3 | UI work, no code |
| Resend dashboard | 2.4, 3.6 | UI work, no code |

---

## Out of scope (do NOT do in this plan)

- The actual SaaS interview UI (Leg C from the previous plan)
- User auth, payments, dashboard
- Multi-page routing (about, blog, pricing detail, etc.)
- Analytics setup (PostHog, Plausible, etc.) — leave for after first signups
- A/B testing infra
- Internationalization
- The Figma capture (still broken, not blocking the launch)
- Renaming the existing `Automation-Agency` repo (separate concern)

If any of these come up during execution, defer to a follow-up plan.

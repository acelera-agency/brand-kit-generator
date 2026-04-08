# Brand Kit Generator SaaS — Minimum Deployed Plan

> **For Claude:** Continuation of `2026-04-08-bkg-saas-phase-a.md` (which has every task spec'd copy-paste-ready). Goal cut to **minimum public deployment on Vercel**. Execute via the `superpowers:executing-plans` skill.

**Branch:** `feat/saas-phase-a` (worktree at `.worktrees/saas-phase-a/`)
**Working tree:** clean, 18 commits ahead of `main`, build green, 40/40 tests passing.
**Goal:** Real user can hit a public Vercel URL → magic-link login → start kit → complete 9-stage chat → download markdown.
**Resume point:** Phase 3, Task 3.1.

## North star — what "minimum deployed" means here

A real user, given the public Vercel URL, can:
1. Land on `/login`, paste their email, get a magic link
2. Click the link, land on `/dashboard`
3. Click "Start a new kit"
4. Be taken to `/interview/<id>` and chat through all **9 stages** (this is the product — no shortcuts)
5. Each stage's gate-check passes, kit JSONB fills up
6. After Stage 8, hit `/kit/<id>` and download `brand-kit.md` with all 9 sections populated

Anything not on that critical path is **out of scope** for this cut.

---

## 1. State of play (verified 2026-04-08)

### Done — Phases 0–2 (committed in 18 commits on `feat/saas-phase-a`)

| Phase | Tasks | Result |
|---|---|---|
| 0 — Scaffolding | 0.1 Next.js 15 app on port 3001 · 0.2 Acelera tokens (tailwind + globals.css + fonts) | `web-app/` builds, dev server boots |
| 1 — Domain model | 1.1 BrandKit type · 1.2 9 stage Zod schemas + combined `BrandKitSchema` · 1.3 markdown exporter | 40 Vitest tests passing (`lib/schemas.test.ts`, `lib/export-markdown.test.ts`) |
| 2 — DB & auth | 2.1 `lib/supabase.ts` (browser/server/service clients) · 2.2 `.env.local.example` · 2.3 `0001_initial.sql` (4 tables + RLS + `touch_updated_at` trigger) · 2.4 `middleware.ts` + `/login` magic-link form + `/auth/callback` + `/api/auth/signout` | All routes compile; flow not yet smoke-tested end-to-end |

### Not done — Phases 3–5 (re-scoped for minimum deployment)

| Phase | Tasks IN scope | Tasks OUT of scope |
|---|---|---|
| 3 — OpenAI integration | **3.1** `lib/openai.ts` + `lib/interview-prompt.ts` · **3.2** `app/api/interview/stream/route.ts` (SSE + Supabase persist) · **3.3** `app/api/interview/check-gate/route.ts` (Zod-extracted gate) | — |
| 4 — UI (minimum) | **4.1** `/dashboard` + `POST /api/kits/create` · **4.4** `/kit/[id]` + `/api/kits/[id]/export-md` · **4.3-min** `/interview/[kitId]` **chat-only** (NO `KitJsonView` split-pane) | ~~4.2 hCaptcha + quota~~ deferred · ~~`KitJsonView` lateral~~ deferred (chat only) |
| 5 — Deploy + verify | **5.0** local smoke test · **5.1** `vercel deploy` (public URL) · **5.2** prod smoke test (real user, all 9 stages, real markdown download) | ~~`finishing-a-development-branch`~~ deferred until after the deploy proves the cut works |

**Key cuts vs. the original plan:**
- **No hCaptcha, no quota** — login is bare magic-link. Public URL but no gating. Acceptable risk for v0.
- **No `KitJsonView` lateral pane** — interview is chat-only, full width. The user still gets the markdown at the end; the live JSON view is polish.
- **No `finishing-a-development-branch`** — branch stays alive, deploy is from `feat/saas-phase-a` directly. Merge decision after the cut is validated.

---

## 2. Pre-flight (resources confirmed by user 2026-04-08)

| Resource | Status |
|---|---|
| Vercel account / CLI | ✅ ready |
| Supabase project + `0001_initial.sql` migration applied (4 tables exist) | ✅ ready |
| `OPENAI_API_KEY` with credit | ✅ ready |
| `web-app/.env.local` populated with the 4 vars below | ⚠️ **must verify before Task 3.1** |

**The 4 env vars `web-app/.env.local` needs to contain:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

(`HCAPTCHA_*` are deferred — see §3.)

**Action before starting Task 3.1:** verify `web-app/.env.local` exists with these 4 vars set. If not, stop and ask user to populate.

## 3. Locked decisions

| # | Decision | Choice |
|---|---|---|
| 3.1 | hCaptcha + quota | **Deferred.** Public URL is bare. Quota goes in if/when abuse appears. |
| 3.2 | `KitJsonView` split-pane | **Deferred.** Interview is chat-only, full-width. Polish for v0.5. |
| 3.3 | OpenAI model | Keep `gpt-4o-2024-08-06` (pinned in original plan). Revisit only if quality is bad in §6 smoke test. |
| 3.4 | `.env.local` location | `web-app/.env.local` inside the worktree. `.gitignore`d. |
| 3.5 | Deploy from which branch | Deploy directly from `feat/saas-phase-a` to Vercel. No merge to `main` until the cut is validated in prod. |
| 3.6 | Vercel project setup | Create new Vercel project pointed at the `web-app/` subdirectory of the worktree branch. Root dir = `web-app/`. Framework preset = Next.js. |
| 3.7 | Domain | Public Vercel-assigned URL (`*.vercel.app`). Custom domain deferred. |

---

## 4. Execution order (8 tasks, then deploy)

The original plan covers Phases 3 and 4 task-by-task. Use it as the spec, but execute in this order and apply the cuts from §3:

| # | Task | Source | Notes |
|---|---|---|---|
| 1 | **3.1** OpenAI client + prompt loader | original plan §Task 3.1 | Watch the `process.cwd()` path to `prompt.md` — see §5 risk |
| 2 | **3.2** Streaming chat route handler | original plan §Task 3.2 | Verify OpenAI SDK stream API hasn't drifted before copying |
| 3 | **3.3** Gate-check route with `zodResponseFormat` | original plan §Task 3.3 | Belt-and-braces Zod re-validation already in spec |
| 4 | **4.1** `/dashboard` + `POST /api/kits/create` | original plan §Task 4.1 | **Skip** the quota call (§3.1) — just create the kit |
| 5 | **4.4** `/kit/[id]` + `GET /api/kits/[id]/export-md` | original plan §Task 4.4 | Reorder ahead of 4.3: closes the create→download loop with a stub kit before the heavy interview UI |
| 6 | **4.3-min** `/interview/[kitId]` chat-only | original plan §Task 4.3 with cut | Build only `page.tsx` + `InterviewChat.tsx`. **Do NOT build `KitJsonView.tsx`.** Layout is single-pane chat full-width |
| 7 | **5.0** Local smoke test | new | Run `npm run dev`, do the full flow locally with real Supabase + real OpenAI before deploying |
| 8 | **5.1** Vercel deploy | new | `cd web-app && vercel` (link new project, set env vars, deploy). See §6 |

After step 8: §7 (prod smoke).

## 5. Checkpoints

| CP | After step | What we verify | If broken |
|---|---|---|---|
| **CP-1** | Step 3 (Phase 3 done) | `npm run build` + `npm test` green; routes compile; OpenAI not yet exercised | Pause, fix compile / type issues |
| **CP-2** | Step 5 (4.1 + 4.4 done) | Local: login → create kit → DB row appears → hit export-md → get a (mostly empty) markdown back | Pause, fix DB / ownership / routing |
| **CP-3** | Step 6 (4.3-min done) | Local: full chat in Stage 0 → SSE stream works → gate check passes → `currentStage` advances to Stage 1 | Pause, debug streaming + gate parse |
| **CP-4** | Step 7 (local smoke) | Local: real user, all 9 stages, downloaded `brand-kit.md` has 9 sections populated | Pause, decide if we ship anyway or fix first |
| **CP-5** | Step 8 (Vercel deploy) | Build succeeds on Vercel, env vars set, public URL responds 200 | See §6 deploy gotchas |

## 6. Vercel deploy task (Step 8) — expanded

The original plan deferred this to Phase D so it has no spec. Here it is:

**Files to touch (if any):**
- `web-app/next.config.ts` — verify no static-export config that would break route handlers
- `web-app/.gitignore` — ensure `.env.local`, `.vercel`, `node_modules` are ignored
- Maybe: `vercel.json` if we need rootDirectory override (try without first)

**Steps:**
1. From the worktree, `cd web-app`
2. Run `vercel link` (or `vercel` if not linked yet) — create a new Vercel project. When prompted:
   - Project name: `brand-kit-generator` (or whatever Vercel suggests)
   - Root directory: `web-app` (only relevant if linking from worktree root; if `cd web-app` first, leave default)
   - Framework: Next.js (auto-detected)
3. Set production env vars via `vercel env add` for each of:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
4. **Critical:** Update Supabase project's "Site URL" and "Redirect URLs" in `Auth → URL Configuration` to include the Vercel URL. Without this, magic-link callbacks will redirect to `localhost:3001` and break.
5. Run `vercel --prod` to deploy.
6. Verify the build log: no missing-env errors, no `prompt.md` ENOENT.
7. Open the public URL → land on `/login` → smoke test starts (§7).

**Deploy gotchas to watch for:**
- `prompt.md` is at `process.cwd()/../prompt.md` in dev (worktree root). On Vercel, `process.cwd()` is `web-app/`, but the parent dir **does not exist** in the build artifact unless we tell Vercel to include the file. **Mitigation:** copy `prompt.md` into `web-app/lib/prompt.md` during Step 1 (Task 3.1) and import it as a string. Cleaner than fighting the Vercel filesystem.
- Next.js 15 + `@supabase/ssr` cookie handling can break if route handlers use `cookies()` outside an async function. Spot-check for this during Phase 3.
- Route handlers default to Node runtime (good — Edge would break the OpenAI SDK).

## 7. Production smoke test (after Step 8)

On the public Vercel URL, do the same flow as CP-4 but for real:
1. `/login` → email → click magic link → land on `/dashboard`
2. Create kit → land on `/interview/<id>`
3. Answer Stage 0 honestly (this is a real interview with the real prompt)
4. Watch streaming + gate check
5. Continue through 9 stages
6. Hit `/kit/<id>` → download markdown
7. Verify all 9 sections present and populated

If this passes: ship message to user, close the loop. If it fails: bisect (local works? prod doesn't? logs say what?) before patching.

---

## 8. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `prompt.md` path resolution breaks on Vercel (`process.cwd()/../prompt.md` doesn't exist in the build artifact) | **High** | **Mitigate proactively in Step 1:** copy `prompt.md` into `web-app/lib/prompt.md` and import as a string (`import prompt from "./prompt.md"` won't work — use `fs.readFileSync(path.join(__dirname, "prompt.md"))` or convert to a `.ts` file that exports the string). Decide format during 3.1. |
| OpenAI streaming SDK API surface drifted since the original plan was written | Medium | Verify with `context7` or the SDK README before copying the snippet from the plan. Fall back to native `fetch` + SSE parsing if `openai.chat.completions.stream()` API changed. |
| `zodResponseFormat` rejects schemas with `.refine()` / `.min()` constraints (only base JSON-schema shape supported) | Medium | The original plan already does belt-and-braces validation (parse with OpenAI, then run strict Zod again locally). If parse fails, strip refinements from the schema sent to OpenAI. |
| Supabase magic-link callbacks redirect to `localhost:3001` instead of the Vercel URL | **High** | Update Supabase project's "Site URL" + "Redirect URLs" in dashboard before Step 8 smoke test. Add this as an explicit sub-step of 5.1. |
| Next.js 15 + `@supabase/ssr` cookie handling broken in route handlers | Low | Spot-check during Phase 3; if it breaks, follow the `@supabase/ssr` Next.js 15 guide |
| `web-app/.env.local` accidentally committed | Low | `.gitignore` already excludes; double-check before each commit |
| Cost explosion if a hostile user runs hundreds of interviews | **Medium** (bare URL, no quota) | Accepted risk for v0. Watch the OpenAI dashboard. If abuse appears, ship Task 4.2 (quota) as a follow-up. |

---

## 9. Out of scope (do NOT do in this cut)

- hCaptcha + quota (Task 4.2)
- `KitJsonView` split-pane (lateral live JSON view)
- Phase B (brand manual generation)
- Phase C (v0 site generation)
- Phase E (custom domain, Stripe, payments)
- Multi-brand workspaces (v2)
- Kit edit UI (v1.5 — kits are read-only after completion)
- Cost tracking per user
- Email notifications when interview completes
- Merging `feat/saas-phase-a` to `main` (defer until prod cut is validated)
- Removing the worktree

If a tempting tangent appears: log it in this section as `Followups → ...` and keep going.

---

## 10. Definition of done

This minimum-deployed cut is complete when:

1. All 8 steps from §4 are committed on `feat/saas-phase-a`
2. `npm run build` and `npm test` are green locally
3. Vercel build is green and the public URL responds 200 on `/login`
4. §7 production smoke test passes: real user, all 9 stages, downloaded `brand-kit.md` with all 9 sections populated
5. The public URL is shared with the user

After that: decide separately whether to merge to `main`, ship hCaptcha + quota, or build Phase B (manual generation).

# Site iteration: "fetch failed" on broad rewrite prompts

**Found:** 2026-04-16 while comparing two site generations of the ferced kit in prod.
**Branch context:** discovered during verification of `feat/voice-lint-bad-fit` (PR #8). Unrelated to that PR's scope — track as a separate follow-up.

## Symptom

Two iterations in prod against kit `9e0d9933-be91-4df9-960e-879604e43637`:

| # | id | status | created | error |
|---|---|---|---|---|
| 0 | `219fedc1` | completed | 2026-04-16 07:12 UTC | — |
| 1 | `e69560b6` | **failed** | 2026-04-16 09:07 UTC | `"fetch failed"` |

User prompt for iter #1: **"Ahora mejora toda la web"** — a broad "rewrite everything" instruction.

From the user's point of view the two iterations looked identical (no visible change in `/kit/:id/site`) because the second never produced output that replaced the current preview. The UI did not surface that #1 had failed.

## Diagnosis

`app/api/kits/[id]/iterate-status/route.ts:147` calls `sendIterationMessage` synchronously inside a user-facing polling handler. That function (`lib/v0-client.ts:99-105`) calls `getV0Client().chats.sendMessage(…, { responseMode: "sync" })`, which blocks until v0 finishes regenerating the site.

`"fetch failed"` is the literal message that Node's undici throws when the underlying HTTP connection dies before v0 returns a response. Most likely causes on Vercel:

1. **Serverless timeout** — Vercel caps sync handlers (60s hobby, 300s pro). Broad "rewrite the whole site" prompts can exceed that, so the fetch gets cut and throws `fetch failed` (no HTTP status surfaces).
2. **v0 side hung up** — intermittent TCP reset / TLS drop during a multi-minute call.
3. **DNS blip** — far less common, but possible.

The handler's catch block (route.ts:195) correctly:
- Marks the iteration `failed` with `error_message = err.message`.
- Refunds the founder's tokens (route.ts:207 → `refundTokens`).

What's missing:
- **No retry** around the v0 call.
- **No UI indication** in the site view that the last iteration failed. The founder just sees the preview of the previous successful version.
- **Sync mode for a multi-minute call is structurally wrong** on Vercel serverless — even with a higher timeout, one blip kills everything.

## Fixes (ranked by ROI)

### 1. Retry the v0 call with bounded backoff

Wrap `sendIterationMessage` in a small retry loop for transient network errors.

- Files: `web-app/lib/v0-client.ts` (add retry helper) and `web-app/app/api/kits/[id]/iterate-status/route.ts:147`.
- Detect `fetch failed` / `ECONNRESET` / `UND_ERR_SOCKET` / timeout errors specifically. Do **not** retry on 4xx or quota errors.
- 2 retries with jittered backoff (e.g. 2s, 6s). Short enough to stay under the serverless ceiling.
- Cheap win. Closes most intermittent failures.

### 2. Surface failures in the site view

Today `/kit/:id/site` renders the most recent completed preview. When the *latest* iteration failed, render a banner above the preview:

> Iteration #N failed: `fetch failed`. [Retry]

- Files to touch: `web-app/app/kit/[id]/site/*` (site page + client component).
- The `GET /api/kits/:id/iterations` endpoint already returns `status` and `error` per iteration.
- Retry button posts the same `user_message` again (already stored on the iteration row).

Without this the founder has no signal that something went wrong — they just think "nothing changed". This is the UX failure that led to the original report.

### 3. Move the v0 call off the polling handler

`responseMode: "sync"` inside a user-facing request is brittle on serverless. Options, in order of effort:

- **Lightweight:** mark the row `running`, kick off the v0 call in a `waitUntil(...)` / `after(...)` background promise, and let the client keep polling `iterate-status` for the row to transition. Caveat: Vercel `waitUntil` has its own ceiling, but the client isn't tied to a single invocation.
- **Proper:** use v0's async mode (if exposed) + webhook callback to mark completion. Larger refactor.

Only worth doing if #1 and #2 still leave the error rate meaningful.

## Notes for whoever picks this up

- Repro: hit the existing ferced kit, click Regenerate, prompt with "Rewrite the entire site from scratch including new sections". Should reproduce a long-running v0 call that's likely to hit the timeout on hobby-tier Vercel.
- Don't bundle with PR #8 (voice-lint / inline edit). Different code path, different test surface.
- Token refund is already wired — retries don't double-charge as long as we call `sendIterationMessage` without creating a new iteration row.

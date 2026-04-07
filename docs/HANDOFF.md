# Handoff — continue brand-kit-generator landing polish + launch

> **For Claude:** paste this entire file (or its contents) as the first
> message of a new Claude Code session opened at the repo root. It
> bootstraps you into the task with all the context the plan file doesn't
> already cover.

---

## Context

**What this is:** brand-kit-generator is an open-source + SaaS product by
Acelera (the agency). The repo has three things:

1. `prompt.md` — 600-line opinionated system prompt that interviews a
   founder across 8 stages and produces a brand kit. Reverse-engineered
   from Acelera's own brand kit (`acelera-agency/brand`).
2. `README.md` — positioning of the project, three modes of use,
   contributing rules.
3. `web/` — Next.js 15 + Tailwind landing page for the *hosted* version
   of the product. The actual SaaS (interview UI, auth, payments) is NOT
   built yet — the landing is coming-soon + waitlist.

**Local repo:** `C:\Users\franc\OneDrive\Documentos\dev\acelera-agency\brand-kit-generator`
**Remote:** https://github.com/acelera-agency/brand-kit-generator
**Last relevant commit:** `59fc792` — "Add system prompt, README, and Next.js landing for hosted version"

---

## The plan

The implementation plan lives in
`docs/plans/2026-04-07-polish-and-launch-landing.md` (433 lines, written
in the `writing-plans` skill format). Three phases:

- **Phase 0 — Pre-flight** (1 task): verify dev server, build, git clean
- **Phase 1 — Polish copy + visual** (9 tasks, one per page section)
- **Phase 2 — Wire waitlist to Resend** (4 tasks)
- **Phase 3 — Deploy on Vercel + DNS** (6 tasks)

**Read the plan file end-to-end before starting.** Don't summarize it
mentally — actually read it.

---

## Decisions already pinned (do not re-ask)

| Decision | Value | Why |
|---|---|---|
| Email service | **Resend** (free tier, 3000/mo) | Simplest setup, 5-min wiring |
| Domain | **brandkit.acelera.agency** | Subdomain of agency, no purchase |
| First `from:` address | `onboarding@resend.dev` | Resend default; switch to custom domain in optional Task 3.6 |
| Phase 1 cadence | One commit per section | No batching — keeps iteration tight |
| Out of scope | The actual SaaS (interview UI, auth, payments) | Documented as "Leg C", separate plan later |
| Out of scope | Renaming `Automation-Agency`, analytics setup, i18n, Figma capture | All deferred |

---

## Required skill

Use **`superpowers:executing-plans`** to walk the plan task by task with
review checkpoints. The plan file's header references this explicitly.

If the user prefers fast-iteration mode, **`superpowers:subagent-driven-development`**
also applies — dispatch a fresh subagent per task and review between tasks.

---

## What you'll need from the user during execution

| When | What |
|---|---|
| Phase 1, every task | Pick between the copy/visual options you'll propose |
| Task 2.4 | Real Resend API key + the inbox that should receive signup notifications |
| Task 3.1 | The user connects the Vercel project (their account) |
| Task 3.4 | The user adds the CNAME record at the DNS provider for `acelera.agency` |

Everything else you do yourself.

---

## Related repos for context (don't touch unless asked)

- **`acelera-agency/brand`** — the canonical brand kit + style-guide
  HTML/CSS. The landing's visual system is **1:1** with
  `brand/style-guide/styles.css`. If you doubt a color, font, or spacing
  value, that file is the source of truth.
- **`acelera-agency/Landing-orchestrator`** and
  **`acelera-agency/Phone-Automated-Agents`** — other agency projects,
  not relevant here.
- **`NachoEstevo/Automation-Agency`** — the *current* `acelera.agency`
  landing (with the old "automation agency" positioning). Do not touch
  in this plan.

---

## User preferences (from prior sessions)

- **Language:** Argentinian Spanish, conversational but direct
- **Style:** short responses, no preamble, lead with the action or answer
- **Task tracking:** use TaskCreate / TaskUpdate for multi-step work
- **Honesty when something doesn't work:** don't invent workarounds — say
  it's broken and offer alternatives
- **Confirmation before risky actions:** ask before destructive or
  externally-visible operations (push, deploy, sending real emails)
- **Memory system:** the user has an auto-memory at
  `C:\Users\franc\.claude\projects\C--Users-franc-OneDrive-Documentos-dev-acelera-agency\memory\`
  with notes about the brand-kit constraints (forbidden words, etc.) —
  check `MEMORY.md` for the index

---

## Suggested first message to send the user

> Listo, leí el plan en
> `docs/plans/2026-04-07-polish-and-launch-landing.md` y este HANDOFF.
> Vamos con Task 0.1 (pre-flight check) y después arranco Fase 1 con la
> Hero. ¿Subagent-driven o secuencial in-session?

---

*Handoff written 2026-04-07. If decisions or scope change before the next
session starts, update this file or note the override in the first
message.*

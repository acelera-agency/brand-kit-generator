# Brand Kit Generator SaaS — Phase A Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the foundation of the brand-kit-generator SaaS — a Next.js 15 app where a founder signs up, completes a streaming chat interview powered by OpenAI, and downloads their structured brand kit as markdown. **No brand manual generation, no v0 site generation, no Vercel deploy** — those are Phases B-E.

**Architecture:** New `web-app/` folder in the repo (sibling of existing `web/` landing). Next.js 15 App Router + TypeScript + Tailwind. Supabase for auth + Postgres. OpenAI SDK for the streaming interview chat with structured-output gate enforcement via Zod schemas. The data model is two-layer: a `BrandKit` JSONB column captures the user's interview decisions, and Zod schemas at each stage enforce the gates from `prompt.md`. Session-state lives in Postgres so users can resume the interview across sessions.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), OpenAI Node SDK (`openai`), Zod (`zod`), `openai/helpers/zod` for `zodResponseFormat`.

**Vision plan:** `C:\Users\franc\.claude\plans\warm-sleeping-lake.md` (vision doc, not executable).

**Decisions locked from the vision plan:**
- LLM: OpenAI `gpt-4o-2024-08-06` (structured outputs) + `gpt-4o-mini-2024-07-18` (cheaper sub-tasks)
- Manual scope v1: minimum viable (Phase B, NOT this plan)
- Interview UX: streaming chat with split-pane (chat left, JSON kit right)
- Free tier: 3 interviews per email per month, hCaptcha on signup (Task 4.2)
- Auth: Supabase email magic-link (only auth provider, no Google/GitHub for v1)

---

## Pre-flight checks before starting

Before Task 0.1, the engineer must verify:

1. **They are inside the worktree.** Run `pwd` — must end with `.worktrees/saas-phase-a`. If not, `cd C:/Users/franc/OneDrive/Documentos/dev/acelera-agency/brand-kit-generator/.worktrees/saas-phase-a` first.

2. **They are on the right branch.** Run `git branch --show-current` — must say `feat/saas-phase-a`. If not, STOP and figure out why.

3. **They have the user's secrets.** Required env vars (do NOT commit them):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `HCAPTCHA_SITE_KEY` (Task 4.2)
   - `HCAPTCHA_SECRET_KEY` (Task 4.2)

   If any of these are missing when a task needs them, **STOP and ask the user**. Do not invent values.

4. **Node version:** `node --version` must be ≥ 20. Run `node --version` to verify.

---

## Phase 0 — Scaffolding

### Task 0.1: Verify environment + create web-app/ Next.js app

**Files:**
- Create: `web-app/` (entire Next.js folder structure)

**Step 1:** Verify pre-flight (see above). All four checks must pass.

**Step 2:** Create the Next.js app via `create-next-app` with the same flags the existing `web/` uses, scoped to `web-app/`:

```bash
cd C:/Users/franc/OneDrive/Documentos/dev/acelera-agency/brand-kit-generator/.worktrees/saas-phase-a
npx create-next-app@latest web-app \
  --typescript --tailwind --eslint --app \
  --src-dir false --import-alias "@/*" --no-turbopack
```

When prompted, accept all defaults. The flag `--no-turbopack` is intentional — turbopack has occasional rough edges with route handlers and SSE.

**Step 3:** Verify the dev server starts:
```bash
cd web-app && npm run dev
```
Expected: `▲ Next.js 15.x.x` and `Local: http://localhost:3001` (or another port if 3000 is taken). Hit Ctrl+C after confirming.

**Step 4:** Update `web-app/package.json` to lock the dev port to **3001** (the landing uses 3000):
```json
"scripts": {
  "dev": "next dev -p 3001",
  ...
}
```

**Step 5:** Verify build:
```bash
npm run build
```
Expected: `✓ Compiled successfully` and the default Next.js home page generated.

**Step 6:** Commit:
```bash
cd ../  # back to worktree root
git add web-app/
git commit -m "feat(saas): scaffold web-app/ Next.js 15 app

create-next-app with TypeScript, Tailwind, ESLint, App Router. Dev
server pinned to port 3001 to coexist with the landing on 3000."
```

---

### Task 0.2: Copy Acelera visual tokens from web/

**Files:**
- Copy: `web/tailwind.config.ts` → `web-app/tailwind.config.ts`
- Copy: `web/app/globals.css` → `web-app/app/globals.css`

**Step 1:** Read both files in `web/` to understand what to copy:
```
Read web/tailwind.config.ts in full
Read web/app/globals.css in full
```

**Step 2:** Replace `web-app/tailwind.config.ts` with the contents of `web/tailwind.config.ts`. The visual tokens (paper, ink, accent green, fonts) should be identical so the SaaS feels visually one-piece with the landing.

**Step 3:** Replace `web-app/app/globals.css` with the contents of `web/app/globals.css`.

**Step 4:** Update `web-app/app/layout.tsx` to add the same Google Fonts preconnect + link tags as `web/app/layout.tsx` lines 24-34. Title should be:
```ts
title: "Brand Kit Generator — by Acelera",
```

**Step 5:** Smoke test — replace `web-app/app/page.tsx` with a minimal placeholder using the brand tokens:
```tsx
export default function Home() {
  return (
    <main className="container-brand pt-24 pb-32">
      <p className="eyebrow mb-6 block">SaaS · v0.1</p>
      <h1 className="font-display font-semibold text-ink leading-[0.95] tracking-tightest text-[clamp(2rem,5vw,4rem)]">
        Brand Kit Generator app
      </h1>
      <p className="font-display text-muted-strong mt-4">
        Phase A scaffolding in progress.
      </p>
    </main>
  );
}
```

**Step 6:** `cd web-app && npm run dev` → open http://localhost:3001 → verify the page renders with paper background, dark text, and Inter Tight font. Ctrl+C.

**Step 7:** Commit:
```bash
git add web-app/
git commit -m "feat(saas): copy Acelera visual tokens from landing

tailwind.config.ts + globals.css are 1:1 with web/. Same tokens, same
fonts. Placeholder home page renders to verify the brand visual system."
```

---

## Phase 1 — Types and Zod schemas (TDD)

**Why TDD here:** Zod schemas + the markdown export are pure functions. Tests are cheap, fast, and catch the most common foot-guns (typos in field names, missing refinements). Use Vitest (Next.js 15 plays nice with it).

### Task 1.1: Add Vitest + write the BrandKit type

**Files:**
- Create: `web-app/lib/types.ts`
- Create: `web-app/vitest.config.ts`
- Modify: `web-app/package.json` (add deps + test script)

**Step 1:** Install Vitest + zod:
```bash
cd web-app
npm install --save-dev vitest @vitest/ui
npm install zod
```

**Step 2:** Create `web-app/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

**Step 3:** Add to `web-app/package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4:** Create `web-app/lib/types.ts` with the `BrandKit` interface. Copy the shape from the vision plan (`warm-sleeping-lake.md` lines ~225-310) — `BrandKit` interface only, no other types. Use `import type { z } from "zod"` to leave room for the schemas in the next task.

**Step 5:** Run `npm run build` → expected: still compiles (types are unused but valid).

**Step 6:** Commit:
```bash
git add web-app/
git commit -m "feat(saas): add Vitest + BrandKit types skeleton"
```

---

### Task 1.2: Stage 0 Zod schema + first failing test

**Files:**
- Create: `web-app/lib/schemas.ts`
- Create: `web-app/lib/schemas.test.ts`

**Step 1:** Write the test FIRST in `web-app/lib/schemas.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { Stage0Schema } from "./schemas";

describe("Stage0Schema", () => {
  it("accepts a valid 3-sentence beforeAfter narrative", () => {
    const result = Stage0Schema.safeParse({
      beforeAfter: "We started as a small consultancy. We tried to scale by hiring. Then we realized our edge was the partner-led model.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty beforeAfter", () => {
    const result = Stage0Schema.safeParse({ beforeAfter: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a beforeAfter that is too short", () => {
    const result = Stage0Schema.safeParse({ beforeAfter: "Short." });
    expect(result.success).toBe(false);
  });
});
```

**Step 2:** Run the test:
```bash
npm test
```
Expected: FAIL — "Cannot find module './schemas'".

**Step 3:** Create `web-app/lib/schemas.ts`:
```ts
import { z } from "zod";

// Stage 0 — Context & Contradiction
// prompt.md:148-169 — "3-sentence before vs after that sounds like the founder"
export const Stage0Schema = z.object({
  beforeAfter: z
    .string()
    .min(40, "The before/after narrative needs more substance — aim for ~3 sentences.")
    .max(800, "Too long. The before/after should be 3 sentences, not an essay."),
});
export type Stage0 = z.infer<typeof Stage0Schema>;
```

**Step 4:** Run the test again:
```bash
npm test
```
Expected: PASS (3/3).

**Step 5:** Commit:
```bash
git add web-app/lib/
git commit -m "feat(saas): Stage 0 Zod schema (Context & Contradiction)"
```

---

### Task 1.3: Stages 1-4 Zod schemas (test-first batch)

**Files:**
- Modify: `web-app/lib/schemas.ts`
- Modify: `web-app/lib/schemas.test.ts`

For each stage, follow the same pattern: write the test FIRST, watch it fail, implement, watch it pass.

**Stage 1 (Enemy)** — single sentence, prompt.md:172-200:
- Schema: `z.object({ enemy: z.string().min(15).max(200) })`
- Tests: accepts a sharp single-sentence enemy, rejects empty, rejects multi-paragraph

**Stage 2 (Three-Layer Stack)** — Character/Promise/Method, each <10 words, prompt.md:203-236:
- Schema:
  ```ts
  export const Stage2Schema = z.object({
    stack: z.object({
      character: z.string().min(3).max(50).refine(s => s.split(/\s+/).length <= 10, "Character phrase must be 10 words or fewer"),
      promise: z.string().min(3).max(50).refine(s => s.split(/\s+/).length <= 10, "Promise phrase must be 10 words or fewer"),
      method: z.string().min(3).max(50).refine(s => s.split(/\s+/).length <= 10, "Method phrase must be 10 words or fewer"),
    }),
  });
  ```
- Tests: accepts three short phrases, rejects when any phrase exceeds 10 words, rejects empty fields

**Stage 3 (Anti-positioning)** — minimum 5 statements with cost, prompt.md:239-262:
- Schema:
  ```ts
  export const Stage3Schema = z.object({
    antiPositioning: z.array(z.object({
      statement: z.string().min(8),
      cost: z.string().min(8),
    })).min(5, "Need at least 5 anti-positioning statements"),
  });
  ```
- Tests: accepts 5 valid items, rejects 4 items, rejects items without cost

**Stage 4 (ICP by signals)** — primary signals + optional secondary, prompt.md:265-289:
- Schema:
  ```ts
  export const Stage4Schema = z.object({
    icp: z.object({
      primary: z.object({
        signals: z.array(z.string().min(8)).min(4, "Need at least 4 behavioral signals").max(6),
      }),
      secondary: z.object({
        role: z.string(),
        signals: z.array(z.string().min(8)),
      }).optional(),
    }),
  });
  ```
- Tests: accepts 4 signals, rejects 3 signals, accepts optional secondary, rejects empty signals

**Step 1 per stage:** Write all the tests for that stage first.
**Step 2:** Run `npm test` → expected FAIL.
**Step 3:** Implement the schema.
**Step 4:** Run `npm test` → expected PASS for that stage.
**Step 5:** Commit per stage.

**Final batch verification:** Run `npm test` after all 4 stages → expected ~16 tests passing.

**Final commit (one per stage, four total):**
```bash
git commit -m "feat(saas): Stage 1 Zod schema (Enemy)"
git commit -m "feat(saas): Stage 2 Zod schema (Three-Layer Stack)"
git commit -m "feat(saas): Stage 3 Zod schema (Anti-positioning)"
git commit -m "feat(saas): Stage 4 Zod schema (ICP by signals)"
```

---

### Task 1.4: Stages 5-8 Zod schemas (test-first batch)

Same pattern. Write tests first, fail, implement, pass, commit per stage.

**Stage 5 (Voice as constraints)** — prompt.md:292-316:
```ts
export const Stage5Schema = z.object({
  voice: z.object({
    principles: z.array(z.string().min(8)).min(3).max(7),
    do: z.array(z.string().min(8)).min(5),
    dont: z.array(z.string().min(8)).min(5),
    writingRules: z.array(z.string().min(8)).min(3),
    beforeAfter: z.array(z.object({
      old: z.string().min(8),
      new: z.string().min(8),
    })).min(3),
  }),
});
```

**Stage 6 (Application templates)** — prompt.md:319-348. Templates are objects, not strings. Each template has its own sub-schema.

**Stage 7 (Visual direction)** — palette, typography, components. The most complex one. Pay attention to:
- `palette`: array of objects with `name`, `hex` (regex `/^#[0-9A-Fa-f]{6}$/`), `role` enum, optional `narrative`
- `typography`: nested object with display/body/optional mono, each with `family`, `weights` array, `source` enum, optional `url`
- `characteristicComponents`: array of `{name, description}`, min 3
- `forbiddenVisuals`: string array, min 3
- `logoDirection`: string min 20

**Stage 8 (Non-negotiable rules per surface)** — prompt.md:388-410. Rules per surface as `{rule, reason}` pairs.

**After all 4 stages:** Run `npm test` → expected ~32 tests passing total. Each stage has its own commit.

**Then add the combined `BrandKitSchema`:**
```ts
export const BrandKitSchema = z.object({
  context: Stage0Schema.shape.beforeAfter ? Stage0Schema : Stage0Schema, // unwrap pattern, see implementation
  // ... combine all stages
});
```

(Engineer: the right pattern here is to flatten — each Stage`N`Schema unwraps into the parent. Look at how Zod composes object schemas with `.extend()` or `.merge()`. The combined schema represents the FULL kit; each stage schema represents the SLICE that stage produces.)

Commit the combined schema separately:
```bash
git commit -m "feat(saas): combined BrandKitSchema composing all 9 stages"
```

---

### Task 1.5: Markdown export function (test-first)

**Files:**
- Create: `web-app/lib/export-markdown.ts`
- Create: `web-app/lib/export-markdown.test.ts`

**Step 1:** Write the test first. Use a small, hand-built complete `BrandKit` fixture and assert that the markdown output contains key sections:
```ts
import { describe, it, expect } from "vitest";
import { exportToMarkdown } from "./export-markdown";
import type { BrandKit } from "./types";

const fixture: BrandKit = {
  // ... a complete, valid BrandKit object with realistic data
  // (you'll write this — make it ~50 lines, all stages filled)
};

describe("exportToMarkdown", () => {
  it("includes the brand context section", () => {
    const md = exportToMarkdown(fixture);
    expect(md).toContain("## Context");
    expect(md).toContain(fixture.context.beforeAfter);
  });

  it("includes all 9 stage section headers", () => {
    const md = exportToMarkdown(fixture);
    const expectedSections = ["Context", "Enemy", "Brand stack", "Anti-positioning", "ICP", "Voice", "Templates", "Visual direction", "Rules"];
    for (const section of expectedSections) {
      expect(md).toContain(section);
    }
  });

  it("renders the do/don't pairs as a list", () => {
    const md = exportToMarkdown(fixture);
    expect(md).toMatch(/- ✓/);
    expect(md).toMatch(/- ✗/);
  });

  // Add more for: anti-positioning with cost, palette with hex, rules per surface
});
```

**Step 2:** Run `npm test` → fails with "exportToMarkdown not defined".

**Step 3:** Implement `web-app/lib/export-markdown.ts`. The function takes a `BrandKit` and returns a string. Render each section with a `##` heading, lists with `-`, code blocks where appropriate. Use template literals for clarity.

Reference the existing `acelera-agency/brand` repo's structure for what a complete kit looks like, but since you may not have it locally, just use natural markdown that mirrors the 9 stages.

**Step 4:** Run `npm test` → expected PASS.

**Step 5:** Commit:
```bash
git add web-app/lib/export-markdown.ts web-app/lib/export-markdown.test.ts
git commit -m "feat(saas): markdown export from BrandKit"
```

---

## Phase 2 — Database & Auth (Supabase)

### Task 2.1: User creates Supabase project

**This task is the user's, not Claude's.** STOP here and ask the user to:

1. Sign up / log in at https://supabase.com
2. Create a new project named `brand-kit-generator` in any region they prefer
3. Wait for it to provision (~2 min)
4. Go to Project Settings → API → copy:
   - **Project URL** → user gives Claude as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → user gives Claude as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → user gives Claude as `SUPABASE_SERVICE_ROLE_KEY` (this is sensitive — server-side only)
5. Confirm to Claude that the project is created

Claude should NOT proceed until the user has confirmed.

---

### Task 2.2: Create env files + Supabase client wrapper

**Files:**
- Create: `web-app/.env.local.example`
- Create: `web-app/.env.local` (NOT committed — has real keys)
- Modify: `web-app/.gitignore` (verify `.env*.local` is excluded — should already be)
- Create: `web-app/lib/supabase.ts`

**Step 1:** Install Supabase clients:
```bash
cd web-app
npm install @supabase/supabase-js @supabase/ssr
```

**Step 2:** Create `web-app/.env.local.example` (this IS committed):
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# hCaptcha (free tier)
HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
HCAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000
```

**Step 3:** User must create `web-app/.env.local` with the real values from Task 2.1. Claude should NOT write this file with real secrets — instead, INSTRUCT the user to copy the example and fill it in. Ask the user to confirm `.env.local` is created and populated.

**Step 4:** Create `web-app/lib/supabase.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Browser client — for client components
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Server client — for server components and route handlers (uses cookies)
export async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component context — cookie setting is handled by middleware
          }
        },
      },
    },
  );
}

// Service role client — server-side admin operations only. Never expose to client.
export function getServiceClient() {
  // Lazy-instantiate inside handler context to mirror the Resend lesson
  // from web/app/api/waitlist/route.ts.
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

**Step 5:** Verify build:
```bash
npm run build
```
Expected: `✓ Compiled successfully`. (The new file isn't imported anywhere yet, so no runtime check.)

**Step 6:** Commit:
```bash
git add web-app/.env.local.example web-app/lib/supabase.ts web-app/package.json web-app/package-lock.json
git commit -m "feat(saas): Supabase client wrapper + env template"
```

---

### Task 2.3: Database schema (SQL migration)

**Files:**
- Create: `web-app/supabase/migrations/0001_initial.sql`

**Step 1:** Create the migrations folder and write the initial schema:
```sql
-- 0001_initial.sql — brand-kit-generator SaaS schema v1

-- Brand kits (the source of truth, JSONB)
create table public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'completed', 'published')),
  kit jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.brand_kits(owner_id);
create index on public.brand_kits(status);

-- Interview messages (chat history per kit)
create table public.interview_messages (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.brand_kits(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  stage_id text not null,
  created_at timestamptz not null default now()
);

create index on public.interview_messages(kit_id, created_at);

-- Stage progress (which gates have passed)
create table public.stage_progress (
  kit_id uuid not null references public.brand_kits(id) on delete cascade,
  stage_id text not null,
  status text not null default 'empty' check (status in ('empty', 'in-progress', 'passed')),
  passed_at timestamptz,
  primary key (kit_id, stage_id)
);

-- Free tier abuse cap: count interviews per email per month
create table public.interview_quota (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_month_count int not null default 0,
  current_month_start date not null default date_trunc('month', now())::date,
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at on brand_kits
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger brand_kits_updated_at
  before update on public.brand_kits
  for each row execute function public.touch_updated_at();

-- RLS: users can only see their own kits
alter table public.brand_kits enable row level security;
create policy "Users see own kits"      on public.brand_kits for select using (auth.uid() = owner_id);
create policy "Users insert own kits"   on public.brand_kits for insert with check (auth.uid() = owner_id);
create policy "Users update own kits"   on public.brand_kits for update using (auth.uid() = owner_id);
create policy "Users delete own kits"   on public.brand_kits for delete using (auth.uid() = owner_id);

alter table public.interview_messages enable row level security;
create policy "Users see own messages" on public.interview_messages for select
  using (exists (select 1 from public.brand_kits where id = kit_id and owner_id = auth.uid()));
create policy "Users insert own messages" on public.interview_messages for insert
  with check (exists (select 1 from public.brand_kits where id = kit_id and owner_id = auth.uid()));

alter table public.stage_progress enable row level security;
create policy "Users see own progress" on public.stage_progress for select
  using (exists (select 1 from public.brand_kits where id = kit_id and owner_id = auth.uid()));
create policy "Users update own progress" on public.stage_progress for all
  using (exists (select 1 from public.brand_kits where id = kit_id and owner_id = auth.uid()));

alter table public.interview_quota enable row level security;
create policy "Users see own quota" on public.interview_quota for select using (auth.uid() = user_id);
```

**Step 2:** Apply the migration. The user can do this via the Supabase dashboard SQL editor:
- Go to Supabase project → SQL Editor → New query
- Paste the entire `0001_initial.sql` contents
- Click Run

Ask the user to confirm: "Migration applied? Tables visible in Table Editor?"

**Step 3:** Commit:
```bash
git add web-app/supabase/migrations/0001_initial.sql
git commit -m "feat(saas): initial Postgres schema (kits, messages, progress, quota) + RLS"
```

---

### Task 2.4: Auth middleware + login page

**Files:**
- Create: `web-app/middleware.ts`
- Create: `web-app/app/login/page.tsx`
- Create: `web-app/app/auth/callback/route.ts`
- Create: `web-app/app/api/auth/signout/route.ts`

**Step 1:** Create `web-app/middleware.ts` to refresh Supabase session cookies on every request:
```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Touch the session so it refreshes if needed
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 2:** Create `web-app/app/login/page.tsx` — a magic-link form. Server component that posts to a server action which calls `supabase.auth.signInWithOtp({email})`. Visual: same Acelera tokens as the landing.

**Step 3:** Create `web-app/app/auth/callback/route.ts` — Supabase redirects here after the user clicks the magic link. Exchange the `code` query param for a session, then redirect to `/dashboard`:
```ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await getServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
```

**Step 4:** Create `web-app/app/api/auth/signout/route.ts` — POST handler that calls `supabase.auth.signOut()` and redirects to `/login`.

**Step 5:** Manually test:
```bash
npm run dev
```
- Open http://localhost:3001/login
- Enter your email
- Submit
- Check your inbox for the magic link
- Click it
- Verify you land on /dashboard (it doesn't exist yet, so a 404 is OK — what matters is that the URL is `/dashboard`)

**Step 6:** Commit:
```bash
git add web-app/
git commit -m "feat(saas): magic-link auth via Supabase

middleware refreshes session per request, /login posts to a server
action, /auth/callback exchanges the code for a session and redirects
to /dashboard."
```

---

## Phase 3 — OpenAI integration

### Task 3.1: OpenAI client wrapper + interview system prompt loader

**Files:**
- Create: `web-app/lib/openai.ts`
- Create: `web-app/lib/interview-prompt.ts`

**Step 1:** Install the OpenAI SDK:
```bash
npm install openai
```

**Step 2:** Create `web-app/lib/openai.ts` with lazy-instantiation pattern (the Resend lesson):
```ts
import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// Models pinned for reproducibility
export const MODEL_INTERVIEW = "gpt-4o-2024-08-06";
export const MODEL_GATE = "gpt-4o-2024-08-06"; // structured output
export const MODEL_CHEAP = "gpt-4o-mini-2024-07-18";
```

**Step 3:** Create `web-app/lib/interview-prompt.ts` to load `prompt.md` once at module load:
```ts
import fs from "fs";
import path from "path";

let _systemPrompt: string | null = null;

function loadSystemPrompt(): string {
  if (_systemPrompt) return _systemPrompt;
  // The repo root prompt.md is two levels up from web-app/lib/
  const promptPath = path.join(process.cwd(), "..", "prompt.md");
  if (!fs.existsSync(promptPath)) {
    throw new Error(`prompt.md not found at ${promptPath}`);
  }
  _systemPrompt = fs.readFileSync(promptPath, "utf-8");
  return _systemPrompt;
}

/**
 * Build the messages array for the interview chat.
 * Includes: the prompt.md system prompt, a stage-specific addendum,
 * and the conversation history so far.
 */
export function buildInterviewMessages(opts: {
  currentStageId: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const systemPrompt = loadSystemPrompt();
  const stageContext = `\n\n---\n\nYou are currently in **${opts.currentStageId}**. Stay focused on this stage. Do not advance to the next stage until the gate for ${opts.currentStageId} is verifiably passed.`;

  return [
    { role: "system", content: systemPrompt + stageContext },
    ...opts.conversationHistory.map((m) => ({ role: m.role, content: m.content })),
  ];
}
```

**Step 4:** Smoke test by writing a tiny script and running it:
```bash
node -e "const {getOpenAI, MODEL_CHEAP} = require('./lib/openai.ts'); /* won't work without ts compile, see step 5 */"
```

Actually — verify by importing in a test instead:
Create `web-app/lib/openai.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { MODEL_INTERVIEW, MODEL_GATE, MODEL_CHEAP } from "./openai";

describe("OpenAI constants", () => {
  it("pins the interview model", () => {
    expect(MODEL_INTERVIEW).toBe("gpt-4o-2024-08-06");
  });
  it("uses cheap model for sub-tasks", () => {
    expect(MODEL_CHEAP).toContain("mini");
  });
});
```
Run `npm test` → expect PASS.

**Step 5:** Commit:
```bash
git add web-app/lib/openai.ts web-app/lib/interview-prompt.ts web-app/lib/openai.test.ts web-app/package.json
git commit -m "feat(saas): OpenAI client wrapper + interview prompt loader"
```

---

### Task 3.2: Streaming chat route handler

**Files:**
- Create: `web-app/app/api/interview/stream/route.ts`

**Step 1:** Create the route handler. POST endpoint that takes `{kitId, message}`, persists the user message, calls OpenAI streaming, persists the assistant message as it streams, and returns a Server-Sent Events response:
```ts
import { NextRequest } from "next/server";
import { getOpenAI, MODEL_INTERVIEW } from "@/lib/openai";
import { buildInterviewMessages } from "@/lib/interview-prompt";
import { getServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { kitId, message } = body;

  // Verify the kit belongs to the user
  const { data: kit, error: kitErr } = await supabase
    .from("brand_kits")
    .select("id, owner_id")
    .eq("id", kitId)
    .single();
  if (kitErr || !kit || kit.owner_id !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  // Determine current stage
  const { data: progress } = await supabase
    .from("stage_progress")
    .select("stage_id, status")
    .eq("kit_id", kitId);
  const currentStageId = progress?.find(p => p.status === "in-progress")?.stage_id ?? "stage_0";

  // Persist user message
  await supabase.from("interview_messages").insert({
    kit_id: kitId,
    role: "user",
    content: message,
    stage_id: currentStageId,
  });

  // Load conversation history for this kit
  const { data: history } = await supabase
    .from("interview_messages")
    .select("role, content")
    .eq("kit_id", kitId)
    .order("created_at", { ascending: true });

  const messages = buildInterviewMessages({
    currentStageId,
    conversationHistory: (history ?? []).map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
  });

  // Stream OpenAI response
  const openai = getOpenAI();
  const encoder = new TextEncoder();
  let assistantContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const runner = openai.chat.completions.stream({
          model: MODEL_INTERVIEW,
          messages: messages as any,
        });

        runner.on("content", (delta) => {
          assistantContent += delta;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
        });

        await runner.finalContent();

        // Persist final assistant message
        await supabase.from("interview_messages").insert({
          kit_id: kitId,
          role: "assistant",
          content: assistantContent,
          stage_id: currentStageId,
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (err) {
        console.error("[interview/stream]", err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
```

**Step 2:** Smoke test once Phase 4 has a kit creation flow. For now: `npm run build` to verify it compiles.

**Step 3:** Commit:
```bash
git add web-app/app/api/interview/stream/route.ts
git commit -m "feat(saas): streaming chat route handler with OpenAI + Supabase persistence"
```

---

### Task 3.3: Gate-check route handler with structured output

**Files:**
- Create: `web-app/app/api/interview/check-gate/route.ts`

**Step 1:** Implement the gate check. POST takes `{kitId, stageId}`, loads the conversation for that stage, calls OpenAI's `.parse()` with the matching Zod schema, validates, and on success writes the structured data to `brand_kits.kit` JSONB and marks the stage passed.

```ts
import { NextRequest, NextResponse } from "next/server";
import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAI, MODEL_GATE } from "@/lib/openai";
import { getServerClient } from "@/lib/supabase";
import {
  Stage0Schema, Stage1Schema, Stage2Schema, Stage3Schema, Stage4Schema,
  Stage5Schema, Stage6Schema, Stage7Schema, Stage8Schema,
} from "@/lib/schemas";

const STAGE_SCHEMAS = {
  stage_0: Stage0Schema,
  stage_1: Stage1Schema,
  stage_2: Stage2Schema,
  stage_3: Stage3Schema,
  stage_4: Stage4Schema,
  stage_5: Stage5Schema,
  stage_6: Stage6Schema,
  stage_7: Stage7Schema,
  stage_8: Stage8Schema,
};

export async function POST(req: NextRequest) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { kitId, stageId } = await req.json();
  const schema = STAGE_SCHEMAS[stageId as keyof typeof STAGE_SCHEMAS];
  if (!schema) {
    return NextResponse.json({ error: `Unknown stage: ${stageId}` }, { status: 400 });
  }

  // Load the conversation for this stage
  const { data: messages } = await supabase
    .from("interview_messages")
    .select("role, content")
    .eq("kit_id", kitId)
    .eq("stage_id", stageId)
    .order("created_at", { ascending: true });

  if (!messages?.length) {
    return NextResponse.json({ passed: false, error: "No conversation yet" });
  }

  // Ask OpenAI to extract structured data
  const openai = getOpenAI();
  const completion = await openai.chat.completions.parse({
    model: MODEL_GATE,
    messages: [
      {
        role: "system",
        content: `Extract the data for ${stageId} from the conversation. If the user has not provided enough to fill the schema, return as much as you can — validation will catch incompleteness.`,
      },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    response_format: zodResponseFormat(schema, stageId),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    return NextResponse.json({
      passed: false,
      error: "OpenAI failed to extract structured data",
    });
  }

  // Run our own Zod validation as belt-and-braces
  const validation = schema.safeParse(parsed);
  if (!validation.success) {
    return NextResponse.json({
      passed: false,
      validationErrors: validation.error.errors,
    });
  }

  // Merge into the kit JSONB
  const { data: kitRow } = await supabase
    .from("brand_kits")
    .select("kit")
    .eq("id", kitId)
    .single();
  const merged = { ...(kitRow?.kit ?? {}), ...validation.data };

  await supabase.from("brand_kits").update({ kit: merged }).eq("id", kitId);
  await supabase.from("stage_progress").upsert({
    kit_id: kitId,
    stage_id: stageId,
    status: "passed",
    passed_at: new Date().toISOString(),
  });

  return NextResponse.json({ passed: true, data: validation.data });
}
```

**Step 2:** Build check:
```bash
npm run build
```
Expected: compiles.

**Step 3:** Commit:
```bash
git add web-app/app/api/interview/check-gate/route.ts
git commit -m "feat(saas): gate-check route handler with Zod-enforced extraction"
```

---

## Phase 4 — UI

### Task 4.1: Dashboard + new kit creation

**Files:**
- Create: `web-app/app/dashboard/page.tsx`
- Create: `web-app/app/api/kits/create/route.ts`

**Step 1:** `/dashboard` server component — lists all kits owned by the current user, shows their status, and has a "Start a new kit" button.

**Step 2:** `POST /api/kits/create` — creates an empty `brand_kits` row owned by the user, initializes 9 rows in `stage_progress` (one per stage_0..stage_8 with status `empty` except stage_0 which is `in-progress`), returns the new kit's ID.

**Step 3:** Smoke test: log in, click "Start a new kit", verify a row appears in `brand_kits` and `stage_progress`.

**Step 4:** Commit:
```bash
git add web-app/app/dashboard/ web-app/app/api/kits/create/
git commit -m "feat(saas): dashboard + new kit creation endpoint"
```

---

### Task 4.2: Signup quota + hCaptcha on signup

**Files:**
- Modify: `web-app/app/login/page.tsx` (add hCaptcha widget)
- Create: `web-app/lib/quota.ts`
- Modify: `web-app/app/api/kits/create/route.ts` (enforce 3/month cap)

**Step 1:** Install hCaptcha React widget:
```bash
npm install @hcaptcha/react-hcaptcha
```

**Step 2:** Add the hCaptcha widget to the login form. Site key from env var. On submit, the form sends the captcha token to a server action that verifies it via hCaptcha's `siteverify` endpoint before calling `signInWithOtp`.

**Step 3:** Create `web-app/lib/quota.ts`:
```ts
import { getServiceClient } from "./supabase";

const FREE_TIER_LIMIT = 3;

export async function consumeInterviewQuota(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const svc = getServiceClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { data: row } = await svc
    .from("interview_quota")
    .select("current_month_count, current_month_start")
    .eq("user_id", userId)
    .single();

  // Reset if new month
  if (!row || new Date(row.current_month_start) < monthStart) {
    await svc.from("interview_quota").upsert({
      user_id: userId,
      current_month_count: 1,
      current_month_start: monthStart.toISOString().slice(0, 10),
    });
    return { allowed: true, remaining: FREE_TIER_LIMIT - 1 };
  }

  if (row.current_month_count >= FREE_TIER_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  await svc
    .from("interview_quota")
    .update({ current_month_count: row.current_month_count + 1 })
    .eq("user_id", userId);

  return { allowed: true, remaining: FREE_TIER_LIMIT - row.current_month_count - 1 };
}
```

**Step 4:** In `web-app/app/api/kits/create/route.ts`, call `consumeInterviewQuota(user.id)` BEFORE creating the kit. If `!allowed`, return 429 with a friendly error message.

**Step 5:** Smoke test: try to create 4 kits as the same user → fourth should be rejected with 429.

**Step 6:** Commit:
```bash
git add web-app/
git commit -m "feat(saas): hCaptcha on signup + 3-interviews/month quota"
```

---

### Task 4.3: Interview chat UI (split-pane)

**Files:**
- Create: `web-app/app/interview/[kitId]/page.tsx`
- Create: `web-app/app/interview/[kitId]/InterviewChat.tsx`
- Create: `web-app/app/interview/[kitId]/KitJsonView.tsx`

**Step 1:** Server component `page.tsx` — fetches the kit + messages + progress for the kitId, verifies ownership, renders the layout (left: `<InterviewChat>`, right: `<KitJsonView>`).

**Step 2:** Client component `InterviewChat.tsx`:
- State: `messages` (array), `input`, `streaming` (boolean), `currentStage`
- On submit: POST `/api/interview/stream` with `{kitId, message}`, read SSE response, update `messages` as deltas arrive
- After streaming completes: POST `/api/interview/check-gate` with `{kitId, stageId: currentStage}` to see if the gate passed
- If `passed`: advance `currentStage` to next stage, show a small "Stage X passed" toast
- If not: continue chatting in the same stage

**Step 3:** Client component `KitJsonView.tsx`:
- Receives the live `BrandKit` JSON as a prop (re-fetched after each gate pass)
- Renders each section with collapsed/expanded states
- Highlights the section that was just filled in (small green pulse)

**Step 4:** Manual smoke test:
- Log in → create kit → land on `/interview/<id>`
- Type a Stage 0 answer → see streaming response
- Verify the chat UI works
- Check that `stage_progress` advances when a gate passes

**Step 5:** Commit:
```bash
git add web-app/app/interview/
git commit -m "feat(saas): split-pane interview chat UI with streaming + gates"
```

---

### Task 4.4: Kit view + markdown download

**Files:**
- Create: `web-app/app/kit/[id]/page.tsx`
- Create: `web-app/app/api/kits/[id]/export-md/route.ts`

**Step 1:** `/kit/[id]/page.tsx` — read-only view of a completed kit with a "Download markdown" button that hits the export endpoint.

**Step 2:** `GET /api/kits/[id]/export-md` — verifies ownership, loads the kit JSONB, calls `exportToMarkdown()` from Phase 1, returns the markdown with `Content-Disposition: attachment` header.

**Step 3:** Smoke test: complete a kit, click download, verify the markdown file is structured.

**Step 4:** Commit:
```bash
git add web-app/app/kit/ web-app/app/api/kits/
git commit -m "feat(saas): kit view page + markdown export endpoint"
```

---

## Phase 5 — End-to-end verification

### Task 5.1: Complete the flow as a test user

**No code.** This is a manual end-to-end smoke test that exercises everything:

1. From the worktree root: `cd web-app && npm run dev`
2. Open http://localhost:3001
3. Click login → enter your real email → solve hCaptcha → submit
4. Receive magic link, click it
5. Land on `/dashboard`
6. Click "Start a new kit"
7. Land on `/interview/<id>`
8. Answer Stage 0: "We started as a small Spanish-speaking AI consultancy. We tried to scale by hiring junior strategists. We realized our edge was the partner-led model where every engagement is led by a founder."
9. Watch streaming response
10. Watch the gate check pass and advance to Stage 1
11. Continue through all 9 stages (~30 min if you write fast)
12. After Stage 8 passes, navigate to `/kit/<id>`
13. Click "Download markdown"
14. Open the downloaded `brand-kit.md` and verify all 9 sections are present with your data

**If any step fails:** STOP. Diagnose the failure, fix it (this might require new tasks). Do NOT proceed to merge until the e2e flow works.

### Task 5.2: Finishing the branch

**Use the `superpowers:finishing-a-development-branch` skill** to decide whether to merge to main, open a PR, or hold in the branch for more iteration.

---

## Critical files touched (summary)

| Path | Phase | Action |
|---|---|---|
| `web-app/` (entire folder) | 0 | Created |
| `web-app/tailwind.config.ts` | 0 | Copied from `web/` |
| `web-app/app/globals.css` | 0 | Copied from `web/` |
| `web-app/lib/types.ts` | 1 | Created — BrandKit type |
| `web-app/lib/schemas.ts` | 1 | Created — 9 stage Zod schemas + combined |
| `web-app/lib/schemas.test.ts` | 1 | Created — TDD tests |
| `web-app/lib/export-markdown.ts` | 1 | Created — markdown renderer |
| `web-app/.env.local.example` | 2 | Created |
| `web-app/lib/supabase.ts` | 2 | Created — client wrappers |
| `web-app/supabase/migrations/0001_initial.sql` | 2 | Created — Postgres schema |
| `web-app/middleware.ts` | 2 | Created — Supabase session refresh |
| `web-app/app/login/page.tsx` | 2, 4 | Created — magic-link form + hCaptcha |
| `web-app/app/auth/callback/route.ts` | 2 | Created — OAuth callback |
| `web-app/lib/openai.ts` | 3 | Created — OpenAI client wrapper |
| `web-app/lib/interview-prompt.ts` | 3 | Created — system prompt loader |
| `web-app/app/api/interview/stream/route.ts` | 3 | Created — streaming chat |
| `web-app/app/api/interview/check-gate/route.ts` | 3 | Created — Zod-extracted gate check |
| `web-app/app/dashboard/page.tsx` | 4 | Created — kit list |
| `web-app/app/api/kits/create/route.ts` | 4 | Created — kit creation w/ quota |
| `web-app/lib/quota.ts` | 4 | Created — 3/month enforcement |
| `web-app/app/interview/[kitId]/page.tsx` | 4 | Created — split-pane interview |
| `web-app/app/interview/[kitId]/InterviewChat.tsx` | 4 | Created — chat client component |
| `web-app/app/interview/[kitId]/KitJsonView.tsx` | 4 | Created — JSON pane |
| `web-app/app/kit/[id]/page.tsx` | 4 | Created — kit view |
| `web-app/app/api/kits/[id]/export-md/route.ts` | 4 | Created — markdown export |

**Untouched:** `web/` (the landing). Phase A does not modify the existing landing in any way.

---

## Things this plan deliberately leaves out

- **Brand manual generation** — Phase B
- **v0 site generation** — Phase C
- **GitHub repo + Vercel deploy** — Phase D
- **Domain purchase** — Phase E
- **Stripe** — Phase E
- **Multi-brand workspaces** — v2
- **Kit edit UI** — v1.5 (kits are read-only after completion in v1)
- **Resume an in-progress interview from a different device** — works for free via Supabase session, but not explicitly tested here
- **Email notifications when an interview is completed** — uses the existing landing's Resend setup if needed, not built here
- **Cost tracking per user** — visible in OpenAI dashboard for now, no in-app tracking

---

## Rollback plan

If Phase A goes south, this branch is fully isolated. Rollback options:

1. **Throw away the branch:** `cd ../../  && git worktree remove .worktrees/saas-phase-a && git branch -D feat/saas-phase-a` — main is untouched.
2. **Salvage the schemas:** `web-app/lib/schemas.ts` is pure TypeScript with no external deps; cherry-pick the commit if you want to keep the data model work.
3. **Salvage the SQL migration:** `web-app/supabase/migrations/0001_initial.sql` is portable; can be reused even if we change frameworks.

The Phase A work touches NOTHING outside `web-app/`, so the landing in `web/` is safe regardless.

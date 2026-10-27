# Batch 3 — v0 Site Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** After completing the 9-stage brand kit interview, a founder clicks "Generate site" and v0's API produces a full landing page using the brand kit data. The founder sees a live preview and can download the generated code.

**Architecture:** Use the v0 Platform API (`v0-sdk`) to programmatically generate a branded website. A new `site_generations` table tracks each generation attempt. A server-side prompt builder transforms the brand kit JSON into a v0 chat message with all brand decisions baked in. The `/kit/[id]/site` page shows the generated preview in an iframe and offers a download button. No custom Vercel deployment for the generated site — v0 handles hosting via `demoUrl`.

**Tech Stack:** v0-sdk (`v0-sdk` npm package), existing Supabase + Next.js 15 + TypeScript stack, existing Zod schemas for validation.

**Branch:** `feat/batch-3-v0-site` (new branch from `main`).

---

## Pre-flight checks

1. On `main`, clean working tree.
2. `web-app/.env.local` has `V0_API_KEY` set. If not, STOP and ask user to add it (get key from https://v0.app/chat/settings/keys — requires Premium/Team plan).
3. `npm run build` and `npm test` pass from `web-app/`.

---

## Task 1: Add site_generations persistence

**Files:**
- Create: `web-app/supabase/migrations/0005_site_generations.sql`
- Modify: `web-app/lib/types.ts`

**Step 1:** Create the migration:

```sql
-- 0005_site_generations.sql -- track v0 site generation attempts per kit
create table public.site_generations (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.brand_kits(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'completed', 'failed')),
  v0_project_id text,
  v0_chat_id text,
  v0_version_id text,
  demo_url text,
  generated_files jsonb default '[]'::jsonb,
  prompt_hash text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.site_generations(kit_id);
create index on public.site_generations(owner_id);

alter table public.site_generations enable row level security;
create policy "Users see own site generations" on public.site_generations for select
  using (auth.uid() = owner_id);
create policy "Users insert own site generations" on public.site_generations for insert
  with check (auth.uid() = owner_id);
create policy "Users update own site generations" on public.site_generations for update
  using (auth.uid() = owner_id);

create trigger site_generations_updated_at
  before update on public.site_generations
  for each row execute function public.touch_updated_at();
```

**Step 2:** Apply the migration via Supabase SQL Editor. Ask user to confirm.

**Step 3:** Add `SiteGeneration` type to `web-app/lib/types.ts`:

```ts
export type SiteGenerationStatus = "pending" | "generating" | "completed" | "failed";

export interface SiteGeneration {
  id: string;
  kitId: string;
  ownerId: string;
  status: SiteGenerationStatus;
  v0ProjectId: string | null;
  v0ChatId: string | null;
  v0VersionId: string | null;
  demoUrl: string | null;
  generatedFiles: Array<{ name: string; content: string }>;
  promptHash: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Step 4:** Run `npm run build` to verify types compile.

**Step 5:** Commit:
```bash
git add web-app/supabase/migrations/0005_site_generations.sql web-app/lib/types.ts
git commit -m "feat(saas): site_generations table + types for v0 site generation"
```

---

## Task 2: Build v0 prompt and response contract

**Files:**
- Create: `web-app/lib/v0-prompt.ts`
- Create: `web-app/lib/v0-prompt.test.ts`

**Step 1:** Write the test first in `web-app/lib/v0-prompt.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildV0SitePrompt } from "./v0-prompt";
import type { StoredKitData } from "./types";

const completeKit: StoredKitData = {
  beforeAfter: "We started as a small consultancy. We tried to scale by hiring. Then we realized our edge was the partner-led model.",
  enemy: "The billable-hour consultancy that optimizes for headcount, not outcomes.",
  stack: {
    character: "Partner-led precision",
    promise: "Decisions you can ship",
    method: "Founder on every engagement",
  },
  antiPositioning: [
    { statement: "We are not a staffing firm.", cost: "We refuse 80% of inbound leads that want bodies, not strategy." },
    { statement: "We don't do retainers.", cost: "We lose predictable MRR and must earn every project." },
    { statement: "We don't pitch.", cost: "We walk away from RFP processes that reward slides over proof." },
  ],
  icp: {
    primary: {
      signals: [
        "They say 'we've tried agencies before and it didn't stick'",
        "They have a clear revenue number but no clear positioning",
      ],
    },
  },
  voice: {
    principles: ["Direct", "Evidence-first", "No filler"],
    do: ["Use short sentences", "Lead with the number"],
    dont: ["Don't use 'leverage' as a verb", "Don't hedge"],
    writingRules: ["Max 20 words per sentence", "No passive voice"],
    beforeAfter: [{ old: "We leverage cutting-edge solutions", new: "We ship." }],
  },
  templates: {
    homepageHero: {
      eyebrow: "Strategy studio",
      h1: "Brands built against the grain.",
      subhead: "We help founders who refuse to blend in build the brand their market remembers.",
      ctaVariants: ["Start your kit"],
    },
    coldOutreach: {
      subjects: ["Quick question about [brand]"],
      body: "Hi — I saw what you're building.",
      signOff: "—Nacho",
    },
    socialBios: {
      linkedin: "Partner-led brand strategy studio.",
      twitter: "Brands built against the grain.",
      instagram: "Strategy studio for founders who refuse to blend in.",
    },
    firstMinute: { script: "Here's what we do.", wordCount: 150 },
    emailSignature: "Nacho Estevo · Acelera",
  },
  visual: {
    palette: [
      { name: "paper", hex: "#fafaf8", role: "background" },
      { name: "ink", hex: "#0b0f14", role: "primary" },
      { name: "accent", hex: "#0a6e3a", role: "accent" },
    ],
    typography: {
      display: { family: "Inter Tight", weights: [400, 500, 600, 700], source: "google" },
      body: { family: "Inter", weights: [400, 500], source: "google" },
    },
    characteristicComponents: [
      { name: "Split-tone hero", description: "Left text, right visual" },
    ],
    forbiddenVisuals: ["No stock photos", "No gradients", "No rounded buttons"],
    logoDirection: "A monogram in ink on paper, nothing decorative.",
  },
  rules: {
    outreach: [{ rule: "Never lead with a question.", reason: "Questions feel like a trap." }],
    salesMeeting: [{ rule: "Show the kit in the first 60 seconds.", reason: "Proof beats pitch." }],
    proposals: [{ rule: "No PDF over 5 pages.", reason: "Attention span." }],
    cases: [{ rule: "Lead with the number.", reason: "Numbers are the hook." }],
    visual: [{ rule: "No blue.", reason: "Every competitor is blue." }],
  },
};

describe("buildV0SitePrompt", () => {
  it("produces a non-empty prompt from a complete kit", () => {
    const prompt = buildV0SitePrompt(completeKit);
    expect(prompt.length).toBeGreaterThan(500);
  });

  it("includes the hero headline", () => {
    const prompt = buildV0SitePrompt(completeKit);
    expect(prompt).toContain("Brands built against the grain.");
  });

  it("includes palette hex values", () => {
    const prompt = buildV0SitePrompt(completeKit);
    expect(prompt).toContain("#fafaf8");
    expect(prompt).toContain("#0b0f14");
  });

  it("includes typography families", () => {
    const prompt = buildV0SitePrompt(completeKit);
    expect(prompt).toContain("Inter Tight");
    expect(prompt).toContain("Inter");
  });

  it("includes forbidden visuals", () => {
    const prompt = buildV0SitePrompt(completeKit);
    expect(prompt).toContain("No stock photos");
  });

  it("throws if kit is empty (no templates)", () => {
    expect(() => buildV0SitePrompt({} as StoredKitData)).toThrow();
  });
});
```

**Step 2:** Run `npm test` → expected FAIL.

**Step 3:** Implement `web-app/lib/v0-prompt.ts`:

```ts
import type { StoredKitData } from "./types";

export function buildV0SitePrompt(kit: StoredKitData): string {
  if (!kit.templates?.homepageHero) {
    throw new Error("Kit must have at least templates.homepageHero to generate a site.");
  }

  const hero = kit.templates.homepageHero;
  const palette = kit.visual?.palette ?? [];
  const typography = kit.visual?.typography;
  const forbidden = kit.visual?.forbiddenVisuals ?? [];
  const stackLines = kit.stack
    ? `Character: ${kit.stack.character}\nPromise: ${kit.stack.promise}\nMethod: ${kit.stack.method}`
    : "";
  const antiPosLines = kit.antiPositioning
    ?.map((a) => `- NOT: ${a.statement} (cost: ${a.cost})`)
    .join("\n") ?? "";
  const paletteLines = palette
    .map((p) => `- ${p.name}: ${p.hex} (role: ${p.role})`)
    .join("\n");
  const doLines = kit.voice?.do?.map((d) => `- ✓ ${d}`).join("\n") ?? "";
  const dontLines = kit.voice?.dont?.map((d) => `- ✗ ${d}`).join("\n") ?? "";
  const forbiddenLines = forbidden.map((f) => `- ${f}`).join("\n");
  const rulesLines = Object.entries(kit.rules ?? {})
    .flatMap(([, rules]) => (rules as Array<{ rule: string; reason: string }>).map((r) => `- ${r.rule}`))
    .join("\n");

  const displayFont = typography?.display?.family ?? "Inter";
  const bodyFont = typography?.body?.family ?? "Inter";
  const displayWeights = typography?.display?.weights ?? [400, 600];
  const bodyWeights = typography?.body?.weights ?? [400, 500];

  return `Build a single-page landing site for a brand using Next.js + Tailwind CSS. The site must be a complete, deployable Next.js app with App Router.

## Brand Identity

${kit.enemy ? `### Enemy\nThis brand exists to destroy: ${kit.enemy}\n` : ""}
${stackLines ? `### Brand Stack\n${stackLines}\n` : ""}
${antiPosLines ? `### Anti-positioning\n${antiPosLines}\n` : ""}

### Hero Section
- Eyebrow: ${hero.eyebrow}
- Headline (h1): ${hero.h1}
- Subheadline: ${hero.subhead}
- Primary CTA: ${hero.ctaVariants?.[0] ?? "Get started"}

${kit.beforeAfter ? `### Brand Story\n${kit.beforeAfter}\n` : ""}

## Visual Design

### Color Palette
${paletteLines}

### Typography
- Display font: ${displayFont} (weights: ${displayWeights.join(", ")})
- Body font: ${bodyFont} (weights: ${bodyWeights.join(", ")})
${typography?.mono ? `- Mono font: ${typography.mono.family}\n` : ""}

### Characteristic Components
${kit.visual?.characteristicComponents?.map((c) => `- ${c.name}: ${c.description}`).join("\n") ?? "None specified."}

### Logo Direction
${kit.visual?.logoDirection ?? "No direction specified."}

## Content Rules

### Voice — Do
${doLines}

### Voice — Don't
${dontLines}

### Forbidden Visuals
${forbiddenLines}

### Non-negotiable Rules
${rulesLines}

## Technical Requirements

- Use Google Fonts for ${displayFont} and ${bodyFont}
- Use the exact hex colors from the palette above as Tailwind custom colors
- Mobile-first responsive design
- Minimal animations — subtle, not distracting
- Include a footer with basic info
- The page should feel like a premium consultancy site, not a startup template
- No placeholder content — use the brand data above for all copy
- Import fonts via next/font/google

## Pages to Generate

Create a single \`app/page.tsx\` that serves as the complete landing page with these sections:
1. Hero (with headline, subheadline, CTA)
2. Brand story / about section
3. A section that illustrates the anti-positioning (what they're NOT)
4. Contact / CTA section
5. Minimal footer

Also generate \`app/layout.tsx\`, \`tailwind.config.ts\`, \`package.json\`, \`next.config.ts\`, \`app/globals.css\`, and \`tsconfig.json\`.

Produce a complete, working Next.js app. Do not use any external UI libraries — only Tailwind CSS.`;
}
```

**Step 4:** Run `npm test` → expected PASS.

**Step 5:** Commit:
```bash
git add web-app/lib/v0-prompt.ts web-app/lib/v0-prompt.test.ts
git commit -m "feat(saas): v0 site prompt builder — transforms brand kit into generation prompt"
```

---

## Task 3: Add centralized v0 client

**Files:**
- Create: `web-app/lib/v0-client.ts`

**Step 1:** Install the v0 SDK:
```bash
cd web-app && npm install v0-sdk
```

**Step 2:** Create `web-app/lib/v0-client.ts`:

```ts
import { V0 } from "v0-sdk";

let _client: V0 | null = null;

export function getV0Client(): V0 {
  if (!_client) {
    if (!process.env.V0_API_KEY) {
      throw new Error("V0_API_KEY is not set");
    }
    _client = new V0({ apiKey: process.env.V0_API_KEY });
  }
  return _client;
}
```

**Step 3:** Add `V0_API_KEY` to `web-app/.env.local.example`:
```
# v0 Platform API
V0_API_KEY=your-v0-api-key
```

**Step 4:** Run `npm run build` → expected: compiles.

**Step 5:** Commit:
```bash
git add web-app/lib/v0-client.ts web-app/package.json web-app/package-lock.json web-app/.env.local.example
git commit -m "feat(saas): centralized v0 client wrapper + v0-sdk dependency"
```

---

## Task 4: Add site generation APIs

**Files:**
- Create: `web-app/app/api/kits/[id]/generate-site/route.ts`
- Create: `web-app/app/api/kits/[id]/site-status/route.ts`

**Step 1:** Create the generate-site route handler at `web-app/app/api/kits/[id]/generate-site/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceClient } from "@/lib/supabase";
import { getV0Client } from "@/lib/v0-client";
import { buildV0SitePrompt } from "@/lib/v0-prompt";
import type { StoredKitData } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitId } = await params;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load the kit and verify ownership
  const { data: kitRow } = await supabase
    .from("brand_kits")
    .select("id, owner_id, status, kit")
    .eq("id", kitId)
    .single();

  if (!kitRow || kitRow.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify kit is completed (all 9 stages passed)
  const { data: progressRows } = await supabase
    .from("stage_progress")
    .select("stage_id, status")
    .eq("kit_id", kitId);

  const passedCount = (progressRows ?? []).filter(
    (r) => r.status === "passed",
  ).length;

  if (passedCount < 9) {
    return NextResponse.json(
      { error: `Kit is not complete (${passedCount}/9 stages passed). Complete all stages first.` },
      { status: 400 },
    );
  }

  const kitData = (kitRow.kit ?? {}) as StoredKitData;

  // Build the prompt
  let prompt: string;
  try {
    prompt = buildV0SitePrompt(kitData);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kit data insufficient for site generation" },
      { status: 400 },
    );
  }

  // Create a site_generations row in 'generating' state
  const svc = getServiceClient();
  const { data: generation, error: genErr } = await svc
    .from("site_generations")
    .insert({
      kit_id: kitId,
      owner_id: user.id,
      status: "generating",
      prompt_hash: prompt.length.toString(36),
    })
    .select("id")
    .single();

  if (genErr || !generation) {
    console.error("[generate-site] insert failed", genErr);
    return NextResponse.json(
      { error: "Failed to create generation record" },
      { status: 500 },
    );
  }

  // Call v0 API (fire and track — update the row on completion/failure)
  const generationId = generation.id;

  // Process asynchronously — return the generation ID immediately
  // The client will poll site-status for updates
  generateSiteAsync(generationId, prompt).catch((err) => {
    console.error("[generate-site] async generation failed", err);
  });

  return NextResponse.json({
    generationId,
    status: "generating",
  });
}

async function generateSiteAsync(generationId: string, prompt: string) {
  const svc = getServiceClient();

  try {
    const v0 = getV0Client();

    const chat = await v0.chats.create({
      message: prompt,
    });

    const latestVersion = chat.latestVersion;
    const demoUrl = latestVersion?.demoUrl ?? null;
    const files = latestVersion?.files?.map((f) => ({
      name: f.name,
      content: f.content,
    })) ?? [];

    await svc
      .from("site_generations")
      .update({
        status: "completed",
        v0_project_id: chat.projectId ?? null,
        v0_chat_id: chat.id,
        v0_version_id: latestVersion?.id ?? null,
        demo_url: demoUrl,
        generated_files: files,
      })
      .eq("id", generationId);
  } catch (err) {
    console.error("[generate-site] v0 call failed", err);
    await svc
      .from("site_generations")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : String(err),
      })
      .eq("id", generationId);
  }
}
```

**Step 2:** Create the site-status route at `web-app/app/api/kits/[id]/site-status/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitId } = await params;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the latest generation for this kit
  const { data: generation } = await supabase
    .from("site_generations")
    .select("id, status, demo_url, v0_chat_id, error_message, created_at")
    .eq("kit_id", kitId)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!generation) {
    return NextResponse.json({ status: "none" });
  }

  return NextResponse.json({
    generationId: generation.id,
    status: generation.status,
    demoUrl: generation.demo_url,
    chatId: generation.v0_chat_id,
    error: generation.error_message,
    createdAt: generation.created_at,
  });
}
```

**Step 3:** Run `npm run build` → expected: compiles.

**Step 4:** Commit:
```bash
git add web-app/app/api/kits/[id]/generate-site/ web-app/app/api/kits/[id]/site-status/
git commit -m "feat(saas): site generation + status polling API routes"
```

---

## Task 5: Build /kit/[id]/site page

**Files:**
- Create: `web-app/app/kit/[id]/site/page.tsx`
- Create: `web-app/app/kit/[id]/site/SitePreview.tsx`

**Step 1:** Create the server page at `web-app/app/kit/[id]/site/page.tsx`:

```tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getServerClient } from "@/lib/supabase";
import { SitePreview } from "./SitePreview";

export const dynamic = "force-dynamic";

export default async function SitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: kitRow } = await supabase
    .from("brand_kits")
    .select("id, owner_id, name, status")
    .eq("id", id)
    .single();

  if (!kitRow || kitRow.owner_id !== user.id) {
    notFound();
  }

  // Load the latest site generation
  const { data: generation } = await supabase
    .from("site_generations")
    .select("id, status, demo_url, error_message, created_at")
    .eq("kit_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Verify kit completion
  const { data: progressRows } = await supabase
    .from("stage_progress")
    .select("stage_id, status")
    .eq("kit_id", id);

  const passedCount = (progressRows ?? []).filter(
    (r) => r.status === "passed",
  ).length;

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <header className="border-b border-rule pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-4 block">Site generation</p>
            <h1 className="font-display text-[clamp(2rem,4.5vw,3.6rem)] font-semibold leading-[0.95] tracking-tightest text-ink">
              {kitRow.name}
            </h1>
            <p className="mt-4 text-base text-muted-strong">
              Generate a branded landing page from your brand kit data using AI.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/kit/${id}`}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Back to kit
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-10">
        <SitePreview
          kitId={id}
          passedCount={passedCount}
          generation={generation
            ? {
                id: generation.id,
                status: generation.status as "pending" | "generating" | "completed" | "failed",
                demoUrl: generation.demo_url,
                error: generation.error_message,
              }
            : null}
        />
      </section>
    </main>
  );
}
```

**Step 2:** Create the client component at `web-app/app/kit/[id]/site/SitePreview.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";

type GenerationStatus = "pending" | "generating" | "completed" | "failed";

type GenerationData = {
  id: string;
  status: GenerationStatus;
  demoUrl: string | null;
  error: string | null;
};

type Props = {
  kitId: string;
  passedCount: number;
  generation: GenerationData | null;
};

export function SitePreview({ kitId, passedCount, generation }: Props) {
  const [status, setStatus] = useState<GenerationStatus>(generation?.status ?? "none");
  const [demoUrl, setDemoUrl] = useState<string | null>(generation?.demoUrl ?? null);
  const [error, setError] = useState<string | null>(generation?.error ?? null);
  const [generating, setGenerating] = useState(false);

  const poll = useCallback(async () => {
    const res = await fetch(`/api/kits/${kitId}/site-status`);
    if (!res.ok) return;
    const data = await res.json();

    if (data.status === "none") {
      setStatus("none");
      return;
    }

    setStatus(data.status);
    setDemoUrl(data.demoUrl);
    setError(data.error);

    if (data.status === "generating" || data.status === "pending") {
      setTimeout(poll, 3000);
    }
  }, [kitId]);

  useEffect(() => {
    if (status === "generating" || status === "pending") {
      const interval = setInterval(poll, 4000);
      return () => clearInterval(interval);
    }
  }, [status, poll]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setStatus("generating");

    try {
      const res = await fetch(`/api/kits/${kitId}/generate-site`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        setStatus("failed");
        return;
      }

      setStatus("generating");
      poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setStatus("failed");
    } finally {
      setGenerating(false);
    }
  }

  if (passedCount < 9) {
    return (
      <div className="border border-dashed border-rule-strong bg-paper p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {passedCount} / 9 stages complete
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
          Complete your brand kit first
        </h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-sm text-muted-strong">
          You need to finish all 9 interview stages before generating a site.
          Return to the interview or kit view to continue.
        </p>
        <a
          href={`/interview/${kitId}`}
          className="btn-primary mt-6 inline-block px-6 py-3 text-sm"
        >
          Continue interview
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Generation controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={generating || status === "generating"}
          className="btn-primary px-6 py-3 text-sm"
        >
          {generating || status === "generating" ? "Generating..." : generation ? "Regenerate site" : "Generate site"}
        </button>

        {status === "generating" && (
          <p className="text-sm text-muted-strong animate-pulse">
            v0 is building your site. This takes 30-90 seconds...
          </p>
        )}

        {status === "failed" && error && (
          <p className="text-sm text-red-600">Failed: {error}</p>
        )}
      </div>

      {/* Preview */}
      {status === "completed" && demoUrl && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-rule pb-4">
            <h2 className="font-display text-xl font-semibold text-ink">
              Live preview
            </h2>
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2 text-sm"
            >
              Open in new tab
            </a>
          </div>

          <div className="border border-rule-strong bg-paper-pure overflow-hidden shadow-[0_8px_28px_rgba(11,15,20,0.05)]">
            <iframe
              src={demoUrl}
              className="w-full border-0"
              style={{ height: "80vh" }}
              title="Generated site preview"
            />
          </div>
        </div>
      )}

      {status === "completed" && !demoUrl && (
        <div className="border border-rule-strong bg-paper p-8 text-center">
          <p className="text-sm text-muted-strong">
            Site generated but no preview URL available. Check the v0 dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 3:** Run `npm run build` → expected: compiles.

**Step 4:** Commit:
```bash
git add web-app/app/kit/[id]/site/
git commit -m "feat(saas): /kit/[id]/site page with v0 preview iframe + polling"
```

---

## Task 6: Wire CTA from workspace

**Files:**
- Modify: `web-app/app/kit/[id]/page.tsx` (add "Generate site" button)
- Modify: `web-app/app/dashboard/page.tsx` (add "Generate site" link for completed kits)

**Step 1:** In `web-app/app/kit/[id]/page.tsx`, add a "Generate site" link in the header actions area (around line 100-114, near the existing "Download markdown" button). Add it inside the `isComplete` block:

```tsx
{isComplete && (
  <Link
    href={`/kit/${id}/site`}
    className="btn-primary px-5 py-3 text-sm sm:px-6 sm:py-3"
  >
    Generate site
  </Link>
)}
```

Place it BEFORE the "Download markdown" `<a>` tag so the primary CTA is site generation. The download button becomes secondary.

**Step 2:** In `web-app/app/dashboard/page.tsx`, add a "Generate site" link for completed kits. Inside the kit card's action area (around lines 113-128), add after the "View kit" link:

```tsx
{kit.status === "completed" || kit.status === "published" ? (
  <>
    <Link
      href={`/kit/${kit.id}`}
      className="btn-secondary px-4 py-2 text-sm"
    >
      View kit
    </Link>
    <Link
      href={`/kit/${kit.id}/site`}
      className="btn-primary px-4 py-2 text-sm"
    >
      Generate site
    </Link>
  </>
) : null}
```

**Step 3:** Run `npm run build` → expected: compiles.

**Step 4:** Commit:
```bash
git add web-app/app/kit/[id]/page.tsx web-app/app/dashboard/page.tsx
git commit -m "feat(saas): wire 'Generate site' CTA from kit view + dashboard"
```

---

## Task 7: Full verification and smoke test

**No new code.** This is a verification checkpoint.

**Step 1:** Run tests:
```bash
cd web-app && npm test
```
Expected: All tests pass (existing + new v0-prompt tests).

**Step 2:** Run build:
```bash
cd web-app && npm run build
```
Expected: `✓ Compiled successfully`.

**Step 3:** Run lint:
```bash
cd web-app && npm run lint
```
Expected: No errors.

**Step 4:** Manual smoke test (requires `V0_API_KEY` in `.env.local`):
```bash
cd web-app && npm run dev
```
1. Open http://localhost:3001 → login → go to dashboard
2. Find a completed kit (all 9 stages passed) → click "Generate site"
3. Verify the `/kit/[id]/site` page loads
4. Click "Generate site" button
5. Watch the polling spinner ("v0 is building your site...")
6. Wait for the iframe to appear with the generated site
7. Click "Open in new tab" to verify it works standalone

**If any step fails:** STOP. Diagnose, fix, commit the fix, re-verify.

**Step 5:** Final commit (if any fixes were needed):
```bash
git add -A
git commit -m "fix(saas): batch 3 smoke test fixes"
```

---

## Critical files touched (summary)

| Path | Task | Action |
|---|---|---|
| `web-app/supabase/migrations/0005_site_generations.sql` | 1 | Created — site_generations table |
| `web-app/lib/types.ts` | 1 | Modified — added SiteGeneration type |
| `web-app/lib/v0-prompt.ts` | 2 | Created — prompt builder |
| `web-app/lib/v0-prompt.test.ts` | 2 | Created — prompt builder tests |
| `web-app/lib/v0-client.ts` | 3 | Created — v0 SDK wrapper |
| `web-app/.env.local.example` | 3 | Modified — added V0_API_KEY |
| `web-app/app/api/kits/[id]/generate-site/route.ts` | 4 | Created — generation endpoint |
| `web-app/app/api/kits/[id]/site-status/route.ts` | 4 | Created — status polling endpoint |
| `web-app/app/kit/[id]/site/page.tsx` | 5 | Created — site preview page |
| `web-app/app/kit/[id]/site/SitePreview.tsx` | 5 | Created — preview client component |
| `web-app/app/kit/[id]/page.tsx` | 6 | Modified — added Generate site CTA |
| `web-app/app/dashboard/page.tsx` | 6 | Modified — added Generate site CTA |

---

## Decisions locked

| # | Decision | Choice |
|---|---|---|
| 1 | v0 hosting vs self-hosting | v0 handles hosting via `demoUrl`. No custom Vercel deployment of the generated site. |
| 2 | File download | Deferred. The generated files are stored in `site_generations.generated_files` JSONB. A download endpoint can be added later. |
| 3 | Regeneration | Allowed. Each click creates a new `site_generations` row. The UI shows the latest. |
| 4 | v0 SDK version | Use `v0-sdk` latest from npm. Requires Node 22+. |
| 5 | Async generation | Fire-and-forget pattern with polling. The API returns immediately with `generating` status; the client polls `site-status`. |
| 6 | Kit completion gate | Only completed kits (9/9 stages passed) can generate a site. |

---

## Out of scope (do NOT do in this batch)

- Download generated files as ZIP
- Custom domain mapping for generated sites
- Deployment of generated sites to the user's own Vercel
- Multiple page sites (single landing page only for v0)
- Template selection (always uses the same prompt structure)
- Saving/loading v0 chat history for iterative refinement
- Cost tracking per generation
- Rate limiting on site generation

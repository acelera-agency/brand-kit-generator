import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireKitRole } from "@/lib/kit-server";
import { ITERATION_TOKEN_ESTIMATE } from "@/lib/site-constants";
import { refundTokens, reserveTokens } from "@/lib/token-quota";
import { buildV0SitePrompt } from "@/lib/v0-prompt";
import type { StoredKitData } from "@/lib/types";
import type { GenerationSettings } from "@/app/kit/[id]/site/types";

const VALID_MODEL_IDS = ["v0-auto", "v0-mini", "v0-pro", "v0-max", "v0-max-fast"] as const;

function sanitizeSettings(raw: unknown): GenerationSettings {
  if (!raw || typeof raw !== "object") return {};
  const s = raw as Record<string, unknown>;
  const out: GenerationSettings = {};
  if (typeof s.modelId === "string" && VALID_MODEL_IDS.includes(s.modelId as typeof VALID_MODEL_IDS[number])) {
    out.modelId = s.modelId as GenerationSettings["modelId"];
  }
  if (typeof s.thinking === "boolean") out.thinking = s.thinking;
  if (typeof s.imageGenerations === "boolean") out.imageGenerations = s.imageGenerations;
  return out;
}

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitId } = await params;

  const body = await req.json().catch(() => ({}));
  const settings = sanitizeSettings(body?.settings);

  const access = await requireKitRole(kitId, "editor");
  if (!access.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!access.kit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (access.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: kitRow } = await access.supabase
    .from("brand_kits")
    .select("id, status, kit")
    .eq("id", kitId)
    .single();

  if (!kitRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: progressRows } = await access.supabase
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

  const { data: latestGeneration } = await access.supabase
    .from("site_generations")
    .select("status")
    .eq("kit_id", kitId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: "pending" | "generating" | "completed" | "failed" }>();

  if (latestGeneration?.status === "pending" || latestGeneration?.status === "generating") {
    return NextResponse.json(
      { error: "A site generation is already running for this kit" },
      { status: 409 },
    );
  }

  const kitData = (kitRow.kit ?? {}) as StoredKitData;

  let promptResult: Awaited<ReturnType<typeof buildV0SitePrompt>>;
  try {
    promptResult = buildV0SitePrompt(kitData);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kit data insufficient for site generation" },
      { status: 400 },
    );
  }

  const reservation = await reserveTokens(
    access.user.id,
    ITERATION_TOKEN_ESTIMATE,
  );
  if (!reservation.ok) {
    return NextResponse.json(
      { error: "Token quota exceeded" },
      { status: 402 },
    );
  }

  const svc = getServiceClient();
  const { data: generation, error: genErr } = await svc
    .from("site_generations")
    .insert({
      kit_id: kitId,
      owner_id: access.kit.ownerId,
      status: "generating",
      prompt_hash: promptResult.message.length.toString(36),
      generated_files: [],
      generation_settings: settings,
    })
    .select("id")
    .single();

  if (genErr || !generation) {
    await refundTokens(access.user.id, ITERATION_TOKEN_ESTIMATE);
    console.error("[generate-site] insert failed", genErr);
    return NextResponse.json(
      { error: "Failed to create generation record" },
      { status: 500 },
    );
  }

  const { error: iterationErr } = await svc.from("site_iterations").insert({
    generation_id: generation.id,
    kit_id: kitId,
    actor_id: access.user.id,
    turn_index: 0,
    status: "pending",
    tokens_charged: ITERATION_TOKEN_ESTIMATE,
  });

  if (iterationErr) {
    await refundTokens(access.user.id, ITERATION_TOKEN_ESTIMATE);
    await svc.from("site_generations").delete().eq("id", generation.id);
    return NextResponse.json(
      { error: "Failed to create iteration record" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    generationId: generation.id,
    status: "generating",
  });
}

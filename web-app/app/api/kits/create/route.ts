import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import type { BrandStage, SourceMaterialMeta } from "@/lib/types";

export const runtime = "nodejs";

const STAGE_IDS = [
  "stage_0",
  "stage_1",
  "stage_2",
  "stage_3",
  "stage_4",
  "stage_5",
  "stage_6",
  "stage_7",
  "stage_8",
] as const;

const ALLOWED_BRAND_STAGES: ReadonlySet<BrandStage> = new Set(["new", "existing"]);

function isBrandStage(value: unknown): value is BrandStage {
  return typeof value === "string" && ALLOWED_BRAND_STAGES.has(value as BrandStage);
}

function isSourceMaterialMeta(value: unknown): value is SourceMaterialMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as SourceMaterialMeta;
  return (
    Array.isArray(candidate.sources) &&
    typeof candidate.totalChars === "number" &&
    typeof candidate.truncated === "boolean" &&
    Array.isArray(candidate.warnings)
  );
}

export async function POST(req: NextRequest) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Body is optional for backwards compatibility — old clients without the
  // wizard would POST with no body, and we default to 'new' (the most
  // conservative choice — the stricter anti-fabrication gate-check rules
  // apply rather than the looser existing-brand ones).
  let brandStage: BrandStage = "new";
  let sourceMaterial: string | null = null;
  let sourceMaterialMeta: SourceMaterialMeta | null = null;
  try {
    const body = await req.json();
    if (body && typeof body === "object") {
      if ("brandStage" in body) {
        const candidate = (body as { brandStage: unknown }).brandStage;
        if (!isBrandStage(candidate)) {
          return NextResponse.json(
            { error: `Invalid brandStage: must be 'new' or 'existing'` },
            { status: 400 },
          );
        }
        brandStage = candidate;
      }

      if ("sourceMaterial" in body) {
        const candidate = (body as { sourceMaterial: unknown }).sourceMaterial;
        if (candidate !== null && typeof candidate !== "string") {
          return NextResponse.json(
            { error: "Invalid sourceMaterial: must be a string or null" },
            { status: 400 },
          );
        }

        sourceMaterial = candidate?.trim() ? candidate.trim() : null;
      }

      if ("sourceMaterialMeta" in body) {
        const candidate = (body as { sourceMaterialMeta: unknown }).sourceMaterialMeta;
        if (candidate !== null && !isSourceMaterialMeta(candidate)) {
          return NextResponse.json(
            { error: "Invalid sourceMaterialMeta payload" },
            { status: 400 },
          );
        }

        sourceMaterialMeta = candidate;
      }
    }
  } catch {
    // No body or invalid JSON — fall through to default 'new'.
  }

  // Create the kit row
  const { data: kit, error: kitErr } = await supabase
    .from("brand_kits")
    .insert({
      owner_id: user.id,
      status: "draft",
      kit: {},
      brand_stage: brandStage,
      source_material: sourceMaterial,
      source_material_meta: sourceMaterialMeta ?? {},
    })
    .select("id")
    .single();

  if (kitErr || !kit) {
    console.error("[kits/create] insert failed", kitErr);
    return NextResponse.json(
      { error: "Failed to create kit" },
      { status: 500 },
    );
  }

  // Seed the 9 stage_progress rows: stage_0 in-progress, rest empty
  const progressRows = STAGE_IDS.map((stage_id) => ({
    kit_id: kit.id,
    stage_id,
    status: stage_id === "stage_0" ? "in-progress" : "empty",
  }));

  const { error: progressErr } = await supabase
    .from("stage_progress")
    .insert(progressRows);

  if (progressErr) {
    console.error("[kits/create] stage_progress insert failed", progressErr);
    // Best-effort cleanup of the orphan kit
    await supabase.from("brand_kits").delete().eq("id", kit.id);
    return NextResponse.json(
      { error: "Failed to seed stage progress" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: kit.id });
}

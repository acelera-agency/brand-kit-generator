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

  let brandStage: BrandStage = "new";
  let sourceMaterial: string | null = null;
  let sourceMaterialMeta: SourceMaterialMeta | null = null;
  let name: string | null = null;
  try {
    const body = await req.json();
    if (body && typeof body === "object") {
      if ("name" in body) {
        const candidate = (body as { name: unknown }).name;
        if (typeof candidate !== "string") {
          return NextResponse.json(
            { error: "Invalid name: must be a string" },
            { status: 400 },
          );
        }
        name = candidate.trim();
      }

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
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!name) {
    return NextResponse.json(
      { error: "A name is required for the brand kit." },
      { status: 400 },
    );
  }
  if (name.length > 80) {
    return NextResponse.json(
      { error: "Name must be 80 characters or fewer." },
      { status: 400 },
    );
  }

  // Create the kit row
  const { data: kit, error: kitErr } = await supabase
    .from("brand_kits")
    .insert({
      owner_id: user.id,
      status: "draft",
      kit: {},
      name,
      brand_stage: brandStage,
      source_material: sourceMaterial,
      source_material_meta: sourceMaterialMeta ?? {},
    })
    .select("id")
    .single();

  if (kitErr || !kit) {
    // Postgres unique-violation surfaces as code 23505 — surface a clear
    // message so the wizard can prompt the user to pick a different name.
    if (kitErr?.code === "23505") {
      return NextResponse.json(
        { error: "You already have a brand kit with that name." },
        { status: 409 },
      );
    }
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

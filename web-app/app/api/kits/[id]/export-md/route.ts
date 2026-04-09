import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { exportToMarkdown } from "@/lib/export-markdown";
import type { BrandKit, BrandStage, StoredKitData } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch kit + verify ownership
  const { data: kitRow, error: kitErr } = await supabase
    .from("brand_kits")
    .select("id, owner_id, kit, created_at, updated_at, status, brand_stage")
    .eq("id", id)
    .single();

  if (kitErr || !kitRow || kitRow.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check completion: count how many stages are passed
  const { data: progress } = await supabase
    .from("stage_progress")
    .select("stage_id, status")
    .eq("kit_id", id);

  const passedCount =
    progress?.filter((p) => p.status === "passed").length ?? 0;
  if (passedCount < 9) {
    return NextResponse.json(
      {
        error: `Kit is not complete (${passedCount}/9 stages passed). Finish the interview before downloading.`,
      },
      { status: 400 },
    );
  }

  // Compose a BrandKit shape from the JSONB + row metadata.
  //
  // The JSONB stores stage slices at the top level (matching StoredKitData):
  // beforeAfter, enemy, stack, antiPositioning, icp, voice, templates, visual,
  // rules. The BrandKit interface that exportToMarkdown expects nests
  // beforeAfter under `context` (a Phase A schema decision). We re-nest it
  // here so the markdown renderer is happy without changing the JSONB shape.
  const kitData = (kitRow.kit ?? {}) as StoredKitData;
  const hydrated: BrandKit = {
    id: kitRow.id,
    ownerId: kitRow.owner_id,
    status: kitRow.status as BrandKit["status"],
    brandStage: ((kitRow.brand_stage as BrandStage | null) ?? "new"),
    createdAt: new Date(kitRow.created_at),
    updatedAt: new Date(kitRow.updated_at),
    stageProgress: Object.fromEntries(
      (progress ?? []).map((p) => [p.stage_id, p.status]),
    ) as BrandKit["stageProgress"],
    context: { beforeAfter: kitData.beforeAfter ?? "" },
    enemy: kitData.enemy ?? "",
    stack: kitData.stack as BrandKit["stack"],
    antiPositioning: (kitData.antiPositioning ?? []) as BrandKit["antiPositioning"],
    icp: kitData.icp as BrandKit["icp"],
    voice: kitData.voice as BrandKit["voice"],
    templates: kitData.templates as BrandKit["templates"],
    visual: kitData.visual as BrandKit["visual"],
    rules: kitData.rules as BrandKit["rules"],
  };

  let markdown: string;
  try {
    markdown = exportToMarkdown(hydrated);
  } catch (err) {
    console.error("[export-md] exportToMarkdown failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to render markdown: ${msg}` },
      { status: 500 },
    );
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="brand-kit-${id.slice(0, 8)}.md"`,
    },
  });
}

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

  const { data: kitRow } = await supabase
    .from("brand_kits")
    .select("id, owner_id, status, kit")
    .eq("id", kitId)
    .single();

  if (!kitRow || kitRow.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  let prompt: string;
  try {
    prompt = buildV0SitePrompt(kitData);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kit data insufficient for site generation" },
      { status: 400 },
    );
  }

  const svc = getServiceClient();
  const { data: generation, error: genErr } = await svc
    .from("site_generations")
    .insert({
      kit_id: kitId,
      owner_id: user.id,
      status: "generating",
      prompt_hash: prompt.length.toString(36),
      generated_files: [],
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

  return NextResponse.json({
    generationId: generation.id,
    status: "generating",
  });
}

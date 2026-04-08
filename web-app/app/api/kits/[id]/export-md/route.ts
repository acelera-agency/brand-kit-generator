import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { exportToMarkdown } from "@/lib/export-markdown";
import type { BrandKit } from "@/lib/types";

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
    .select("id, owner_id, kit, created_at, updated_at, status")
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
  // The JSONB only stores the stage outputs; we hydrate ownership/timestamp
  // fields from the row so exportToMarkdown is happy.
  const kitData = (kitRow.kit ?? {}) as Record<string, unknown>;
  const hydrated: BrandKit = {
    id: kitRow.id,
    ownerId: kitRow.owner_id,
    status: kitRow.status as BrandKit["status"],
    createdAt: new Date(kitRow.created_at),
    updatedAt: new Date(kitRow.updated_at),
    stageProgress: Object.fromEntries(
      (progress ?? []).map((p) => [p.stage_id, p.status]),
    ) as BrandKit["stageProgress"],
    ...(kitData as Omit<
      BrandKit,
      "id" | "ownerId" | "status" | "createdAt" | "updatedAt" | "stageProgress"
    >),
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

import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

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

export async function POST() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create the kit row
  const { data: kit, error: kitErr } = await supabase
    .from("brand_kits")
    .insert({
      owner_id: user.id,
      status: "draft",
      kit: {},
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

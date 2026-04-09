import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(
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

  // RLS already restricts deletes to the owner, but we double-check the
  // row exists and belongs to this user so we can return a 404 instead of
  // a silent success when somebody hits a stale id.
  const { data: existing, error: lookupErr } = await supabase
    .from("brand_kits")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (lookupErr) {
    console.error("[kits/delete] lookup failed", lookupErr);
    return NextResponse.json(
      { error: "Failed to delete kit" },
      { status: 500 },
    );
  }
  if (!existing || existing.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: deleteErr } = await supabase
    .from("brand_kits")
    .delete()
    .eq("id", id);

  if (deleteErr) {
    console.error("[kits/delete] delete failed", deleteErr);
    return NextResponse.json(
      { error: "Failed to delete kit" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

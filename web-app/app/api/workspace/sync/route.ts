import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { loadWorkspaceSnapshot } from "../_shared";

export async function POST(req: NextRequest) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { kitId } = (await req.json()) as { kitId?: string };
  if (!kitId) {
    return NextResponse.json({ error: "Missing kitId" }, { status: 400 });
  }

  const { data: kit } = await supabase
    .from("brand_kits")
    .select("id, owner_id")
    .eq("id", kitId)
    .single();
  if (!kit || kit.owner_id !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  return NextResponse.json(await loadWorkspaceSnapshot(supabase, kitId));
}

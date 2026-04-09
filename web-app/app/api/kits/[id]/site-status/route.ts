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

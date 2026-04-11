import { NextRequest, NextResponse } from "next/server";
import { requireKitRole } from "@/lib/kit-server";
import { fetchInitialHistory } from "@/lib/v0-client";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitId } = await params;

  const access = await requireKitRole(kitId, "viewer");
  if (!access.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!access.kit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (access.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: generation } = await access.supabase
    .from("site_generations")
    .select("id, v0_chat_id, status")
    .eq("kit_id", kitId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; v0_chat_id: string | null; status: string }>();

  if (!generation || !generation.v0_chat_id || generation.v0_chat_id === "pending") {
    return NextResponse.json({ messages: [] });
  }

  try {
    const v0Messages = await fetchInitialHistory(generation.v0_chat_id);

    return NextResponse.json({
      messages: v0Messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("[chat-history] fetch failed", err);
    return NextResponse.json({ messages: [] });
  }
}

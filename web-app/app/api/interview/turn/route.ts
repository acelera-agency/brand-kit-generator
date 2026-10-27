import { NextResponse } from "next/server";
import { submitFounderTurn } from "@/lib/founder-turn";
import { getServerClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { kitId, message } = body as { kitId?: unknown; message?: unknown };
  if (typeof kitId !== "string" || !kitId) {
    return NextResponse.json({ error: "kitId is required." }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const { data: kit } = await supabase
    .from("brand_kits")
    .select("id, owner_id")
    .eq("id", kitId)
    .single<{ id: string; owner_id: string }>();
  if (!kit || kit.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await submitFounderTurn({
      supabase,
      kitId,
      userId: user.id,
      message,
      source: "ui",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[interview/turn] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit turn." },
      { status: 500 },
    );
  }
}

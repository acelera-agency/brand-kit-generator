import { NextRequest, NextResponse } from "next/server";
import { requireKitRole } from "@/lib/kit-server";
import { insertNextSiteIteration } from "@/lib/site-iterations";
import { ITERATION_TOKEN_ESTIMATE } from "@/lib/site-constants";
import { refundTokens, reserveTokens } from "@/lib/token-quota";

type GenerationRow = {
  id: string;
  status: "pending" | "generating" | "completed" | "failed";
  v0_chat_id: string | null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitId } = await params;

  const access = await requireKitRole(kitId, "editor");
  if (!access.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!access.kit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (access.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const message = String(body?.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const { data: generation } = await access.supabase
    .from("site_generations")
    .select("id, status, v0_chat_id")
    .eq("kit_id", kitId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<GenerationRow>();

  if (!generation || generation.status !== "completed" || !generation.v0_chat_id || generation.v0_chat_id === "pending") {
    return NextResponse.json(
      { error: "Generate the site before iterating on it" },
      { status: 409 },
    );
  }

  const reservation = await reserveTokens(access.user.id, ITERATION_TOKEN_ESTIMATE);
  if (!reservation.ok) {
    return NextResponse.json(
      { error: "Token quota exceeded" },
      { status: 402 },
    );
  }

  let iteration: { id: string; turn_index: number } | null = null;

  try {
    iteration = await insertNextSiteIteration({
      generationId: generation.id,
      kitId,
      actorId: access.user.id,
      userMessage: message,
      status: "pending",
      tokensCharged: ITERATION_TOKEN_ESTIMATE,
      sourceChatId: generation.v0_chat_id,
    });
  } catch {
    await refundTokens(access.user.id, ITERATION_TOKEN_ESTIMATE);
    return NextResponse.json(
      { error: "Failed to create iteration" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      iterationId: iteration.id,
      turnIndex: iteration.turn_index,
      status: "pending",
    },
    { status: 202 },
  );
}

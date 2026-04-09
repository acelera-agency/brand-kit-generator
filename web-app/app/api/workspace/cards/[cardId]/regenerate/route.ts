import { NextRequest, NextResponse } from "next/server";
import { MODEL_INTERVIEW, getOpenAI } from "@/lib/openai";
import { buildInterviewMessages } from "@/lib/interview-prompt";
import { getServerClient } from "@/lib/supabase";
import type { BrandStage } from "@/lib/types";
import { isStageId, loadWorkspaceSnapshot } from "../../../_shared";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await context.params;
  if (!isStageId(cardId)) {
    return NextResponse.json({ error: "Unknown card" }, { status: 400 });
  }

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
    .select("id, owner_id, brand_stage, source_material")
    .eq("id", kitId)
    .single();
  if (!kit || kit.owner_id !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: history } = await supabase
    .from("interview_messages")
    .select("role, content")
    .eq("kit_id", kitId)
    .order("created_at", { ascending: true });

  const conversationHistory = (history ?? [])
    .filter(
      (message): message is { role: "user" | "assistant"; content: string } =>
        message.role === "user" || message.role === "assistant",
    )
    .map((message) => ({ role: message.role, content: message.content }));

  const openai = getOpenAI();
  const interviewMessages = buildInterviewMessages({
    currentStageId: cardId,
    brandStage: (kit.brand_stage as BrandStage | null) ?? "new",
    sourceMaterial:
      typeof kit.source_material === "string" ? kit.source_material : null,
    conversationHistory,
  });

  const completion = await openai.chat.completions.create({
    model: MODEL_INTERVIEW,
    messages: interviewMessages as never,
  });

  const assistantContent = completion.choices[0]?.message?.content?.trim();
  if (!assistantContent) {
    return NextResponse.json(
      { error: "Generator returned an empty draft" },
      { status: 502 },
    );
  }

  await supabase.from("interview_messages").insert({
    kit_id: kitId,
    role: "assistant",
    content: assistantContent,
    stage_id: cardId,
  });

  return NextResponse.json(await loadWorkspaceSnapshot(supabase, kitId));
}

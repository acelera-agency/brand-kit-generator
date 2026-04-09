import { NextRequest } from "next/server";
import { getOpenAI, MODEL_INTERVIEW } from "@/lib/openai";
import { buildInterviewMessages } from "@/lib/interview-prompt";
import { getServerClient } from "@/lib/supabase";
import { STAGE_ORDER } from "@/lib/stage-requirements";
import type { BrandStage } from "@/lib/types";

// Force Node.js runtime — the OpenAI SDK uses Node APIs that don't work in Edge.
export const runtime = "nodejs";

type InterviewMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { kitId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { kitId, message } = body;
  if (!kitId || !message) {
    return new Response("Missing kitId or message", { status: 400 });
  }

  // Verify the kit belongs to the user and load its brand_stage
  const { data: kit, error: kitErr } = await supabase
    .from("brand_kits")
    .select("id, owner_id, brand_stage, source_material")
    .eq("id", kitId)
    .single();
  if (kitErr || !kit || kit.owner_id !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }
  const brandStage = (kit.brand_stage as BrandStage | null) ?? "new";

  // Determine current stage. Prefer the row marked in-progress; fall back to
  // the first stage that hasn't passed yet (so we don't keep tagging
  // messages with stage_0 after stage_0 has already passed); fall back to
  // the last stage if the kit is fully complete.
  const { data: progress } = await supabase
    .from("stage_progress")
    .select("stage_id, status")
    .eq("kit_id", kitId);
  const progressByStage = Object.fromEntries(
    (progress ?? []).map((p) => [p.stage_id, p.status]),
  );
  const inProgressStage = STAGE_ORDER.find(
    (s) => progressByStage[s] === "in-progress",
  );
  const firstNotPassed = STAGE_ORDER.find(
    (s) => progressByStage[s] !== "passed",
  );
  const currentStageId =
    inProgressStage ?? firstNotPassed ?? STAGE_ORDER[STAGE_ORDER.length - 1];

  // Persist user message
  await supabase.from("interview_messages").insert({
    kit_id: kitId,
    role: "user",
    content: message,
    stage_id: currentStageId,
  });

  // Load full conversation history for this kit (across stages)
  const { data: history } = await supabase
    .from("interview_messages")
    .select("role, content")
    .eq("kit_id", kitId)
    .order("created_at", { ascending: true });

  const conversationHistory: InterviewMessage[] = (history ?? [])
    .filter((h): h is { role: "user" | "assistant"; content: string } =>
      h.role === "user" || h.role === "assistant",
    )
    .map((h) => ({ role: h.role, content: h.content }));

  const messages = buildInterviewMessages({
    currentStageId,
    brandStage,
    sourceMaterial:
      typeof kit.source_material === "string" ? kit.source_material : null,
    conversationHistory,
  });

  const openai = getOpenAI();
  const encoder = new TextEncoder();
  let assistantContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const runner = openai.chat.completions.stream({
          model: MODEL_INTERVIEW,
          // The SDK's message types accept our shape, but TS strict mode
          // fights us on the union narrowing — cast at the boundary.
          messages: messages as Parameters<
            typeof openai.chat.completions.stream
          >[0]["messages"],
        });

        runner.on("content", (delta: string) => {
          assistantContent += delta;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`),
          );
        });

        // Wait for the stream to fully complete before persisting.
        await runner.finalChatCompletion();

        // Persist final assistant message
        await supabase.from("interview_messages").insert({
          kit_id: kitId,
          role: "assistant",
          content: assistantContent,
          stage_id: currentStageId,
        });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
        );
        controller.close();
      } catch (err) {
        console.error("[interview/stream]", err);
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

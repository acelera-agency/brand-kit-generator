import { NextRequest } from "next/server";
import { getOpenAI, MODEL_INTERVIEW } from "@/lib/openai";
import { buildInterviewMessages } from "@/lib/interview-prompt";
import { getServerClient } from "@/lib/supabase";

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

  // Verify the kit belongs to the user
  const { data: kit, error: kitErr } = await supabase
    .from("brand_kits")
    .select("id, owner_id")
    .eq("id", kitId)
    .single();
  if (kitErr || !kit || kit.owner_id !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  // Determine current stage (the one marked in-progress, fallback stage_0)
  const { data: progress } = await supabase
    .from("stage_progress")
    .select("stage_id, status")
    .eq("kit_id", kitId);
  const currentStageId =
    progress?.find((p) => p.status === "in-progress")?.stage_id ?? "stage_0";

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

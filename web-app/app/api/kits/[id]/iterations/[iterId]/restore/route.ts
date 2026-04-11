import { NextRequest, NextResponse } from "next/server";
import { requireKitRole } from "@/lib/kit-server";
import { insertNextSiteIteration } from "@/lib/site-iterations";
import { getServiceClient } from "@/lib/supabase";
import { extractChatOutput, getV0Client } from "@/lib/v0-client";

type GenerationRow = {
  id: string;
  v0_chat_id: string | null;
};

type IterationRow = {
  id: string;
  generation_id: string;
  turn_index: number;
  source_chat_id: string | null;
  v0_version_id: string | null;
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; iterId: string }> },
) {
  const { id: kitId, iterId } = await params;

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

  const { data: generation } = await access.supabase
    .from("site_generations")
    .select("id, v0_chat_id")
    .eq("kit_id", kitId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<GenerationRow>();

  if (!generation || !generation.v0_chat_id || generation.v0_chat_id === "pending") {
    return NextResponse.json(
      { error: "Generate the site before restoring a version" },
      { status: 409 },
    );
  }

  const svc = getServiceClient();
  const { data: iteration } = await svc
    .from("site_iterations")
    .select("id, generation_id, turn_index, source_chat_id, v0_version_id")
    .eq("id", iterId)
    .eq("generation_id", generation.id)
    .maybeSingle<IterationRow>();

  if (!iteration) {
    return NextResponse.json({ error: "Iteration not found" }, { status: 404 });
  }

  if (!iteration.v0_version_id) {
    return NextResponse.json(
      { error: "This iteration does not have a restorable version" },
      { status: 400 },
    );
  }

  const forkSourceChatId = iteration.source_chat_id ?? generation.v0_chat_id;
  const forkedChat = await getV0Client().chats.fork({
    chatId: forkSourceChatId,
    versionId: iteration.v0_version_id,
  });
  const restored = extractChatOutput(forkedChat);

  await svc
    .from("site_generations")
    .update({
      status: "completed",
      error_message: null,
      v0_project_id: restored.projectId,
      v0_chat_id: restored.chatId,
      v0_version_id: restored.versionId,
      demo_url: restored.demoUrl,
      generated_files: restored.files,
    })
    .eq("id", generation.id);
  const restoreMessage = `(restored v${iteration.turn_index + 1})`;

  const restoreRow = await insertNextSiteIteration({
    generationId: generation.id,
    kitId,
    actorId: access.user.id,
    userMessage: restoreMessage,
    status: "completed",
    tokensCharged: 0,
    usageSyncedAt: new Date().toISOString(),
    versionId: restored.versionId,
    demoUrl: restored.demoUrl,
    sourceChatId: restored.chatId,
  });

  return NextResponse.json({
    iterationId: restoreRow.id,
    turnIndex: restoreRow.turn_index,
    status: "completed",
    demoUrl: restored.demoUrl,
    versionId: restored.versionId,
  });
}

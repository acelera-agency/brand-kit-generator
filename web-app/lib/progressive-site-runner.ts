import { buildProgressiveInitialSitePrompt, buildProgressiveStageIterationPrompt } from "./progressive-v0-prompt";
import { loadKitData } from "./progressive-site-data";
import type { GenerationRow, IterationRow } from "./progressive-site-core";
import { getServiceClient } from "./supabase";
import { refundTokens, syncUsageForIteration } from "./token-quota";
import type { LiveSiteStatus } from "./types";
import { extractChatOutput, getV0Client, sendIterationMessage } from "./v0-client";

export async function executeInitialGeneration(
  kitId: string,
  generation: GenerationRow,
  iteration: IterationRow,
): Promise<LiveSiteStatus> {
  const svc = getServiceClient();

  try {
    const kit = await loadKitData(kitId);
    const prompt = buildProgressiveInitialSitePrompt(kit);
    const chat = await getV0Client().chats.create({
      message: prompt.message,
      system: prompt.system,
      modelConfiguration: { modelId: "v0-mini" },
      responseMode: "sync",
    });

    if (chat instanceof ReadableStream) {
      throw new Error("v0 returned a stream when a sync response was required");
    }

    const output = extractChatOutput(chat);
    await svc
      .from("site_generations")
      .update({
        status: "completed",
        error_message: null,
        v0_project_id: output.projectId,
        v0_chat_id: output.chatId,
        v0_version_id: output.versionId,
        demo_url: output.demoUrl,
        generated_files: output.files,
      })
      .eq("id", generation.id);

    await svc
      .from("site_iterations")
      .update({
        status: "completed",
        error_message: null,
        source_chat_id: output.chatId,
        v0_message_id: output.messageId,
        v0_version_id: output.versionId,
        demo_url: output.demoUrl,
      })
      .eq("id", iteration.id);

    if (iteration.actor_id && output.messageId) {
      void syncUsageForIteration(
        iteration.actor_id,
        iteration.id,
        output.chatId,
        output.messageId,
      ).catch(() => null);
    }

    return {
      status: "completed",
      generationId: generation.id,
      iterationId: iteration.id,
      sourceStageId: iteration.source_stage_id ?? undefined,
      demoUrl: output.demoUrl,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await svc.from("site_generations").update({ status: "failed", error_message: error }).eq("id", generation.id);
    await svc.from("site_iterations").update({ status: "failed", error_message: error }).eq("id", iteration.id);
    if (iteration.actor_id) {
      await refundTokens(iteration.actor_id, Number(iteration.tokens_charged ?? 0));
    }
    return {
      status: "failed",
      generationId: generation.id,
      iterationId: iteration.id,
      sourceStageId: iteration.source_stage_id ?? undefined,
      error,
    };
  }
}

export async function executeProgressiveIteration(
  kitId: string,
  generation: GenerationRow,
  iteration: IterationRow,
): Promise<LiveSiteStatus> {
  const svc = getServiceClient();
  const chatId = generation.v0_chat_id;
  if (!chatId || chatId === "pending") {
    return { status: "queued", generationId: generation.id, iterationId: iteration.id };
  }

  try {
    const kit = await loadKitData(kitId);
    const stageId = iteration.source_stage_id;
    if (!stageId) throw new Error("Missing source stage for progressive iteration");

    const prompt = buildProgressiveStageIterationPrompt(kit, stageId);
    const output = await sendIterationMessage(chatId, prompt.message, prompt.system, {
      modelId: "v0-auto",
    });

    await svc
      .from("site_generations")
      .update({
        status: "completed",
        error_message: null,
        v0_version_id: output.versionId,
        demo_url: output.demoUrl,
        generated_files: output.files,
      })
      .eq("id", generation.id);

    await svc
      .from("site_iterations")
      .update({
        status: "completed",
        error_message: null,
        source_chat_id: chatId,
        v0_message_id: output.messageId,
        v0_version_id: output.versionId,
        demo_url: output.demoUrl,
      })
      .eq("id", iteration.id);

    if (iteration.actor_id && output.messageId) {
      void syncUsageForIteration(iteration.actor_id, iteration.id, chatId, output.messageId).catch(() => null);
    }

    return {
      status: "completed",
      generationId: generation.id,
      iterationId: iteration.id,
      sourceStageId: iteration.source_stage_id ?? undefined,
      demoUrl: output.demoUrl,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await svc.from("site_generations").update({ error_message: error }).eq("id", generation.id);
    await svc.from("site_iterations").update({ status: "failed", error_message: error }).eq("id", iteration.id);
    if (iteration.actor_id) {
      await refundTokens(iteration.actor_id, Number(iteration.tokens_charged ?? 0));
    }
    return {
      status: "failed",
      generationId: generation.id,
      iterationId: iteration.id,
      sourceStageId: iteration.source_stage_id ?? undefined,
      demoUrl: generation.demo_url,
      error,
    };
  }
}

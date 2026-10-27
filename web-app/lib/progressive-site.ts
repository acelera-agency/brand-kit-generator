import { ITERATION_TOKEN_ESTIMATE } from "./site-constants";
import { insertNextSiteIteration } from "./site-iterations";
import { getServiceClient } from "./supabase";
import { refundTokens, reserveTokens } from "./token-quota";
import type { StageId } from "./stage-requirements";
import type { LiveSiteStatus, ProgressiveSiteQueueResult, StoredKitData } from "./types";
import {
  buildProgressiveInputHash,
  resolveProgressiveQueueIntent,
  toGenerationSnapshot,
  type QueueIntent,
} from "./progressive-site-core";
import {
  loadExistingIteration,
  loadLatestProgressiveIteration,
  loadPendingProgressiveIteration,
  loadProgressiveGeneration,
  lockPendingIteration,
} from "./progressive-site-data";
import {
  executeInitialGeneration,
  executeProgressiveIteration,
} from "./progressive-site-runner";

export { buildProgressiveInputHash, resolveProgressiveQueueIntent };

function liveStatusFromIntent(
  intent: QueueIntent,
  generationId?: string,
  sourceStageId?: StageId,
): ProgressiveSiteQueueResult {
  if (intent.action === "reuse-existing") {
    return {
      status: intent.status === "pending" ? "queued" : intent.status,
      generationId,
      iterationId: intent.iterationId,
      sourceStageId,
    };
  }

  if (intent.action === "pause" || intent.action === "failed" || intent.action === "skip") {
    return {
      status: intent.status,
      generationId,
      sourceStageId,
      error: intent.error ?? null,
    };
  }

  return {
    status: intent.status,
    generationId,
    sourceStageId,
  };
}

export async function queueProgressiveSiteUpdate(input: {
  kitId: string;
  ownerId: string;
  actorId: string;
  stageId: StageId;
  approvedKit: StoredKitData;
  sourceMessages?: string[];
}): Promise<ProgressiveSiteQueueResult> {
  const inputHash = buildProgressiveInputHash(
    input.approvedKit,
    input.stageId,
    input.sourceMessages,
  );
  const generation = await loadProgressiveGeneration(input.kitId);
  const existingIteration = generation
    ? await loadExistingIteration(generation.id, input.stageId, inputHash)
    : null;

  if (existingIteration) {
    return liveStatusFromIntent(
      resolveProgressiveQueueIntent({
        stageId: input.stageId,
        inputHash,
        generation: toGenerationSnapshot(generation),
        existingIteration,
        quotaReserved: true,
      }),
      generation?.id,
      input.stageId,
    );
  }

  if (!generation && input.stageId !== "stage_0") {
    return { status: "none", sourceStageId: input.stageId };
  }

  if (generation?.status === "failed") {
    return {
      status: "failed",
      generationId: generation.id,
      sourceStageId: input.stageId,
      error: generation.error_message,
    };
  }

  let reserved = false;
  try {
    const reservation = await reserveTokens(input.actorId, ITERATION_TOKEN_ESTIMATE);
    reserved = reservation.ok;
  } catch (err) {
    return {
      status: "paused",
      generationId: generation?.id,
      sourceStageId: input.stageId,
      error: err instanceof Error ? err.message : "Token quota exceeded",
    };
  }

  const intent = resolveProgressiveQueueIntent({
    stageId: input.stageId,
    inputHash,
    generation: toGenerationSnapshot(generation),
    existingIteration: null,
    quotaReserved: reserved,
  });

  if (intent.action !== "create-generation" && intent.action !== "insert-iteration") {
    return liveStatusFromIntent(intent, generation?.id, input.stageId);
  }

  const svc = getServiceClient();
  try {
    let generationId = generation?.id;
    if (intent.action === "create-generation") {
      const { data: created, error } = await svc
        .from("site_generations")
        .insert({
          kit_id: input.kitId,
          owner_id: input.ownerId,
          status: "generating",
          generation_mode: "progressive",
          prompt_hash: inputHash,
          generated_files: [],
          generation_settings: { modelId: intent.modelId },
        })
        .select("id")
        .single<{ id: string }>();

      if (error || !created) throw error ?? new Error("Failed to create progressive generation");
      generationId = created.id;
    }

    if (!generationId) throw new Error("Progressive generation was not created");

    const iteration = await insertNextSiteIteration(
      {
        generationId,
        kitId: input.kitId,
        actorId: input.actorId,
        status: "pending",
        tokensCharged: ITERATION_TOKEN_ESTIMATE,
        sourceChatId: generation?.v0_chat_id ?? null,
        sourceStageId: input.stageId,
        inputHash,
      },
      intent.action === "create-generation" ? 0 : 1,
    );

    return {
      status: "queued",
      generationId,
      iterationId: iteration.id,
      sourceStageId: input.stageId,
    };
  } catch (err) {
    if (reserved) await refundTokens(input.actorId, ITERATION_TOKEN_ESTIMATE);
    return {
      status: "paused",
      generationId: generation?.id,
      sourceStageId: input.stageId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getProgressiveSiteStatus(
  kitId: string,
): Promise<LiveSiteStatus> {
  const generation = await loadProgressiveGeneration(kitId);
  if (!generation) return { status: "none" };

  const latestIteration = await loadLatestProgressiveIteration(generation.id);
  if (latestIteration?.status === "pending") {
    return {
      status: "queued",
      generationId: generation.id,
      iterationId: latestIteration.id,
      sourceStageId: latestIteration.source_stage_id ?? undefined,
      demoUrl: generation.demo_url,
    };
  }

  if (latestIteration?.status === "running") {
    return {
      status: latestIteration.turn_index === 0 ? "generating" : "running",
      generationId: generation.id,
      iterationId: latestIteration.id,
      sourceStageId: latestIteration.source_stage_id ?? undefined,
      demoUrl: generation.demo_url,
    };
  }

  if (generation.status === "failed" || latestIteration?.status === "failed") {
    return {
      status: "failed",
      generationId: generation.id,
      iterationId: latestIteration?.id,
      sourceStageId: latestIteration?.source_stage_id ?? undefined,
      demoUrl: generation.demo_url,
      error: latestIteration?.error_message ?? generation.error_message,
    };
  }

  return {
    status: generation.status === "generating" ? "generating" : "completed",
    generationId: generation.id,
    iterationId: latestIteration?.id,
    sourceStageId: latestIteration?.source_stage_id ?? undefined,
    demoUrl: generation.demo_url,
    error: generation.error_message,
  };
}

export async function executeNextProgressiveSiteJob(
  kitId: string,
): Promise<LiveSiteStatus> {
  const generation = await loadProgressiveGeneration(kitId);
  if (!generation) return { status: "none" };

  if (generation.status === "failed") {
    return {
      status: "failed",
      generationId: generation.id,
      error: generation.error_message,
    };
  }

  const pending = await loadPendingProgressiveIteration(generation.id);
  if (!pending) return getProgressiveSiteStatus(kitId);

  const locked = await lockPendingIteration(pending);
  if (!locked) return getProgressiveSiteStatus(kitId);

  if (locked.turn_index === 0 || !generation.v0_chat_id || generation.v0_chat_id === "pending") {
    return executeInitialGeneration(kitId, generation, locked);
  }

  return executeProgressiveIteration(kitId, generation, locked);
}

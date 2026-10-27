import { createHash } from "node:crypto";
import type { StageId } from "./stage-requirements";
import type { SiteGenerationStatus, StoredKitData } from "./types";

export type ProgressiveGenerationSnapshot = {
  id: string;
  status: SiteGenerationStatus;
  v0ChatId: string | null;
};

export type ProgressiveIterationSnapshot = {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  inputHash: string | null;
};

export type QueueIntentInput = {
  stageId: StageId;
  inputHash: string;
  generation: ProgressiveGenerationSnapshot | null;
  existingIteration: ProgressiveIterationSnapshot | null;
  quotaReserved: boolean;
};

export type QueueIntent =
  | { action: "create-generation"; modelId: "v0-mini"; status: "queued" }
  | { action: "insert-iteration"; modelId: "v0-auto"; status: "queued" }
  | {
      action: "reuse-existing";
      status: ProgressiveIterationSnapshot["status"];
      iterationId: string;
    }
  | { action: "pause"; status: "paused"; error: string }
  | { action: "skip"; status: "none"; error?: string }
  | { action: "failed"; status: "failed"; error?: string };

export type GenerationRow = {
  id: string;
  status: SiteGenerationStatus;
  v0_chat_id: string | null;
  v0_project_id: string | null;
  v0_version_id: string | null;
  demo_url: string | null;
  generated_files?: Array<{ name: string; content: string }> | null;
  error_message: string | null;
  generation_settings?: Record<string, unknown> | null;
};

export type IterationRow = {
  id: string;
  generation_id: string;
  actor_id: string | null;
  turn_index: number;
  source_stage_id: StageId | null;
  input_hash: string | null;
  source_chat_id: string | null;
  user_message: string | null;
  v0_message_id: string | null;
  v0_version_id: string | null;
  demo_url: string | null;
  status: "pending" | "running" | "completed" | "failed";
  error_message: string | null;
  tokens_charged: number | string;
  usage_synced_at: string | null;
  created_at: string;
};

function stagePayload(kit: StoredKitData, stageId: StageId) {
  switch (stageId) {
    case "stage_0":
      return { beforeAfter: kit.beforeAfter ?? null };
    case "stage_1":
      return { enemy: kit.enemy ?? null };
    case "stage_2":
      return { stack: kit.stack ?? null };
    case "stage_3":
      return { antiPositioning: kit.antiPositioning ?? null };
    case "stage_4":
      return { icp: kit.icp ?? null };
    case "stage_5":
      return { voice: kit.voice ?? null };
    case "stage_6":
      return { templates: kit.templates ?? null };
    case "stage_7":
      return { visual: kit.visual ?? null };
    case "stage_8":
      return { rules: kit.rules ?? null };
  }
}

export function buildProgressiveInputHash(
  kit: StoredKitData,
  stageId: StageId,
  sourceMessages?: string[],
) {
  const source = sourceMessages
    ?.map((message) => message.trim())
    .filter(Boolean)
    .join("\n\n");

  return createHash("sha256")
    .update(JSON.stringify({
      stageId,
      payload: source ? { source } : stagePayload(kit, stageId),
    }))
    .digest("hex");
}

export function resolveProgressiveQueueIntent({
  stageId,
  generation,
  existingIteration,
  quotaReserved,
}: QueueIntentInput): QueueIntent {
  if (existingIteration) {
    return {
      action: "reuse-existing",
      status: existingIteration.status,
      iterationId: existingIteration.id,
    };
  }

  if (generation?.status === "failed") {
    return {
      action: "failed",
      status: "failed",
      error: "The current progressive draft failed. Start a new kit or retry after fixing v0 configuration.",
    };
  }

  if (!generation && stageId !== "stage_0") {
    return {
      action: "skip",
      status: "none",
      error: "The progressive draft starts after stage_0.",
    };
  }

  if (!quotaReserved) {
    return {
      action: "pause",
      status: "paused",
      error: "Token quota exceeded",
    };
  }

  if (!generation) {
    return { action: "create-generation", modelId: "v0-mini", status: "queued" };
  }

  return { action: "insert-iteration", modelId: "v0-auto", status: "queued" };
}

export function toGenerationSnapshot(
  row: GenerationRow | null,
): ProgressiveGenerationSnapshot | null {
  return row
    ? {
        id: row.id,
        status: row.status,
        v0ChatId: row.v0_chat_id,
      }
    : null;
}

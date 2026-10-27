import type { StageId } from "./stage-requirements";
import { getServiceClient } from "./supabase";
import type { StoredKitData } from "./types";
import type {
  GenerationRow,
  IterationRow,
  ProgressiveIterationSnapshot,
} from "./progressive-site-core";

const ITERATION_SELECT =
  "id, generation_id, actor_id, turn_index, source_stage_id, input_hash, source_chat_id, user_message, v0_message_id, v0_version_id, demo_url, status, error_message, tokens_charged, usage_synced_at, created_at";

export async function loadProgressiveGeneration(kitId: string) {
  const svc = getServiceClient();
  const { data } = await svc
    .from("site_generations")
    .select("id, status, v0_chat_id, v0_project_id, v0_version_id, demo_url, generated_files, error_message, generation_settings")
    .eq("kit_id", kitId)
    .eq("generation_mode", "progressive")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<GenerationRow>();

  return data ?? null;
}

export async function loadExistingIteration(
  generationId: string,
  stageId: StageId,
  inputHash: string,
) {
  const svc = getServiceClient();
  const { data } = await svc
    .from("site_iterations")
    .select("id, status, input_hash")
    .eq("generation_id", generationId)
    .eq("source_stage_id", stageId)
    .eq("input_hash", inputHash)
    .maybeSingle<ProgressiveIterationSnapshot>();

  return data ?? null;
}

export async function loadPendingProgressiveIteration(generationId: string) {
  const svc = getServiceClient();
  const { data } = await svc
    .from("site_iterations")
    .select(ITERATION_SELECT)
    .eq("generation_id", generationId)
    .eq("status", "pending")
    .not("source_stage_id", "is", null)
    .order("turn_index", { ascending: true })
    .limit(1)
    .maybeSingle<IterationRow>();

  return data ?? null;
}

export async function loadLatestProgressiveIteration(generationId: string) {
  const svc = getServiceClient();
  const { data } = await svc
    .from("site_iterations")
    .select(ITERATION_SELECT)
    .eq("generation_id", generationId)
    .not("source_stage_id", "is", null)
    .order("turn_index", { ascending: false })
    .limit(1)
    .maybeSingle<IterationRow>();

  return data ?? null;
}

export async function loadKitData(kitId: string) {
  const svc = getServiceClient();
  const { data } = await svc
    .from("brand_kits")
    .select("kit")
    .eq("id", kitId)
    .single<{ kit: StoredKitData | null }>();

  return (data?.kit ?? {}) as StoredKitData;
}

export async function lockPendingIteration(iteration: IterationRow) {
  const svc = getServiceClient();
  const { data } = await svc
    .from("site_iterations")
    .update({ status: "running" })
    .eq("id", iteration.id)
    .eq("status", "pending")
    .select(ITERATION_SELECT)
    .maybeSingle<IterationRow>();

  return data ?? null;
}

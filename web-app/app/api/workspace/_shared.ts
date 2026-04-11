import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildWorkspaceState,
  type StageProgressStatus,
  type WorkspaceMessageRecord,
} from "@/lib/workspace-view";
import {
  getDraftCheckpoint,
  parseInspirationItems,
} from "@/lib/founder-experience";
import { STAGE_ORDER, type StageId } from "@/lib/stage-requirements";
import type {
  DraftCheckpoint,
  ExperienceMode,
  StoredKitData,
} from "@/lib/types";

export function isStageId(value: unknown): value is StageId {
  return typeof value === "string" && STAGE_ORDER.includes(value as StageId);
}

export async function loadWorkspaceSnapshot(
  supabase: SupabaseClient,
  kitId: string,
) {
  const [{ data: kitRow }, { data: progressRows }, { data: rawMessages }] =
    await Promise.all([
      supabase
        .from("brand_kits")
        .select(
          "kit, experience_mode, handoff_requested_at, draft_checkpoint, inspiration_items",
        )
        .eq("id", kitId)
        .single(),
      supabase
        .from("stage_progress")
        .select("stage_id, status")
        .eq("kit_id", kitId),
      supabase
        .from("interview_messages")
        .select("id, role, content, stage_id, created_at")
        .eq("kit_id", kitId)
        .order("created_at", { ascending: true }),
    ]);

  const progressByStage = Object.fromEntries(
    (progressRows ?? []).map((row) => [row.stage_id, row.status as StageProgressStatus]),
  ) as Partial<Record<StageId, StageProgressStatus>>;

  const messages: WorkspaceMessageRecord[] = ((rawMessages ?? []) as Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    stage_id: string;
    created_at: string;
  }>)
    .filter(
      (message): message is {
        id: string;
        role: "user" | "assistant";
        content: string;
        stage_id: StageId;
        created_at: string;
      } =>
        (message.role === "user" || message.role === "assistant") &&
        isStageId(message.stage_id),
    )
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      stageId: message.stage_id,
      createdAt: message.created_at,
    }));

  return {
    approvedKit: ((kitRow?.kit ?? {}) as StoredKitData) ?? {},
    experienceMode:
      ((kitRow?.experience_mode as ExperienceMode | null) ?? "guided"),
    handoffRequestedAt:
      typeof kitRow?.handoff_requested_at === "string"
        ? kitRow.handoff_requested_at
        : null,
    draftCheckpoint:
      ((kitRow?.draft_checkpoint as DraftCheckpoint | null) ??
        getDraftCheckpoint(progressByStage)),
    inspirationItems: parseInspirationItems(kitRow?.inspiration_items),
    progressByStage,
    workspaceState: buildWorkspaceState(messages, progressByStage),
  };
}

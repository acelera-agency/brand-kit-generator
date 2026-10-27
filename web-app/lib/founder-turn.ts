import type { SupabaseClient } from "@supabase/supabase-js";
import { approveStage, type StageApprovalResult } from "./stage-approval";
import { STAGE_ORDER, type StageId } from "./stage-requirements";
import type { LiveSiteStatus, StoredKitData } from "./types";
import { getVisiblePhase, getVisiblePhaseStatus, type VisiblePhase } from "./visible-phase";
import { loadWorkspaceSnapshot } from "./workspace-snapshot";
import { getActiveStageId, type StageProgressStatus, type WorkspaceState } from "./workspace-view";

type WorkspaceSnapshot = {
  approvedKit: StoredKitData;
  progressByStage: Partial<Record<StageId, StageProgressStatus>>;
  workspaceState: WorkspaceState;
  draftCheckpoint?: "none" | "foundation" | "positioning" | "final";
};

export type SubmitFounderTurnInput = {
  supabase?: SupabaseClient;
  kitId: string;
  userId: string;
  message: string;
  source: "ui" | "agent";
};

export type SubmitFounderTurnResult = {
  assistantMessage: string;
  appliedStages: StageId[];
  visiblePhase: VisiblePhase;
  visiblePhaseStatus: string;
  approvedKit: StoredKitData;
  progressByStage: Partial<Record<StageId, StageProgressStatus>>;
  workspaceState: WorkspaceState;
  draftCheckpoint?: "none" | "foundation" | "positioning" | "final";
  liveSite: LiveSiteStatus | null;
  nextPrompt: string | null;
};

export type SubmitFounderTurnDeps = {
  loadSnapshot: (input: SubmitFounderTurnInput) => Promise<WorkspaceSnapshot>;
  insertUserMessage: (input: SubmitFounderTurnInput & { stageId: StageId }) => Promise<void>;
  approveStage: (
    input: SubmitFounderTurnInput & {
      stageId: StageId;
      sourceMessages: string[];
    },
  ) => Promise<StageApprovalResult>;
};

function nextStageId(stageId: StageId): StageId | null {
  const index = STAGE_ORDER.indexOf(stageId);
  return index >= 0 && index < STAGE_ORDER.length - 1
    ? STAGE_ORDER[index + 1]
    : null;
}

function buildAssistantMessage(appliedStages: StageId[], nextPrompt: string | null) {
  if (appliedStages.length === 0) {
    return nextPrompt
      ? `I need one sharper detail before updating the draft: ${nextPrompt}`
      : "I need one sharper detail before updating the draft.";
  }

  const stageCopy = appliedStages.length === 1 ? "one signal" : `${appliedStages.length} signals`;
  return nextPrompt
    ? `Captured ${stageCopy} and updated the working draft. Next, sharpen this: ${nextPrompt}`
    : `Captured ${stageCopy}. The working draft is updating from this conversation.`;
}

function defaultDeps(): SubmitFounderTurnDeps {
  return {
    loadSnapshot: async ({ supabase, kitId }) => {
      if (!supabase) throw new Error("Supabase client is required");
      return loadWorkspaceSnapshot(supabase, kitId);
    },
    insertUserMessage: async ({ supabase, kitId, stageId, message }) => {
      if (!supabase) throw new Error("Supabase client is required");
      const { error } = await supabase.from("interview_messages").insert({
        kit_id: kitId,
        role: "user",
        content: message.trim(),
        stage_id: stageId,
      });
      if (error) throw error;
    },
    approveStage: async ({ supabase, kitId, userId, stageId, sourceMessages }) => {
      if (!supabase) throw new Error("Supabase client is required");
      return approveStage({
        supabase,
        kitId,
        userId,
        stageId,
        sourceMessages,
        logPrefix: "[founder-turn]",
      });
    },
  };
}

export async function submitFounderTurn(
  input: SubmitFounderTurnInput,
  deps: SubmitFounderTurnDeps = defaultDeps(),
): Promise<SubmitFounderTurnResult> {
  const message = input.message.trim();
  if (!message) {
    throw new Error("Message is required");
  }

  const initialSnapshot = await deps.loadSnapshot(input);
  const activeStageId = getActiveStageId(initialSnapshot.progressByStage);
  await deps.insertUserMessage({ ...input, message, stageId: activeStageId });

  const appliedStages: StageId[] = [];
  let latestSnapshot: WorkspaceSnapshot = initialSnapshot;
  let liveSite: LiveSiteStatus | null = null;
  let nextPrompt: string | null = null;
  const sourceMessages = [message];
  let stageId: StageId | null = activeStageId;

  for (let attempts = 0; attempts < 3 && stageId; attempts += 1) {
    const result = await deps.approveStage({
      ...input,
      message,
      stageId,
      sourceMessages,
    });

    if (!result.passed) {
      nextPrompt = result.reason;
      break;
    }

    appliedStages.push(stageId);
    latestSnapshot = {
      approvedKit: result.approvedKit,
      progressByStage: result.progressByStage,
      workspaceState: result.workspaceState,
      draftCheckpoint: result.draftCheckpoint,
    };
    liveSite = result.liveSite;
    stageId = nextStageId(stageId);
  }

  const visiblePhase = getVisiblePhase(latestSnapshot.progressByStage);
  return {
    assistantMessage: buildAssistantMessage(appliedStages, nextPrompt),
    appliedStages,
    visiblePhase,
    visiblePhaseStatus: getVisiblePhaseStatus(latestSnapshot.progressByStage),
    approvedKit: latestSnapshot.approvedKit,
    progressByStage: latestSnapshot.progressByStage,
    workspaceState: latestSnapshot.workspaceState,
    draftCheckpoint: latestSnapshot.draftCheckpoint,
    liveSite,
    nextPrompt,
  };
}

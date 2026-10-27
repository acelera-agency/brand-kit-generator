import { describe, expect, it } from "vitest";
import { submitFounderTurn, type SubmitFounderTurnDeps } from "./founder-turn";
import type { StageId } from "./stage-requirements";
import type { StoredKitData } from "./types";
import type { StageProgressStatus } from "./workspace-view";

function snapshot(
  progressByStage: Partial<Record<StageId, StageProgressStatus>>,
  approvedKit: StoredKitData = {},
) {
  return {
    approvedKit,
    progressByStage,
    workspaceState: {
      latestAssistantByStage: {},
      latestUserByStage: {},
      reviewedAssistantIdByStage: {},
    },
    draftCheckpoint: "none" as const,
    inspirationItems: [],
    experienceMode: "guided" as const,
    handoffRequestedAt: null,
  };
}

describe("submitFounderTurn", () => {
  it("persists a user turn, approves the active stage, and returns applied stages", async () => {
    const inserted: Array<{ stageId: StageId; message: string }> = [];
    const deps: SubmitFounderTurnDeps = {
      loadSnapshot: async () => snapshot({ stage_0: "in-progress" }),
      insertUserMessage: async ({ stageId, message }) => {
        inserted.push({ stageId, message });
      },
      approveStage: async ({ stageId }) =>
        stageId === "stage_0"
          ? {
              passed: true,
              gateResult: { data: { beforeAfter: "A useful contradiction." } },
              approvedKit: { beforeAfter: "A useful contradiction." },
              progressByStage: { stage_0: "passed", stage_1: "in-progress" },
              workspaceState: {
                latestAssistantByStage: {},
                latestUserByStage: {},
                reviewedAssistantIdByStage: {},
              },
              draftCheckpoint: "none",
              liveSite: { status: "queued", sourceStageId: "stage_0" },
            }
          : { passed: false, reason: "Need more signal." },
    };

    const result = await submitFounderTurn(
      {
        kitId: "kit_1",
        userId: "user_1",
        message: "The old way hides value inside a questionnaire.",
        source: "ui",
      },
      deps,
    );

    expect(inserted).toEqual([
      {
        stageId: "stage_0",
        message: "The old way hides value inside a questionnaire.",
      },
    ]);
    expect(result.appliedStages).toEqual(["stage_0"]);
    expect(result.liveSite?.status).toBe("queued");
    expect(result.visiblePhase.id).toBe("signal");
  });

  it("attempts at most three stages and stops on the first failed gate", async () => {
    const attempted: StageId[] = [];
    const deps: SubmitFounderTurnDeps = {
      loadSnapshot: async () => snapshot({ stage_0: "in-progress" }),
      insertUserMessage: async () => {},
      approveStage: async ({ stageId }) => {
        attempted.push(stageId);
        if (stageId === "stage_0" || stageId === "stage_1") {
          return {
            passed: true,
            gateResult: { data: {} },
            approvedKit: {},
            progressByStage: { [stageId]: "passed" },
            workspaceState: {
              latestAssistantByStage: {},
              latestUserByStage: {},
              reviewedAssistantIdByStage: {},
            },
            draftCheckpoint: "none",
            liveSite: { status: "queued", sourceStageId: stageId },
          };
        }
        return { passed: false, reason: "Need more detail for stack." };
      },
    };

    const result = await submitFounderTurn(
      {
        kitId: "kit_1",
        userId: "user_1",
        message: "This transcript contains more than one stage worth of signal.",
        source: "agent",
      },
      deps,
    );

    expect(attempted).toEqual(["stage_0", "stage_1", "stage_2"]);
    expect(result.appliedStages).toEqual(["stage_0", "stage_1"]);
    expect(result.nextPrompt).toBe("Need more detail for stack.");
  });
});

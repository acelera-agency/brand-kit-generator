import { STAGE_ORDER, type StageId } from "./stage-requirements";
import type { StageProgressStatus } from "./workspace-view";

export type VisiblePhaseId = "signal" | "positioning" | "system";

export type VisiblePhase = {
  id: VisiblePhaseId;
  label: "Signal" | "Positioning" | "System";
  stageIds: StageId[];
};

export const VISIBLE_PHASES: VisiblePhase[] = [
  { id: "signal", label: "Signal", stageIds: ["stage_0", "stage_1", "stage_2"] },
  {
    id: "positioning",
    label: "Positioning",
    stageIds: ["stage_3", "stage_4", "stage_5"],
  },
  { id: "system", label: "System", stageIds: ["stage_6", "stage_7", "stage_8"] },
];

function isPassed(
  progressByStage: Partial<Record<StageId, StageProgressStatus>>,
  stageId: StageId,
) {
  return progressByStage[stageId] === "passed";
}

function phaseComplete(
  progressByStage: Partial<Record<StageId, StageProgressStatus>>,
  phase: VisiblePhase,
) {
  return phase.stageIds.every((stageId) => isPassed(progressByStage, stageId));
}

export function getVisiblePhase(
  progressByStage: Partial<Record<StageId, StageProgressStatus>>,
) {
  if (phaseComplete(progressByStage, VISIBLE_PHASES[0])) {
    return phaseComplete(progressByStage, VISIBLE_PHASES[1])
      ? VISIBLE_PHASES[2]
      : VISIBLE_PHASES[1];
  }

  return VISIBLE_PHASES[0];
}

export function getVisiblePhaseStatus(
  progressByStage: Partial<Record<StageId, StageProgressStatus>>,
) {
  const passedCount = STAGE_ORDER.filter((stageId) =>
    isPassed(progressByStage, stageId),
  ).length;

  if (passedCount === STAGE_ORDER.length) return "System ready";
  if (VISIBLE_PHASES[1].stageIds.some((stageId) => isPassed(progressByStage, stageId))) {
    return "Positioning sharpening";
  }
  if (VISIBLE_PHASES[0].stageIds.some((stageId) => isPassed(progressByStage, stageId))) {
    return "Draft signal captured";
  }
  return "Listening for signal";
}

export function getVisiblePhaseProgress(
  progressByStage: Partial<Record<StageId, StageProgressStatus>>,
  phase: VisiblePhase,
) {
  const passed = phase.stageIds.filter((stageId) => isPassed(progressByStage, stageId));
  return {
    passed: passed.length,
    total: phase.stageIds.length,
    complete: passed.length === phase.stageIds.length,
  };
}

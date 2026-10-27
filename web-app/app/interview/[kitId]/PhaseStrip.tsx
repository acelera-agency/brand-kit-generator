"use client";

import type { StageId } from "@/lib/stage-requirements";
import {
  getVisiblePhase,
  getVisiblePhaseProgress,
  VISIBLE_PHASES,
} from "@/lib/visible-phase";
import type { StageProgressStatus } from "@/lib/workspace-view";

type Props = {
  progressByStage: Partial<Record<StageId, StageProgressStatus>>;
};

export function PhaseStrip({ progressByStage }: Props) {
  const visiblePhase = getVisiblePhase(progressByStage);

  return (
    <div className="grid grid-cols-3 gap-2">
      {VISIBLE_PHASES.map((phase) => {
        const progress = getVisiblePhaseProgress(progressByStage, phase);
        const active = phase.id === visiblePhase.id;
        return (
          <div
            key={phase.id}
            className={`border p-2 sm:p-3 ${
              progress.complete
                ? "border-accent bg-accent-soft"
                : active
                  ? "border-rule-strong bg-paper-pure"
                  : "border-rule bg-paper"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted sm:text-xs">
                {phase.label}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {progress.passed}/{progress.total}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1">
              {phase.stageIds.map((stageId) => (
                <span
                  key={stageId}
                  className={`h-1.5 ${
                    progressByStage[stageId] === "passed"
                      ? "bg-accent"
                      : active
                        ? "bg-rule-strong"
                        : "bg-rule"
                  }`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

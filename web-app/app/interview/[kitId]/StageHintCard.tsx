import {
  getStageRequirement,
  type StageId,
} from "@/lib/stage-requirements";
import type { BrandStage } from "@/lib/types";

type Props = {
  stageId: StageId;
  brandStage: BrandStage;
  compact?: boolean;
};

export function StageHintCard({ stageId, brandStage, compact = false }: Props) {
  const req = getStageRequirement(stageId, brandStage);
  return (
    <aside
      className={`border border-rule-strong bg-paper-pure ${compact ? "p-4" : "p-4 sm:p-5"}`}
    >
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        What this stage needs
      </p>
      <p className="mt-2 font-display text-base font-medium text-ink sm:text-lg leading-snug">
        {req.question}
      </p>
      <p className="mt-2 text-xs text-muted-strong sm:text-sm">
        <span className="font-mono uppercase tracking-widest text-[10px] text-muted mr-2">
          Pass when
        </span>
        {req.lookingFor}
      </p>
    </aside>
  );
}

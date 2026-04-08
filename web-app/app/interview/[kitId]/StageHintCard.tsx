import { STAGE_REQUIREMENTS, type StageId } from "@/lib/stage-requirements";

type Props = {
  stageId: StageId;
};

export function StageHintCard({ stageId }: Props) {
  const req = STAGE_REQUIREMENTS[stageId];
  return (
    <aside className="border border-rule-strong bg-paper-pure p-4 sm:p-5">
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

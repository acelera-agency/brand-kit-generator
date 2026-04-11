import Link from "next/link";

type Props = {
  stageNumber: number;
  stageLabel: string;
  kitId: string;
};

export function EmptySectionPlaceholder({ stageNumber, stageLabel, kitId }: Props) {
  const num = `0${stageNumber}`.slice(-2);
  return (
    <section className="border-t border-rule pt-12 mt-12">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-rule-strong" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {num} — {stageLabel}
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-rule-strong bg-paper-pure/50 p-8 text-center min-h-[140px] flex flex-col items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Not yet completed</p>
        <p className="mt-2 max-w-[40ch] text-sm text-muted-strong">
          Finish the interview to fill this section.
        </p>
        <Link
          href={`/interview/${kitId}`}
          className="btn-secondary mt-4 px-4 py-2 text-[11px]"
        >
          Continue interview
        </Link>
      </div>
    </section>
  );
}

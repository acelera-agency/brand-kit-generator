import Link from "next/link";

type Props = {
  stageNumber: number;
  stageLabel: string;
  kitId: string;
};

export function EmptySectionPlaceholder({
  stageNumber,
  stageLabel,
  kitId,
}: Props) {
  const num = `0${stageNumber}`.slice(-2);
  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block opacity-60">
        {num} — {stageLabel}
      </p>
      <div className="border border-dashed border-rule-strong bg-paper p-8 text-center min-h-[180px] flex flex-col items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Stage not yet completed
        </p>
        <p className="mt-3 max-w-[40ch] text-sm text-muted-strong">
          Finish the interview to fill this section.
        </p>
        <Link
          href={`/interview/${kitId}`}
          className="btn-secondary mt-5 px-4 py-2 text-xs"
        >
          Continue interview
        </Link>
      </div>
    </section>
  );
}

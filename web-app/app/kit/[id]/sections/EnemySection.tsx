import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: string | undefined;
  kitId: string;
};

export function EnemySection({ data, kitId }: Props) {
  if (!data) {
    return (
      <EmptySectionPlaceholder
        stageNumber={1}
        stageLabel="Enemy"
        kitId={kitId}
      />
    );
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">01 — The enemy</p>
      <div className="rounded-lg bg-ink p-8 max-w-[60ch]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-paper/50 mb-3">
          This brand exists to oppose
        </p>
        <p className="font-display text-2xl font-semibold leading-tight text-paper sm:text-3xl">
          &ldquo;{data}&rdquo;
        </p>
      </div>
    </section>
  );
}

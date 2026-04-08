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
      <div className="border-l-4 border-accent pl-6 max-w-[60ch]">
        <p className="font-mono text-xs uppercase tracking-widest text-muted mb-3">
          The brand exists to oppose
        </p>
        <p className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          “{data}”
        </p>
      </div>
    </section>
  );
}

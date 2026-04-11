import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["icp"] | undefined;
  kitId: string;
};

export function IcpSection({ data, kitId }: Props) {
  if (!data || !data.primary?.signals?.length) {
    return <EmptySectionPlaceholder stageNumber={4} stageLabel="ICP signals" kitId={kitId} />;
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">04 — ICP signals</p>
      <p className="text-sm text-muted-strong mb-6 max-w-[60ch]">
        Behaviors a fit customer shows in the first ten minutes of a discovery call. Not job titles. Not company size.
      </p>

      <div className="rounded-lg border-l-4 border-accent bg-accent-soft/30 p-6 sm:p-8 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-4">Primary signals</p>
        <ul className="space-y-3">
          {data.primary.signals.map((signal, idx) => (
            <li key={idx} className="flex gap-3 items-start">
              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span className="font-display text-base text-ink">{signal}</span>
            </li>
          ))}
        </ul>
      </div>

      {data.secondary && data.secondary.signals?.length ? (
        <div className="rounded-lg border border-rule bg-paper-pure p-6 sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
            Secondary ICP — {data.secondary.role}
          </p>
          <ul className="mt-4 space-y-3">
            {data.secondary.signals.map((signal, idx) => (
              <li key={idx} className="flex gap-3 items-start">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />
                <span className="text-base text-ink">{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

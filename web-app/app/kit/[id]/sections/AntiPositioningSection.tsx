import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["antiPositioning"] | undefined;
  kitId: string;
};

export function AntiPositioningSection({ data, kitId }: Props) {
  if (!data || data.length === 0) {
    return <EmptySectionPlaceholder stageNumber={3} stageLabel="Anti-positioning" kitId={kitId} />;
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">03 — Anti-positioning</p>
      <p className="text-sm text-muted-strong mb-6 max-w-[60ch]">
        What this brand will refuse, and what each refusal costs.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.map((item, idx) => (
          <li key={idx} className="rounded-lg border border-accent/20 bg-accent-soft/50 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block h-5 w-5 rounded-full bg-accent/20 text-center font-mono text-[10px] leading-5 text-accent">
                {idx + 1}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Refusal</span>
            </div>
            <p className="font-display text-lg font-medium leading-snug text-ink">{item.statement}</p>
            <div className="mt-3 rounded bg-paper-pure px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-signal">Cost</span>
              <p className="mt-1 text-sm text-muted-strong">{item.cost}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

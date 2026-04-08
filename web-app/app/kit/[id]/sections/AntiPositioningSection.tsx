import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["antiPositioning"] | undefined;
  kitId: string;
};

export function AntiPositioningSection({ data, kitId }: Props) {
  if (!data || data.length === 0) {
    return (
      <EmptySectionPlaceholder
        stageNumber={3}
        stageLabel="Anti-positioning"
        kitId={kitId}
      />
    );
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">03 — Anti-positioning</p>
      <p className="text-sm text-muted-strong mb-6 max-w-[60ch]">
        What this brand will refuse, and what each refusal costs.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {data.map((item, idx) => (
          <li
            key={idx}
            className="border border-rule-strong bg-paper-pure p-5 sm:p-6"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {`0${idx + 1}`.slice(-2)}
            </p>
            <p className="mt-3 font-display text-lg font-medium leading-snug text-ink">
              {item.statement}
            </p>
            <p className="mt-3 text-sm text-muted-strong">
              <span className="font-mono uppercase tracking-widest text-xs text-accent">
                Cost
              </span>
              {" — "}
              {item.cost}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

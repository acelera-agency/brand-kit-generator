import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["rules"] | undefined;
  kitId: string;
};

const SURFACE_LABELS: Array<{ key: keyof BrandKit["rules"]; label: string; color: string }> = [
  { key: "outreach", label: "Outreach", color: "bg-accent" },
  { key: "salesMeeting", label: "Sales meeting", color: "bg-ink" },
  { key: "proposals", label: "Proposals", color: "bg-signal" },
  { key: "cases", label: "Published cases", color: "bg-accent" },
  { key: "visual", label: "Visual pieces", color: "bg-ink" },
];

export function RulesSection({ data, kitId }: Props) {
  if (!data) {
    return <EmptySectionPlaceholder stageNumber={8} stageLabel="Non-negotiable rules" kitId={kitId} />;
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">08 — Non-negotiable rules</p>
      <p className="text-sm text-muted-strong mb-8 max-w-[60ch]">
        Rules that, if violated, immediately make a piece feel off-brand. Each with the one-line reason it matters.
      </p>

      <div className="space-y-10">
        {SURFACE_LABELS.map(({ key, label, color }) => {
          const rules = data[key];
          if (!rules?.length) return null;
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink">{label}</p>
              </div>
              <ol className="space-y-3">
                {rules.map((item, idx) => (
                  <li key={idx} className="rounded-lg border border-rule-strong bg-paper-pure p-4 max-w-[70ch]">
                    <p className="font-display text-sm font-medium text-ink leading-snug">
                      <span className="font-mono text-[10px] text-muted mr-2">{`0${idx + 1}`.slice(-2)}</span>
                      {item.rule}
                    </p>
                    <p className="mt-2 text-sm text-muted-strong pl-5">{item.reason}</p>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["rules"] | undefined;
  kitId: string;
};

const SURFACE_LABELS: Array<{
  key: keyof BrandKit["rules"];
  label: string;
}> = [
  { key: "outreach", label: "Outreach" },
  { key: "salesMeeting", label: "Sales meeting (first 60 seconds)" },
  { key: "proposals", label: "Commercial proposals" },
  { key: "cases", label: "Published cases" },
  { key: "visual", label: "Visual pieces" },
];

export function RulesSection({ data, kitId }: Props) {
  if (!data) {
    return (
      <EmptySectionPlaceholder
        stageNumber={8}
        stageLabel="Non-negotiable rules"
        kitId={kitId}
      />
    );
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">08 — Non-negotiable rules</p>
      <p className="text-sm text-muted-strong mb-8 max-w-[60ch]">
        Rules that, if violated, immediately make a piece feel off-brand. Each
        with the one-line reason it matters.
      </p>

      <div className="space-y-10">
        {SURFACE_LABELS.map(({ key, label }) => {
          const rules = data[key];
          if (!rules?.length) return null;
          return (
            <div key={key}>
              <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
                {label}
              </p>
              <ol className="space-y-4">
                {rules.map((item, idx) => (
                  <li
                    key={idx}
                    className="border-l-2 border-rule-strong pl-5 max-w-[70ch]"
                  >
                    <p className="font-display text-base font-medium text-ink leading-snug">
                      <span className="font-mono text-xs text-muted mr-2">
                        {`0${idx + 1}`.slice(-2)}
                      </span>
                      {item.rule}
                    </p>
                    <p className="mt-2 text-sm text-muted-strong italic">
                      {item.reason}
                    </p>
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

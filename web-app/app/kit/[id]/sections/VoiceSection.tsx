import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["voice"] | undefined;
  kitId: string;
};

export function VoiceSection({ data, kitId }: Props) {
  if (!data) {
    return <EmptySectionPlaceholder stageNumber={5} stageLabel="Voice constraints" kitId={kitId} />;
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">05 — Voice constraints</p>
      <p className="text-sm text-muted-strong mb-8 max-w-[60ch]">
        A voice a stranger could write in. Constraints, not adjectives.
      </p>

      {data.principles?.length ? (
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Principles</p>
          <div className="flex flex-wrap gap-2">
            {data.principles.map((p, idx) => (
              <span key={idx} className="rounded-full border border-rule-strong bg-paper-pure px-4 py-2 font-display text-sm text-ink">
                {p}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-10 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-accent/20 bg-accent-soft/30 p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-4">Do</p>
          <ul className="space-y-3">
            {(data.do ?? []).map((item, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="font-mono text-sm text-accent shrink-0">+</span>
                <span className="text-sm text-ink leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-signal/20 bg-signal/5 p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-signal mb-4">Don&apos;t</p>
          <ul className="space-y-3">
            {(data.dont ?? []).map((item, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="font-mono text-sm text-signal shrink-0">−</span>
                <span className="text-sm text-muted-strong leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {data.writingRules?.length ? (
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Writing rules</p>
          <ul className="space-y-2 max-w-[60ch]">
            {data.writingRules.map((rule, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" />
                <span className="text-base text-ink">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.beforeAfter?.length ? (
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Before / after</p>
          <ul className="space-y-3">
            {data.beforeAfter.map((pair, idx) => (
              <li key={idx} className="rounded-lg border border-rule-strong bg-paper-pure overflow-hidden">
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-rule">
                  <div className="p-4 sm:p-5 bg-signal/5">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-signal mb-2">Before</p>
                    <p className="text-sm text-muted-strong line-through decoration-signal/40 decoration-2">{pair.old}</p>
                  </div>
                  <div className="p-4 sm:p-5 bg-accent-soft/30">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">After</p>
                    <p className="text-sm text-ink">{pair.new}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

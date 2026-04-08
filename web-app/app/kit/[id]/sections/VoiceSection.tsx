import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["voice"] | undefined;
  kitId: string;
};

export function VoiceSection({ data, kitId }: Props) {
  if (!data) {
    return (
      <EmptySectionPlaceholder
        stageNumber={5}
        stageLabel="Voice constraints"
        kitId={kitId}
      />
    );
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">05 — Voice constraints</p>
      <p className="text-sm text-muted-strong mb-8 max-w-[60ch]">
        A voice a stranger could write in. Constraints, not adjectives.
      </p>

      {/* Principles */}
      {data.principles?.length ? (
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Principles
          </p>
          <ul className="space-y-2 max-w-[60ch]">
            {data.principles.map((p, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="font-mono text-xs text-muted shrink-0 mt-1">
                  {`0${idx + 1}`.slice(-2)}
                </span>
                <span className="text-base text-ink">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Do / Don't */}
      <div className="mb-10 grid gap-px border border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper-pure p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Do
          </p>
          <ul className="space-y-3">
            {(data.do ?? []).map((item, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="font-mono text-base text-accent shrink-0">
                  +
                </span>
                <span className="text-sm text-ink leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-paper-pure p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-signal mb-4">
            Don&apos;t
          </p>
          <ul className="space-y-3">
            {(data.dont ?? []).map((item, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="font-mono text-base text-signal shrink-0">
                  −
                </span>
                <span className="text-sm text-muted-strong leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Writing rules */}
      {data.writingRules?.length ? (
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Writing rules
          </p>
          <ul className="space-y-2 max-w-[60ch]">
            {data.writingRules.map((rule, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="font-mono text-xs text-muted shrink-0 mt-1">
                  ·
                </span>
                <span className="text-base text-ink">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Before / After */}
      {data.beforeAfter?.length ? (
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Before / after
          </p>
          <ul className="space-y-4">
            {data.beforeAfter.map((pair, idx) => (
              <li
                key={idx}
                className="border border-rule-strong bg-paper-pure p-4 sm:p-5"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">
                      Before
                    </p>
                    <p className="mt-2 text-sm text-muted-strong line-through decoration-rule-strong">
                      {pair.old}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-accent">
                      After
                    </p>
                    <p className="mt-2 text-sm text-ink">{pair.new}</p>
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

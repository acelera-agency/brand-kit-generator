import type { VoiceLintSectionResult } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";
import { LintBanner } from "./LintBanner";

type Props = {
  data: string | undefined;
  kitId: string;
  lint?: VoiceLintSectionResult;
};

export function ContextSection({ data, kitId, lint }: Props) {
  if (!data) {
    return <EmptySectionPlaceholder stageNumber={0} stageLabel="Context & contradiction" kitId={kitId} />;
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">00 — Context & contradiction</p>
      <p className="font-display text-2xl font-medium leading-snug text-ink sm:text-3xl max-w-[60ch] whitespace-pre-wrap">
        {data}
      </p>
      <div className="max-w-[60ch]">
        <LintBanner result={lint} />
      </div>
    </section>
  );
}

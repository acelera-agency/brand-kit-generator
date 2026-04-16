import type { VoiceLintSectionResult } from "@/lib/types";
import { InlineEditableText } from "../InlineEditableText";
import { ApplyLintBanner } from "./ApplyLintBanner";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";
import { LintBanner } from "./LintBanner";

type Props = {
  data: string | undefined;
  kitId: string;
  canEdit: boolean;
  lint?: VoiceLintSectionResult;
};

export function ContextSection({ data, kitId, canEdit, lint }: Props) {
  if (!data) {
    return <EmptySectionPlaceholder stageNumber={0} stageLabel="Context & contradiction" kitId={kitId} />;
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">00 — Context & contradiction</p>
      <div className="max-w-[60ch]">
        <InlineEditableText
          kitId={kitId}
          path="beforeAfter"
          value={data}
          canEdit={canEdit}
          className="font-display text-2xl font-medium leading-snug text-ink sm:text-3xl whitespace-pre-wrap"
          textareaClassName="w-full min-h-[160px] rounded border border-rule-strong bg-paper-pure p-3 font-display text-xl leading-snug text-ink focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {canEdit ? (
          <ApplyLintBanner
            kitId={kitId}
            result={lint}
            candidates={[{ path: "beforeAfter", currentValue: data }]}
          />
        ) : (
          <LintBanner result={lint} />
        )}
      </div>
    </section>
  );
}

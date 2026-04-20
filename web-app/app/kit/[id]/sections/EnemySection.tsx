import { InlineEditableText } from "../InlineEditableText";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: string | undefined;
  kitId: string;
  canEdit: boolean;
};

export function EnemySection({ data, kitId, canEdit }: Props) {
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
      <div className="rounded-lg bg-ink p-8 max-w-[60ch]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-paper/50 mb-3">
          This brand exists to oppose
        </p>
        <InlineEditableText
          kitId={kitId}
          path="enemy"
          value={data}
          canEdit={canEdit}
          className="font-display text-2xl font-semibold leading-tight text-paper sm:text-3xl"
          textareaClassName="w-full min-h-[80px] rounded border border-paper/30 bg-paper/10 p-3 font-display text-xl leading-tight text-paper focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
    </section>
  );
}

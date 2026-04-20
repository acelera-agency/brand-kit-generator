import type { BrandKit } from "@/lib/types";
import { InlineEditableText } from "../InlineEditableText";
import type { EditableFieldPath } from "@/lib/kit-field-paths";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["stack"] | undefined;
  kitId: string;
  canEdit: boolean;
};

export function StackSection({ data, kitId, canEdit }: Props) {
  if (!data) {
    return <EmptySectionPlaceholder stageNumber={2} stageLabel="Three-layer stack" kitId={kitId} />;
  }

  const layers: Array<{
    key: keyof typeof data;
    label: string;
    icon: string;
    path: EditableFieldPath;
  }> = [
    { key: "character", label: "Character", icon: "◆", path: "stack.character" },
    { key: "promise", label: "Promise", icon: "▲", path: "stack.promise" },
    { key: "method", label: "Method", icon: "●", path: "stack.method" },
  ];

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">02 — Three-layer stack</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {layers.map((layer) => (
          <div key={layer.key} className="rounded-lg border border-rule-strong bg-paper-pure p-6 shadow-sm">
            <span className="text-accent text-sm">{layer.icon}</span>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">{layer.label}</p>
            <div className="mt-3">
              <InlineEditableText
                kitId={kitId}
                path={layer.path}
                value={data[layer.key]}
                canEdit={canEdit}
                className="font-display text-xl font-medium leading-tight text-ink"
                textareaClassName="w-full rounded border border-rule-strong bg-paper-pure p-2 font-display text-lg leading-tight text-ink focus:outline-none focus:ring-2 focus:ring-accent/30"
                minRows={2}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["stack"] | undefined;
  kitId: string;
};

export function StackSection({ data, kitId }: Props) {
  if (!data) {
    return <EmptySectionPlaceholder stageNumber={2} stageLabel="Three-layer stack" kitId={kitId} />;
  }

  const layers: Array<{ key: keyof typeof data; label: string; icon: string }> = [
    { key: "character", label: "Character", icon: "◆" },
    { key: "promise", label: "Promise", icon: "▲" },
    { key: "method", label: "Method", icon: "●" },
  ];

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">02 — Three-layer stack</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {layers.map((layer) => (
          <div key={layer.key} className="rounded-lg border border-rule-strong bg-paper-pure p-6 shadow-sm">
            <span className="text-accent text-sm">{layer.icon}</span>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">{layer.label}</p>
            <p className="mt-3 font-display text-xl font-medium leading-tight text-ink">{data[layer.key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

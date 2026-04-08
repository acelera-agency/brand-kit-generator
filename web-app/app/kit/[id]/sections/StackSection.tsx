import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["stack"] | undefined;
  kitId: string;
};

export function StackSection({ data, kitId }: Props) {
  if (!data) {
    return (
      <EmptySectionPlaceholder
        stageNumber={2}
        stageLabel="Three-layer stack"
        kitId={kitId}
      />
    );
  }

  const layers: Array<{ key: keyof typeof data; label: string }> = [
    { key: "character", label: "Character" },
    { key: "promise", label: "Promise" },
    { key: "method", label: "Method" },
  ];

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">02 — Three-layer stack</p>
      <div className="grid gap-px border border-rule bg-rule sm:grid-cols-3">
        {layers.map((layer) => (
          <div key={layer.key} className="bg-paper-pure p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {layer.label}
            </p>
            <p className="mt-4 font-display text-xl font-medium leading-tight text-ink sm:text-2xl">
              {data[layer.key]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

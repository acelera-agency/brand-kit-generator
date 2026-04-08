import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["visual"] | undefined;
  kitId: string;
};

export function VisualSection({ data, kitId }: Props) {
  if (!data) {
    return (
      <EmptySectionPlaceholder
        stageNumber={7}
        stageLabel="Visual direction"
        kitId={kitId}
      />
    );
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">07 — Visual direction</p>

      {/* Palette */}
      {data.palette?.length ? (
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Palette
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {data.palette.map((color, idx) => (
              <div
                key={idx}
                className="border border-rule-strong bg-paper-pure"
              >
                <div
                  className="aspect-[5/3] w-full"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="p-3">
                  <p className="font-display text-sm font-medium text-ink">
                    {color.name}
                  </p>
                  <p className="font-mono text-xs text-muted mt-1">
                    {color.hex}
                  </p>
                  <p className="font-mono text-xs uppercase tracking-widest text-accent mt-2">
                    {color.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Typography */}
      {data.typography ? (
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Typography
          </p>
          <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {(["display", "body", "mono"] as const).map((slot) => {
              const font = data.typography[slot];
              if (!font) return null;
              return (
                <div key={slot} className="bg-paper-pure p-5 sm:p-6">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    {slot}
                  </p>
                  <p className="mt-3 font-display text-xl font-medium text-ink">
                    {font.family}
                  </p>
                  {font.weights?.length ? (
                    <p className="mt-2 font-mono text-xs text-muted">
                      Weights: {font.weights.join(", ")}
                    </p>
                  ) : null}
                  <p className="mt-1 font-mono text-xs text-muted">
                    Source: {font.source}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Characteristic components */}
      {data.characteristicComponents?.length ? (
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Characteristic components
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.characteristicComponents.map((comp, idx) => (
              <li
                key={idx}
                className="border border-rule-strong bg-paper-pure p-5"
              >
                <p className="font-display text-base font-medium text-ink">
                  {comp.name}
                </p>
                <p className="mt-2 text-sm text-muted-strong">
                  {comp.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Forbidden visuals */}
      {data.forbiddenVisuals?.length ? (
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-signal mb-4">
            Forbidden visuals
          </p>
          <ul className="space-y-2 max-w-[60ch]">
            {data.forbiddenVisuals.map((item, idx) => (
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
      ) : null}

      {/* Logo direction */}
      {data.logoDirection ? (
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Logo direction
          </p>
          <p className="text-base text-ink max-w-[60ch] leading-relaxed">
            {data.logoDirection}
          </p>
        </div>
      ) : null}
    </section>
  );
}

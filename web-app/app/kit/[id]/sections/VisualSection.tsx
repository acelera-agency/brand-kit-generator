"use client";

import { useState } from "react";
import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["visual"] | undefined;
  kitId: string;
};

function ColorSwatch({ color }: { color: { name: string; hex: string; role: string; narrative?: string } }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(color.hex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const isLight = isLightColor(color.hex);

  return (
    <div className="group cursor-pointer overflow-hidden rounded-lg border border-rule-strong bg-paper-pure shadow-sm transition-shadow hover:shadow-md">
      <div
        className="relative aspect-[4/3] w-full transition-transform group-hover:scale-[1.02]"
        style={{ backgroundColor: color.hex }}
        onClick={handleCopy}
      >
        <div
          className={`absolute bottom-2 right-2 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100 ${
            isLight ? "bg-ink/80 text-paper" : "bg-paper/80 text-ink"
          }`}
        >
          {copied ? "Copied!" : "Click to copy"}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-medium text-ink">{color.name}</p>
          <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
            {color.role}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-1.5 font-mono text-xs text-muted hover:text-ink transition-colors"
        >
          {color.hex}
        </button>
        {color.narrative && (
          <p className="mt-1.5 text-[11px] text-muted-strong leading-snug">{color.narrative}</p>
        )}
      </div>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

const TYPOGRAPHY_SAMPLES: Record<string, { display: string; body: string }> = {
  display: { display: "Typography is the craft of endowing human language with a durable visual form.", body: "Good typography makes reading effortless. The best typefaces disappear into the text, serving the reader without calling attention to themselves." },
  body: { display: "Clear writing demands clear presentation.", body: "Body text carries your message. The right typeface at the right size with the right line height makes paragraphs feel natural and inviting to read." },
  mono: { display: "const brand = true;", body: "Monospace fonts give code and technical details a distinct voice. They signal precision and clarity." },
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
      <p className="eyebrow mb-6 block">07 — Visual direction</p>

      {data.palette?.length ? (
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Palette
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.palette.map((color, idx) => (
              <div key={idx} className="w-[160px] shrink-0">
                <ColorSwatch color={color} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {data.typography ? (
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Typography
          </p>
          <div className="space-y-4">
            {(["display", "body", "mono"] as const).map((slot) => {
              const font = data.typography![slot];
              if (!font) return null;
              const family = `"${font.family}", system-ui, sans-serif`;
              const samples = TYPOGRAPHY_SAMPLES[slot];
              return (
                <div key={slot} className="rounded-lg border border-rule-strong bg-paper-pure overflow-hidden">
                  <div className="flex items-center justify-between border-b border-rule px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                        {slot}
                      </span>
                      <span className="font-mono text-xs text-muted">{font.family}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted">
                      {font.weights?.join(", ")} · {font.source}
                    </span>
                  </div>
                  <div className="p-5" style={{ fontFamily: family }}>
                    <p
                      className={`text-ink leading-tight ${slot === "display" ? "text-2xl sm:text-3xl font-semibold" : slot === "body" ? "text-lg" : "text-sm"}`}
                      style={{ fontWeight: font.weights?.includes(600) ? 600 : font.weights?.[0] ?? 400 }}
                    >
                      {samples.display}
                    </p>
                    <p
                      className="mt-3 text-muted-strong leading-relaxed"
                      style={{ fontWeight: font.weights?.[0] ?? 400 }}
                    >
                      {samples.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {data.characteristicComponents?.length ? (
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Characteristic components
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.characteristicComponents.map((comp, idx) => (
              <li
                key={idx}
                className="rounded-lg border border-rule-strong bg-paper-pure p-5 shadow-sm"
              >
                <p className="font-display text-base font-medium text-ink">{comp.name}</p>
                <p className="mt-2 text-sm text-muted-strong">{comp.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.forbiddenVisuals?.length ? (
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-signal mb-4">
            Forbidden visuals
          </p>
          <div className="rounded-lg border border-signal/20 bg-signal/5 p-5">
            <ul className="space-y-2">
              {data.forbiddenVisuals.map((item, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="font-mono text-sm text-signal shrink-0">−</span>
                  <span className="text-sm text-ink leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {data.logoDirection ? (
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
            Logo direction
          </p>
          <p className="text-base text-ink max-w-[60ch] leading-relaxed">{data.logoDirection}</p>
        </div>
      ) : null}
    </section>
  );
}

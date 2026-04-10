"use client";

import type { ProgressiveSnapshot } from "@/lib/progressive-snapshot";

type Props = {
  snapshot: ProgressiveSnapshot | null;
};

export function ProgressiveSnapshotCard({ snapshot }: Props) {
  if (!snapshot) {
    return (
      <section className="border border-dashed border-rule-strong bg-paper p-5 text-center sm:p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Draft checkpoints appear as you progress
        </p>
        <p className="mx-auto mt-3 max-w-[40ch] text-sm text-muted-strong">
          The first useful summary shows up before the full kit is done, so you
          can feel the strategic direction getting sharper while you work.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
      <div className="border-b border-rule pb-5">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Progressive draft
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
          {snapshot.title}
        </h2>
        <p className="mt-3 text-sm text-muted-strong">{snapshot.description}</p>
      </div>

      <div className="mt-6 space-y-5">
        {snapshot.blocks.map((block) => (
          <div key={block.title}>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {block.title}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-strong">
              {block.items.map((item) => (
                <li key={item} className="border-l border-rule pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

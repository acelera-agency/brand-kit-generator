import type { HomepageDraftView } from "@/lib/workspace-view";

type Props = {
  draft: HomepageDraftView;
};

export function HomepageDraftSection({ draft }: Props) {
  return (
    <section className="mt-8 border-t border-rule pt-8">
      <p className="eyebrow mb-4 block">Homepage draft</p>
      <div className="max-w-[70ch] border border-rule-strong bg-paper-pure p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {draft.hero.eyebrow}
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          {draft.title}
        </h2>
        <p className="mt-4 max-w-[58ch] text-base text-muted-strong">
          {draft.description}
        </p>
        <div className="mt-6 inline-flex border border-rule-strong px-4 py-3 font-mono text-xs uppercase tracking-widest text-ink">
          {draft.primaryCta}
        </div>
      </div>
    </section>
  );
}

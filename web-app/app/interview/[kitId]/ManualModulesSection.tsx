import type { ManualModuleView } from "@/lib/workspace-view";

type Props = {
  modules: ManualModuleView[];
  busy: boolean;
  onApprove: (stageId: ManualModuleView["stageId"]) => void;
  onAdjust: (stageId: ManualModuleView["stageId"]) => void;
  onRegenerate: (stageId: ManualModuleView["stageId"]) => void;
};

const STATUS_STYLES: Record<ManualModuleView["status"], string> = {
  passed: "border-accent text-accent",
  active: "border-rule-strong text-ink",
  locked: "border-rule text-muted",
};

export function ManualModulesSection({
  modules,
  busy,
  onApprove,
  onAdjust,
  onRegenerate,
}: Props) {
  return (
    <section className="mt-8 border-t border-rule pt-8">
      <p className="eyebrow mb-4 block">Manual modules</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => {
          const locked = module.status === "locked";
          const passed = module.progress === "passed";

          return (
            <article
              key={module.stageId}
              className={`flex h-full flex-col border bg-paper-pure p-4 sm:p-5 ${
                locked ? "border-rule opacity-70" : "border-rule-strong"
              }`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-rule pb-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    Manual module
                  </p>
                  <h2 className="mt-2 font-display text-lg font-medium text-ink">
                    {module.title}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${STATUS_STYLES[module.status]}`}
                  >
                    {passed ? "passed" : module.status}
                  </span>
                  {module.hasFreshDraft ? (
                    <span className="inline-flex border border-accent bg-accent-soft px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-accent">
                      New draft ready
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 pt-4">
                <ul className="space-y-2 text-sm leading-relaxed text-muted-strong">
                  {module.preview.map((line, index) => (
                    <li
                      key={`${module.stageId}-${index}`}
                      className="border-l border-rule pl-3"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-rule pt-4">
                <button
                  type="button"
                  disabled={busy || locked || passed}
                  onClick={() => onApprove(module.stageId)}
                  className="btn-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy || locked}
                  onClick={() => onAdjust(module.stageId)}
                  className="btn-secondary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Adjust
                </button>
                <button
                  type="button"
                  disabled={busy || locked}
                  onClick={() => onRegenerate(module.stageId)}
                  className="btn-secondary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Regenerate
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

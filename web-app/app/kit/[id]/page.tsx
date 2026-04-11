import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase";
import type { DraftCheckpoint, ExperienceMode, StoredKitData } from "@/lib/types";
import { ContextSection } from "./sections/ContextSection";
import { EnemySection } from "./sections/EnemySection";
import { StackSection } from "./sections/StackSection";
import { AntiPositioningSection } from "./sections/AntiPositioningSection";
import { IcpSection } from "./sections/IcpSection";
import { VoiceSection } from "./sections/VoiceSection";
import { TemplatesSection } from "./sections/TemplatesSection";
import { VisualSection } from "./sections/VisualSection";
import { RulesSection } from "./sections/RulesSection";

export const dynamic = "force-dynamic";

const CHECKPOINT_ORDER: DraftCheckpoint[] = [
  "none",
  "foundation",
  "positioning",
  "final",
];

const CHECKPOINT_LABEL: Record<Exclude<DraftCheckpoint, "none">, string> = {
  foundation: "Foundation snapshot",
  positioning: "Positioning snapshot",
  final: "Final brand kit",
};

const CHECKPOINT_DESCRIPTIONS: Record<Exclude<DraftCheckpoint, "none">, string> = {
  foundation: "Context, enemy, and core stack are becoming usable.",
  positioning: "Positioning, ICP, and voice are strong enough to pressure-test.",
  final: "The complete methodology is finished and ready for export.",
};

export default async function KitViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: kitRow } = await supabase
    .from("brand_kits")
    .select(
      "id, owner_id, name, status, experience_mode, draft_checkpoint, kit, created_at, updated_at",
    )
    .eq("id", id)
    .single();

  if (!kitRow || kitRow.owner_id !== user.id) {
    notFound();
  }

  const { data: progressRows } = await supabase
    .from("stage_progress")
    .select("stage_id, status")
    .eq("kit_id", id);

  const progressByStage = Object.fromEntries(
    (progressRows ?? []).map((row) => [row.stage_id, row.status]),
  );
  const passedCount = Object.values(progressByStage).filter(
    (status) => status === "passed",
  ).length;
  const isComplete = passedCount >= 9;
  const experienceMode =
    (kitRow.experience_mode as ExperienceMode | null) ?? "guided";
  const draftCheckpoint =
    (kitRow.draft_checkpoint as DraftCheckpoint | null) ?? "none";

  const kit = (kitRow.kit ?? {}) as StoredKitData;

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <header className="border-b border-rule pb-10 sm:pb-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[60ch]">
            <p className="eyebrow mb-4 block">Brand kit / canonical output</p>
            <h1 className="font-display text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.95] tracking-tightest text-ink">
              {kitRow.name}
            </h1>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="border border-rule bg-paper px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                {experienceMode === "expert-led" ? "Expert-led" : "Guided"}
              </span>
              <span className="border border-rule bg-paper px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent">
                {draftCheckpoint === "none"
                  ? "In progress"
                  : draftCheckpoint === "final"
                    ? "Final kit ready"
                    : CHECKPOINT_LABEL[draftCheckpoint]}
              </span>
            </div>
            {kit.beforeAfter ? (
              <p className="mt-6 whitespace-pre-wrap text-base text-muted-strong sm:text-lg">
                {kit.beforeAfter}
              </p>
            ) : (
              <p className="mt-6 text-sm text-muted-strong">
                {passedCount} of 9 milestones captured so far. The brand kit is
                the main artifact. Site generation stays locked until the full
                methodology is complete.
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <p className="text-right font-mono text-xs uppercase tracking-widest text-muted">
              {passedCount} / 9 milestones complete
            </p>
            {isComplete ? (
              <div className="flex flex-col gap-2 sm:items-end">
                <a
                  href={`/api/kits/${id}/export-md`}
                  className="btn-primary px-5 py-3 text-sm sm:px-6 sm:py-3"
                >
                  Download markdown
                </a>
                <Link
                  href={`/kit/${id}/site`}
                  className="btn-secondary px-5 py-3 text-sm sm:px-6 sm:py-3"
                >
                  Generate optional site
                </Link>
              </div>
            ) : (
              <Link
                href={`/interview/${id}`}
                className="btn-primary px-5 py-3 text-sm sm:px-6 sm:py-3"
              >
                Continue guided flow
              </Link>
            )}
            {experienceMode === "expert-led" ? (
              <Link
                href={`/workspace/${id}`}
                className="btn-secondary px-4 py-2 text-xs sm:text-sm"
              >
                Strategist workspace
              </Link>
            ) : null}
            <Link
              href="/dashboard"
              className="btn-secondary px-4 py-2 text-xs sm:text-sm"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      <ContextSection data={kit.beforeAfter} kitId={id} />
      <EnemySection data={kit.enemy} kitId={id} />
      <StackSection data={kit.stack} kitId={id} />
      <AntiPositioningSection data={kit.antiPositioning} kitId={id} />
      <IcpSection data={kit.icp} kitId={id} />
      <VoiceSection data={kit.voice} kitId={id} />
      <TemplatesSection data={kit.templates} kitId={id} />
      <VisualSection data={kit.visual} kitId={id} />
      <RulesSection data={kit.rules} kitId={id} />

      <footer className="mt-16 border-t border-rule pt-12">
        <p className="eyebrow mb-4 block">Progress checkpoints</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(["foundation", "positioning", "final"] as const).map((checkpoint) => {
            const reached =
              CHECKPOINT_ORDER.indexOf(draftCheckpoint) >=
              CHECKPOINT_ORDER.indexOf(checkpoint);
            const status = reached
              ? checkpoint === draftCheckpoint
                ? "current"
                : "ready"
              : "upcoming";

            return (
              <article
                key={checkpoint}
                className="border border-rule-strong bg-paper-pure p-4"
              >
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    {checkpoint}
                  </p>
                  <p
                    className={`font-mono text-xs uppercase tracking-widest ${
                      status === "ready" || status === "current"
                        ? "text-accent"
                        : "text-muted"
                    }`}
                  >
                    {status}
                  </p>
                </div>
                <p className="mt-3 font-display text-base font-medium text-ink">
                  {CHECKPOINT_LABEL[checkpoint]}
                </p>
                <p className="mt-2 text-sm text-muted-strong">
                  {CHECKPOINT_DESCRIPTIONS[checkpoint]}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-rule pt-6 text-sm text-muted-strong">
          <span>{user.email}</span>
          <Link href="/dashboard" className="btn-secondary px-4 py-2 text-xs">
            Back to dashboard
          </Link>
        </div>
      </footer>
    </main>
  );
}

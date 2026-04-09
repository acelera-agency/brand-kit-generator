import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerClient } from "@/lib/supabase";
import type { StoredKitData } from "@/lib/types";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/stage-requirements";
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
    .select("id, owner_id, status, kit, created_at, updated_at")
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
    (progressRows ?? []).map((r) => [r.stage_id, r.status]),
  );
  const passedCount = Object.values(progressByStage).filter(
    (s) => s === "passed",
  ).length;
  const isComplete = passedCount >= 9;

  const kit = (kitRow.kit ?? {}) as StoredKitData;

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      {/* Hero */}
      <header className="border-b border-rule pb-10 sm:pb-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[60ch]">
            <p className="eyebrow mb-4 block">Brand kit / read-only view</p>
            <h1 className="font-display text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.95] tracking-tightest text-ink">
              {kit.enemy ? "A brand built against" : "Brand kit"}
              {kit.enemy ? (
                <>
                  {" "}
                  <span className="text-accent">
                    {kit.enemy.replace(/[.!?]$/, "")}
                  </span>
                  .
                </>
              ) : (
                <>
                  {" "}
                  <span className="font-mono text-base text-muted align-middle">
                    {id.slice(0, 8)}
                  </span>
                </>
              )}
            </h1>
            {kit.beforeAfter ? (
              <p className="mt-6 text-base text-muted-strong sm:text-lg whitespace-pre-wrap">
                {kit.beforeAfter}
              </p>
            ) : (
              <p className="mt-6 text-sm text-muted-strong">
                {passedCount} of 9 stages passed. Each section below fills in
                as you complete the interview.
              </p>
            )}
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end shrink-0">
            <p className="font-mono text-xs uppercase tracking-widest text-muted text-right">
              {passedCount} / 9 passed
            </p>
            {isComplete ? (
              <div className="flex flex-col gap-2 sm:items-end">
                <Link
                  href={`/kit/${id}/site`}
                  className="btn-primary px-5 py-3 text-sm sm:px-6 sm:py-3"
                >
                  Generate site
                </Link>
                <a
                  href={`/api/kits/${id}/export-md`}
                  className="btn-secondary px-5 py-3 text-sm sm:px-6 sm:py-3"
                >
                  Download markdown
                </a>
              </div>
            ) : (
              <Link
                href={`/interview/${id}`}
                className="btn-primary px-5 py-3 text-sm sm:px-6 sm:py-3"
              >
                Continue interview
              </Link>
            )}
            <Link
              href="/dashboard"
              className="btn-secondary px-4 py-2 text-xs sm:text-sm"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Sections */}
      <ContextSection data={kit.beforeAfter} kitId={id} />
      <EnemySection data={kit.enemy} kitId={id} />
      <StackSection data={kit.stack} kitId={id} />
      <AntiPositioningSection data={kit.antiPositioning} kitId={id} />
      <IcpSection data={kit.icp} kitId={id} />
      <VoiceSection data={kit.voice} kitId={id} />
      <TemplatesSection data={kit.templates} kitId={id} />
      <VisualSection data={kit.visual} kitId={id} />
      <RulesSection data={kit.rules} kitId={id} />

      {/* Footer: stage progress appendix */}
      <footer className="border-t border-rule pt-12 mt-16">
        <p className="eyebrow mb-4 block">Appendix — Stage progress</p>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STAGE_ORDER.map((sid, idx) => {
            const status = progressByStage[sid] ?? "empty";
            return (
              <li
                key={sid}
                className="border border-rule-strong bg-paper-pure p-4"
              >
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    {`0${idx}`.slice(-2)}
                  </p>
                  <p
                    className={`font-mono text-xs uppercase tracking-widest ${
                      status === "passed"
                        ? "text-accent"
                        : status === "in-progress"
                          ? "text-ink"
                          : "text-muted"
                    }`}
                  >
                    {status}
                  </p>
                </div>
                <p className="mt-3 font-display text-base font-medium text-ink">
                  {STAGE_LABELS[sid]}
                </p>
              </li>
            );
          })}
        </ol>

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

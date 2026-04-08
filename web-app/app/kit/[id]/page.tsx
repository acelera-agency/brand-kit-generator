import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  stage_0: "Context & contradiction",
  stage_1: "Enemy",
  stage_2: "Three-layer stack",
  stage_3: "Anti-positioning",
  stage_4: "ICP signals",
  stage_5: "Voice constraints",
  stage_6: "Application templates",
  stage_7: "Visual direction",
  stage_8: "Non-negotiable rules",
};

const STAGE_ORDER = [
  "stage_0",
  "stage_1",
  "stage_2",
  "stage_3",
  "stage_4",
  "stage_5",
  "stage_6",
  "stage_7",
  "stage_8",
] as const;

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
    .select("id, owner_id, status, kit, updated_at")
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

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <header className="flex flex-col gap-6 border-b border-rule pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-4 block">Kit / read-only view</p>
          <h1 className="font-display text-[clamp(2rem,4.5vw,3.6rem)] font-semibold leading-[0.95] tracking-tightest text-ink">
            Brand kit {id.slice(0, 8)}
          </h1>
          <p className="mt-3 text-sm text-muted-strong">
            {passedCount} / 9 stages passed
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {isComplete ? (
            <a
              href={`/api/kits/${id}/export-md`}
              className="btn-primary px-5 py-3 text-sm sm:px-6 sm:py-3"
            >
              Download markdown
            </a>
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
      </header>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 block">Stage progress</h2>
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
      </section>

      <section className="mt-12">
        <h2 className="eyebrow mb-4 block">Raw kit data</h2>
        <pre className="overflow-x-auto border border-rule-strong bg-paper p-5 font-mono text-xs leading-relaxed text-ink">
          {JSON.stringify(kitRow.kit ?? {}, null, 2)}
        </pre>
      </section>
    </main>
  );
}

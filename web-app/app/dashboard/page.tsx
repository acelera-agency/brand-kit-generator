import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase";
import type { DraftCheckpoint, ExperienceMode } from "@/lib/types";
import { DeleteKitButton } from "./DeleteKitButton";
import { StartKitButton } from "./StartKitButton";

export const dynamic = "force-dynamic";

type KitRow = {
  id: string;
  name: string;
  status: "draft" | "completed" | "published";
  experience_mode: ExperienceMode | null;
  handoff_requested_at: string | null;
  draft_checkpoint: DraftCheckpoint | null;
  created_at: string;
  updated_at: string;
};

type StageProgressRow = {
  kit_id: string;
  status: "empty" | "in-progress" | "passed";
};

const STATUS_LABEL: Record<KitRow["status"], string> = {
  draft: "Draft",
  completed: "Completed",
  published: "Published",
};

const MODE_LABEL: Record<ExperienceMode, string> = {
  guided: "Guided",
  "expert-led": "Expert-led",
};

const CHECKPOINT_LABEL: Record<DraftCheckpoint, string> = {
  none: "Started",
  foundation: "Foundation ready",
  positioning: "Positioning ready",
  final: "Final kit ready",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: kits, error } = await supabase
    .from("brand_kits")
    .select(
      "id, name, status, experience_mode, handoff_requested_at, draft_checkpoint, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[dashboard] failed to load kits", error);
  }

  const rows: KitRow[] = (kits ?? []) as KitRow[];
  const kitIds = rows.map((kit) => kit.id);
  const { data: progressRows } = kitIds.length
    ? await supabase
        .from("stage_progress")
        .select("kit_id, status")
        .in("kit_id", kitIds)
    : { data: [] as StageProgressRow[] };

  const passedCountByKit = (progressRows ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      if (row.status === "passed") {
        acc[row.kit_id] = (acc[row.kit_id] ?? 0) + 1;
      }
      return acc;
    },
    {},
  );

  const completedCount = rows.filter(
    (kit) => kit.status === "completed" || kit.status === "published",
  ).length;
  const expertLedCount = rows.filter(
    (kit) => (kit.experience_mode ?? "guided") === "expert-led",
  ).length;

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <header className="flex flex-col gap-6 border-b border-rule pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-4 block">Founder dashboard / brand kits</p>
          <h1 className="font-display text-[clamp(2rem,4.5vw,3.6rem)] font-semibold leading-[0.95] tracking-tightest text-ink">
            Build the kit first. Decide on the site later.
          </h1>
          <p className="mt-4 max-w-[60ch] text-base text-muted-strong sm:text-lg">
            Each kit moves through a guided founder flow with usable
            checkpoints before the full methodology is done. Expert-led kits
            stay visible here too, but the public path remains simple.
          </p>
        </div>

        <StartKitButton />
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-rule-strong bg-paper-pure p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Total kits
          </p>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">
            {rows.length}
          </p>
          <p className="mt-2 text-sm text-muted-strong">
            Guided flows and expert-led handoffs in one place.
          </p>
        </div>
        <div className="border border-rule-strong bg-paper-pure p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Final kits
          </p>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">
            {completedCount}
          </p>
          <p className="mt-2 text-sm text-muted-strong">
            Ready for export, review, and optional site generation.
          </p>
        </div>
        <div className="border border-rule-strong bg-paper-pure p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Expert-led
          </p>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">
            {expertLedCount}
          </p>
          <p className="mt-2 text-sm text-muted-strong">
            Founder-visible kits where Acelera can take a heavier synthesis role.
          </p>
        </div>
      </section>

      <section className="mt-10">
        {rows.length === 0 ? (
          <div className="border border-dashed border-rule-strong bg-paper p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              No founder kits yet
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
              Start the first guided brand kit.
            </h2>
            <p className="mx-auto mt-3 max-w-[48ch] text-sm text-muted-strong">
              A founder can reach the first real question in under a minute,
              add inspiration later, and get a usable draft checkpoint before
              the whole system is complete.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((kit) => (
              <li
                key={kit.id}
                className="flex flex-col border border-rule-strong bg-paper-pure p-5 shadow-[0_8px_28px_rgba(11,15,20,0.05)]"
              >
                <div className="flex items-start justify-between gap-3 border-b border-rule pb-3">
                  <div className="flex flex-wrap gap-2">
                    <p className="border border-rule bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                      {STATUS_LABEL[kit.status]}
                    </p>
                    <p className="border border-rule bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                      {MODE_LABEL[kit.experience_mode ?? "guided"]}
                    </p>
                  </div>
                  <p className="font-mono text-xs text-muted">
                    {kit.id.slice(0, 8)}
                  </p>
                </div>
                <h3 className="mt-4 break-words font-display text-xl font-medium text-ink">
                  {kit.name}
                </h3>
                <p className="mt-2 text-sm text-muted-strong">
                  {passedCountByKit[kit.id] ?? 0} of 9 milestones captured
                </p>
                <p className="mt-2 font-mono text-xs uppercase tracking-widest text-accent">
                  {CHECKPOINT_LABEL[kit.draft_checkpoint ?? "none"]}
                </p>
                <p className="mt-2 text-xs text-muted-strong">
                  Updated {formatDate(kit.updated_at)}
                </p>
                {kit.experience_mode === "expert-led" ? (
                  <p className="mt-3 text-xs text-muted-strong">
                    Acelera guidance was requested
                    {kit.handoff_requested_at
                      ? ` on ${new Date(kit.handoff_requested_at).toLocaleDateString("en-US")}`
                      : ""}.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-muted-strong">
                    Founder-facing guided mode with the gate logic handled in
                    the background.
                  </p>
                )}

                <div className="mt-6 flex items-end justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={
                        kit.status === "completed" || kit.status === "published"
                          ? `/kit/${kit.id}`
                          : `/interview/${kit.id}`
                      }
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      {kit.status === "completed" || kit.status === "published"
                        ? "Review brand kit"
                        : "Continue guided flow"}
                    </Link>
                    {kit.status === "completed" || kit.status === "published" ? (
                      <Link
                        href={`/kit/${kit.id}/site`}
                        className="btn-secondary px-4 py-2 text-sm"
                      >
                        Generate optional site
                      </Link>
                    ) : null}
                    {kit.experience_mode === "expert-led" ? (
                      <Link
                        href={`/workspace/${kit.id}`}
                        className="btn-secondary px-4 py-2 text-sm"
                      >
                        Strategist workspace
                      </Link>
                    ) : null}
                  </div>
                  <DeleteKitButton kitId={kit.id} kitName={kit.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-16 flex items-center justify-between border-t border-rule pt-6 text-sm text-muted-strong">
        <span>{user.email}</span>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="btn-secondary px-4 py-2 text-sm">
            Sign out
          </button>
        </form>
      </footer>
    </main>
  );
}

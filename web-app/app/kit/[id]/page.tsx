import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { hasKitRole } from "@/lib/kit-collaboration";
import { getKitAccess } from "@/lib/kit-server";
import type { StoredKitData } from "@/lib/types";
import { ContextSection } from "./sections/ContextSection";
import { EnemySection } from "./sections/EnemySection";
import { StackSection } from "./sections/StackSection";
import { AntiPositioningSection } from "./sections/AntiPositioningSection";
import { IcpSection } from "./sections/IcpSection";
import { VoiceSection } from "./sections/VoiceSection";
import { TemplatesSection } from "./sections/TemplatesSection";
import { VisualSection } from "./sections/VisualSection";
import { RulesSection } from "./sections/RulesSection";
import { KitSidebarDesktop, KitSidebarMobile } from "./KitSidebar";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { id: "context", number: "00", label: "Context" },
  { id: "enemy", number: "01", label: "Enemy" },
  { id: "stack", number: "02", label: "Stack" },
  { id: "anti", number: "03", label: "Anti-pos" },
  { id: "icp", number: "04", label: "ICP" },
  { id: "voice", number: "05", label: "Voice" },
  { id: "templates", number: "06", label: "Templates" },
  { id: "visual", number: "07", label: "Visual" },
  { id: "rules", number: "08", label: "Rules" },
] as const;

export default async function KitViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const access = await getKitAccess(id);
  if (!access.user) {
    redirect("/login");
  }

  if (!access.kit || !access.role) {
    notFound();
  }

  const { data: kitRow } = await access.supabase
    .from("brand_kits")
    .select("id, owner_id, status, kit, created_at, updated_at")
    .eq("id", id)
    .single();

  if (!kitRow) {
    notFound();
  }

  const { data: progressRows } = await access.supabase
    .from("stage_progress")
    .select("stage_id, status")
    .eq("kit_id", id);

  const passedCount = (progressRows ?? []).filter(
    (r) => r.status === "passed",
  ).length;
  const isComplete = passedCount >= 9;
  const canEditKit = hasKitRole(access.role, "editor");
  const kit = (kitRow.kit ?? {}) as StoredKitData;

  const tocItems = SECTIONS.map((s) => ({
    id: s.id,
    number: s.number,
    label: s.label,
    hasData: Boolean(
      s.id === "context" ? kit.beforeAfter
        : s.id === "enemy" ? kit.enemy
          : s.id === "stack" ? kit.stack
            : s.id === "anti" ? kit.antiPositioning?.length
              : s.id === "icp" ? kit.icp?.primary?.signals?.length
                : s.id === "voice" ? kit.voice
                  : s.id === "templates" ? kit.templates
                    : s.id === "visual" ? kit.visual
                      : kit.rules,
    ),
  }));

  return (
    <div className="min-h-screen bg-paper">
      <div className="h-1.5 w-full bg-rule">
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${(passedCount / 9) * 100}%` }}
        />
      </div>

      <header className="border-b border-rule bg-paper-pure">
        <div className="mx-auto flex max-w-container items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/dashboard"
              className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-muted hover:text-ink transition-colors"
            >
              ← Dashboard
            </Link>
            <span className="h-4 w-px shrink-0 bg-rule" />
            <h1 className="font-display text-lg font-semibold tracking-tight text-ink truncate">
              {kit.enemy ? (
                <>
                  Against <span className="text-accent">{kit.enemy.replace(/[.!?]$/, "")}</span>
                </>
              ) : (
                access.kit.name
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isComplete ? (
              <>
                <Link
                  href={`/kit/${id}/site`}
                  className="btn-primary px-4 py-2 text-[11px]"
                >
                  {canEditKit ? "Generate site" : "Site workspace"}
                </Link>
                <a
                  href={`/api/kits/${id}/export-md`}
                  className="btn-secondary px-4 py-2 text-[11px]"
                >
                  Export
                </a>
              </>
            ) : (
              <Link
                href={`/interview/${id}`}
                className="btn-primary px-4 py-2 text-[11px]"
              >
                Continue interview
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-container gap-12 px-6 py-10 sm:px-10 lg:px-16">
        <KitSidebarDesktop items={tocItems} passedCount={passedCount} />

        <main className="min-w-0 flex-1 max-w-[780px]">
          <KitSidebarMobile items={tocItems} passedCount={passedCount} />
          {(kit.beforeAfter || kit.enemy) && (
            <div className="mb-16">
              {kit.enemy && (
                <div className="mb-8 rounded-lg bg-ink p-8 text-paper">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
                    The enemy
                  </p>
                  <p className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl">
                    &ldquo;{kit.enemy}&rdquo;
                  </p>
                </div>
              )}

              {kit.beforeAfter && (
                <p className="font-display text-xl font-medium leading-relaxed text-ink sm:text-2xl max-w-[60ch] whitespace-pre-wrap">
                  {kit.beforeAfter}
                </p>
              )}

              {kit.stack && (
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {(["character", "promise", "method"] as const).map((key) => (
                    <div key={key} className="rounded-lg border border-rule-strong bg-paper-pure p-5 shadow-sm">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        {key}
                      </p>
                      <p className="mt-2 font-display text-base font-medium text-ink">
                        {kit.stack![key]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div id="context">
            <ContextSection data={kit.beforeAfter} kitId={id} />
          </div>
          <div id="enemy">
            <EnemySection data={kit.enemy} kitId={id} />
          </div>
          <div id="stack">
            <StackSection data={kit.stack} kitId={id} />
          </div>
          <div id="anti">
            <AntiPositioningSection data={kit.antiPositioning} kitId={id} />
          </div>
          <div id="icp">
            <IcpSection data={kit.icp} kitId={id} />
          </div>
          <div id="voice">
            <VoiceSection data={kit.voice} kitId={id} />
          </div>
          <div id="templates">
            <TemplatesSection data={kit.templates} kitId={id} />
          </div>
          <div id="visual">
            <VisualSection data={kit.visual} kitId={id} />
          </div>
          <div id="rules">
            <RulesSection data={kit.rules} kitId={id} />
          </div>
        </main>
      </div>
    </div>
  );
}

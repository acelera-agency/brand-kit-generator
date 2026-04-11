import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getKitAccess } from "@/lib/kit-server";
import { getOrInitQuota } from "@/lib/token-quota";
import type { GenerationSettings } from "./types";
import { SiteWorkspace } from "./SiteWorkspace";

export const dynamic = "force-dynamic";

export default async function SitePage({
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

  const [generation, progressRows, quota] = await Promise.all([
    access.supabase
      .from("site_generations")
      .select("id, status, demo_url, v0_chat_id, v0_version_id, error_message, created_at, generation_settings")
      .eq("kit_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    access.supabase
      .from("stage_progress")
      .select("stage_id, status")
      .eq("kit_id", id),
    getOrInitQuota(access.user.id),
  ]);

  const passedCount = (progressRows.data ?? []).filter(
    (r) => r.status === "passed",
  ).length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper-pure">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-rule bg-paper px-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/kit/${id}`}
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink transition-colors"
          >
            ← Kit
          </Link>
          <span className="h-4 w-px bg-rule" />
          <h1 className="font-display text-sm font-semibold tracking-tight text-ink truncate max-w-[200px] sm:max-w-[360px]">
            {access.kit.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/kit/${id}`}
            className="font-mono text-[11px] uppercase tracking-widest text-muted hover:text-ink transition-colors"
          >
            Back to kit
          </Link>
        </div>
      </header>

      {passedCount < 9 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-md text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {passedCount} / 9 stages complete
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
              Complete your brand kit first
            </h2>
            <p className="mx-auto mt-3 max-w-[48ch] text-sm text-muted-strong">
              Finish all 9 interview stages before generating a site.
            </p>
            <a
              href={`/interview/${id}`}
              className="btn-primary mt-6 inline-block px-6 py-3 text-sm"
            >
              Continue interview
            </a>
          </div>
        </div>
      ) : (
        <SiteWorkspace
          kitId={id}
          currentUserEmail={access.user.email}
          currentUserRole={access.role}
          initialGeneration={generation.data
            ? {
                id: generation.data.id,
                status: generation.data.status as "pending" | "generating" | "completed" | "failed",
                demoUrl: generation.data.demo_url,
                chatId: generation.data.v0_chat_id,
                versionId: generation.data.v0_version_id,
                error: generation.data.error_message,
                settings: (generation.data.generation_settings ?? {}) as GenerationSettings,
              }
            : null}
          initialQuota={quota}
        />
      )}
    </div>
  );
}

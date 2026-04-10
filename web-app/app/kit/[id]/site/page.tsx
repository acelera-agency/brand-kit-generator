import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getServerClient } from "@/lib/supabase";
import { SitePreview } from "./SitePreview";

export const dynamic = "force-dynamic";

export default async function SitePage({
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
    .select("id, owner_id, name, status")
    .eq("id", id)
    .single();

  if (!kitRow || kitRow.owner_id !== user.id) {
    notFound();
  }

  const { data: generation } = await supabase
    .from("site_generations")
    .select("id, status, demo_url, error_message, created_at")
    .eq("kit_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: progressRows } = await supabase
    .from("stage_progress")
    .select("stage_id, status")
    .eq("kit_id", id);

  const passedCount = (progressRows ?? []).filter(
    (r) => r.status === "passed",
  ).length;

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <header className="border-b border-rule pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-4 block">Optional site draft</p>
            <h1 className="font-display text-[clamp(2rem,4.5vw,3.6rem)] font-semibold leading-[0.95] tracking-tightest text-ink">
              {kitRow.name}
            </h1>
            <p className="mt-4 text-base text-muted-strong">
              Generate a branded site draft from the completed kit. The brand
              kit stays canonical; this page is a secondary extension of it.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/kit/${id}`}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Back to kit
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-10">
        <SitePreview
          kitId={id}
          passedCount={passedCount}
          generation={generation
            ? {
                id: generation.id,
                status: generation.status as "pending" | "generating" | "completed" | "failed",
                demoUrl: generation.demo_url,
                error: generation.error_message,
              }
            : null}
        />
      </section>
    </main>
  );
}

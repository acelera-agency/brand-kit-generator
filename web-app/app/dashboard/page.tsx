import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase";
import { DeleteKitButton } from "./DeleteKitButton";
import { StartKitButton } from "./StartKitButton";

export const dynamic = "force-dynamic";

type KitRow = {
  id: string;
  name: string;
  status: "draft" | "completed" | "published";
  created_at: string;
  updated_at: string;
};

const STATUS_LABEL: Record<KitRow["status"], string> = {
  draft: "Draft",
  completed: "Completed",
  published: "Published",
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
    .select("id, name, status, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[dashboard] failed to load kits", error);
  }

  const rows: KitRow[] = (kits ?? []) as KitRow[];

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <header className="flex flex-col gap-6 border-b border-rule pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-4 block">Workspace / brand kits</p>
          <h1 className="font-display text-[clamp(2rem,4.5vw,3.6rem)] font-semibold leading-[0.95] tracking-tightest text-ink">
            Your brand kits
          </h1>
          <p className="mt-4 max-w-[60ch] text-base text-muted-strong sm:text-lg">
            Each kit is one founder, one interview, one decision tool. Start a
            new kit to walk through the nine-stage interview from scratch.
          </p>
        </div>

        <StartKitButton />
      </header>

      <section className="mt-10">
        {rows.length === 0 ? (
          <div className="border border-dashed border-rule-strong bg-paper p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Empty workspace
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
              No kits yet.
            </h2>
            <p className="mx-auto mt-3 max-w-[48ch] text-sm text-muted-strong">
              Start your first kit to enter the interview. The full session
              takes 60 to 90 minutes — the artifact is a markdown file your
              team can paste into proposals on day one.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((kit) => (
              <li
                key={kit.id}
                className="flex flex-col border border-rule-strong bg-paper-pure p-5 shadow-[0_8px_28px_rgba(11,15,20,0.05)]"
              >
                <div className="flex items-center justify-between border-b border-rule pb-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    {STATUS_LABEL[kit.status]}
                  </p>
                  <p className="font-mono text-xs text-muted">
                    {kit.id.slice(0, 8)}
                  </p>
                </div>
                <h3 className="mt-4 font-display text-xl font-medium text-ink break-words">
                  {kit.name}
                </h3>
                <p className="mt-2 text-xs text-muted-strong">
                  Updated {formatDate(kit.updated_at)}
                </p>

                <div className="mt-6 flex items-end justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/interview/${kit.id}`}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      Continue
                    </Link>
                    {kit.status === "completed" || kit.status === "published" ? (
                      <>
                        <Link
                          href={`/kit/${kit.id}`}
                          className="btn-secondary px-4 py-2 text-sm"
                        >
                          View kit
                        </Link>
                        <Link
                          href={`/kit/${kit.id}/site`}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          Generate site
                        </Link>
                      </>
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

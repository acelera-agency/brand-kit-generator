import type { ReactNode } from "react";
import Link from "next/link";

type ToastState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | null;

type Props = {
  kitId: string;
  passedCount: number;
  toast: ToastState;
  children: ReactNode;
};

export function WorkspaceShell({ kitId, passedCount, toast, children }: Props) {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-rule bg-paper-pure">
        <div className="container-brand flex flex-col gap-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Interview workspace / kit {kitId.slice(0, 8)}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Progressive foundation workspace
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {passedCount} / 9 passed
            </p>
            <Link href="/dashboard" className="btn-secondary px-3 py-2 text-xs">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {toast ? (
        <div
          className={`border-b px-5 py-3 text-sm sm:px-8 ${
            toast.kind === "success"
              ? "border-accent bg-accent-soft text-ink"
              : "border-signal/40 bg-[#fff3ed] text-ink"
          }`}
        >
          <div className="container-brand">
            <span className="font-mono text-xs uppercase tracking-widest">
              {toast.kind === "success" ? "Updated" : "Error"}
            </span>
            {" -- "}
            {toast.message}
          </div>
        </div>
      ) : null}

      <div className="container-brand py-6 sm:py-8">{children}</div>
    </main>
  );
}

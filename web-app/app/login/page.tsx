import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase";

type SearchParams = Promise<{
  sent?: string;
  error?: string;
  next?: string;
}>;

async function requestMagicLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "").trim();

  if (!email) {
    redirect("/login?error=missing-email");
  }

  const headerList = await headers();
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "http://localhost:3001";

  const supabase = await getServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: next
        ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
        : `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?sent=1");
}

function getFeedback(copy: { sent?: string; error?: string }) {
  if (copy.sent === "1") {
    return {
      tone: "success",
      title: "Magic link sent",
      body: "Check your inbox and use the link to continue into the dashboard.",
    } as const;
  }

  if (copy.error) {
    return {
      tone: "error",
      title: "Could not send the link",
      body:
        copy.error === "missing-email"
          ? "Enter an email address to receive the magic link."
          : decodeURIComponent(copy.error),
    } as const;
  }

  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedback(resolvedSearchParams);

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <div className="grid gap-12 border border-rule-strong bg-paper-pure p-6 shadow-[0_18px_60px_rgba(11,15,20,0.08)] sm:p-10 lg:grid-cols-[1.2fr_0.9fr] lg:gap-16 lg:p-14">
        <section className="flex flex-col justify-between gap-10">
          <div>
            <p className="eyebrow mb-6 block">Access / magic link</p>
            <h1 className="max-w-[12ch] font-display text-[clamp(2.3rem,5vw,4.8rem)] font-semibold leading-[0.92] tracking-tightest text-ink">
              Enter the interview room without a password.
            </h1>
            <p className="mt-5 max-w-[56ch] text-base text-muted-strong sm:text-lg">
              This SaaS keeps the same editorial tone as the landing: clear
              stance, no dashboard theater, no account ceremony. Ask for the
              link, open your inbox, keep moving.
            </p>
          </div>

          <div className="grid gap-6 border-t border-rule pt-6 sm:grid-cols-3 sm:gap-8">
            <div>
              <p className="section-num">01</p>
              <p className="mt-3 font-display text-xl font-medium text-ink">
                One-click entry
              </p>
              <p className="mt-2 text-sm text-muted-strong">
                No remembered password, no setup maze, no extra UI noise.
              </p>
            </div>
            <div>
              <p className="section-num">02</p>
              <p className="mt-3 font-display text-xl font-medium text-ink">
                Session-first auth
              </p>
              <p className="mt-2 text-sm text-muted-strong">
                Middleware refreshes the Supabase session so protected routes can
                rely on cookies later.
              </p>
            </div>
            <div>
              <p className="section-num">03</p>
              <p className="mt-3 font-display text-xl font-medium text-ink">
                Built for the next step
              </p>
              <p className="mt-2 text-sm text-muted-strong">
                Successful sign-in lands on <code>/dashboard</code>, which is
                enough for this phase even before the screen exists.
              </p>
            </div>
          </div>
        </section>

        <section className="border border-rule-strong bg-paper p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-rule pb-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Authentication
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
                Send magic link
              </h2>
            </div>
            <div className="process-tag process-tag-active">Email OTP</div>
          </div>

          {feedback ? (
            <div
              className={`mt-6 border px-4 py-3 ${
                feedback.tone === "success"
                  ? "border-accent bg-accent-soft"
                  : "border-signal/40 bg-[#fff3ed]"
              }`}
            >
              <p className="font-mono text-xs uppercase tracking-widest text-ink">
                {feedback.title}
              </p>
              <p className="mt-2 text-sm text-muted-strong">{feedback.body}</p>
            </div>
          ) : null}

          <form action={requestMagicLink} className="mt-8 space-y-6">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Work email
              </span>
              <input
                type="email"
                name="email"
                required
                placeholder="name@company.com"
                className="mt-3 w-full border border-rule-strong bg-paper-pure px-4 py-4 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
              />
            </label>

            <input
              type="hidden"
              name="next"
              value={resolvedSearchParams.next ?? ""}
            />

            <button type="submit" className="btn-primary w-full">
              Email me the link
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-strong">
            By continuing, you enter the same flow that will power the guided
            interview and draft generation.
          </p>

          <div className="mt-8 flex items-center justify-between border-t border-rule pt-5 text-sm text-muted-strong">
            <span>No password to remember.</span>
            <Link href="/" className="btn-secondary px-4 py-2">
              Back home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

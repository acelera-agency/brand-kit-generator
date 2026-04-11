import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { acceptInvitation, getInvitationByToken, isInvitationExpired } from "@/lib/invitations";
import { normalizeEmail } from "@/lib/kit-collaboration";
import { getServerClient } from "@/lib/supabase";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  if (invitation.accepted_at) {
    redirect(`/kit/${invitation.kit_id}`);
  }

  if (isInvitationExpired(invitation.expires_at)) {
    return (
      <main className="container-brand min-h-screen py-10 sm:py-14">
        <section className="border border-rule-strong bg-paper p-8 sm:p-12">
          <p className="eyebrow mb-4 block">Invitation expired</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
            This invite is no longer valid.
          </h1>
          <p className="mt-4 max-w-[54ch] text-base text-muted-strong">
            Ask the kit owner to send a fresh invitation for {invitation.email}.
          </p>
        </section>
      </main>
    );
  }

  if (normalizeEmail(user.email ?? "") !== normalizeEmail(invitation.email)) {
    return (
      <main className="container-brand min-h-screen py-10 sm:py-14">
        <section className="border border-rule-strong bg-paper p-8 sm:p-12">
          <p className="eyebrow mb-4 block">Email mismatch</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
            Sign in with the invited email.
          </h1>
          <p className="mt-4 max-w-[54ch] text-base text-muted-strong">
            This invite was sent to <strong>{invitation.email}</strong>, but your current session is <strong>{user.email}</strong>.
          </p>
        </section>
      </main>
    );
  }

  const result = await acceptInvitation(token, user.id, user.email);
  if (result.ok) {
    redirect(`/kit/${result.kitId}`);
  }

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <section className="border border-rule-strong bg-paper p-8 sm:p-12">
        <p className="eyebrow mb-4 block">Could not accept invite</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
          The invitation could not be completed.
        </h1>
        <p className="mt-4 max-w-[54ch] text-base text-muted-strong">
          {result.error}
        </p>
        <div className="mt-6">
          <Link href="/dashboard" className="btn-secondary px-4 py-2 text-sm">
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

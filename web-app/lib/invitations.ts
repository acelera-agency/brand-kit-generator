import { normalizeEmail } from "./kit-collaboration";
import { getServiceClient } from "./supabase";

type InvitationRow = {
  id: string;
  kit_id: string;
  email: string;
  role: "editor" | "viewer";
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
};

export function isInvitationExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < Date.now();
}

export async function getInvitationByToken(token: string) {
  const svc = getServiceClient();

  const { data } = await svc
    .from("kit_invitations")
    .select("id, kit_id, email, role, expires_at, accepted_at, accepted_by")
    .eq("token", token)
    .maybeSingle<InvitationRow>();

  return data;
}

export async function acceptInvitation(
  token: string,
  userId: string,
  userEmail: string | null | undefined,
) {
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return { ok: false as const, status: 404, error: "Invitation not found" };
  }

  if (invitation.accepted_at) {
    return { ok: true as const, kitId: invitation.kit_id };
  }

  if (isInvitationExpired(invitation.expires_at)) {
    return { ok: false as const, status: 410, error: "Invitation expired" };
  }

  if (!userEmail || normalizeEmail(userEmail) !== normalizeEmail(invitation.email)) {
    return { ok: false as const, status: 403, error: "Invitation email mismatch" };
  }

  const svc = getServiceClient();
  const { data: existingMembership } = await svc
    .from("kit_members")
    .select("role")
    .eq("kit_id", invitation.kit_id)
    .eq("user_id", userId)
    .maybeSingle<{ role: "owner" | "editor" | "viewer" }>();

  const nextRole = existingMembership?.role === "owner"
    ? "owner"
    : invitation.role;

  await svc.from("kit_members").upsert(
    {
      kit_id: invitation.kit_id,
      user_id: userId,
      role: nextRole,
    },
    { onConflict: "kit_id,user_id" },
  );

  await svc
    .from("kit_invitations")
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by: userId,
      error_message: null,
    })
    .eq("id", invitation.id);

  return { ok: true as const, kitId: invitation.kit_id };
}

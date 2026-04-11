import { NextRequest, NextResponse } from "next/server";
import { sendInviteEmail } from "@/lib/email/resend";
import { normalizeEmail } from "@/lib/kit-collaboration";
import { requireKitRole, listUserEmails } from "@/lib/kit-server";
import { getServiceClient } from "@/lib/supabase";

type MemberRow = {
  user_id: string;
  role: "owner" | "editor" | "viewer";
  created_at: string;
};

type InviteRow = {
  id: string;
  email: string;
  role: "editor" | "viewer";
  expires_at: string;
  accepted_at: string | null;
  error_message: string | null;
  created_at: string;
};

async function buildMembersPayload(kitId: string, currentUserId: string) {
  const svc = getServiceClient();
  const [{ data: members }, { data: invites }] = await Promise.all([
    svc
      .from("kit_members")
      .select("user_id, role, created_at")
      .eq("kit_id", kitId)
      .order("created_at", { ascending: true })
      .returns<MemberRow[]>(),
    svc
      .from("kit_invitations")
      .select("id, email, role, expires_at, accepted_at, error_message, created_at")
      .eq("kit_id", kitId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .returns<InviteRow[]>(),
  ]);

  const emailByUserId = await listUserEmails((members ?? []).map((member) => member.user_id));

  return {
    members: (members ?? []).map((member) => ({
      userId: member.user_id,
      email: emailByUserId[member.user_id] ?? null,
      role: member.role,
      createdAt: member.created_at,
      isCurrentUser: member.user_id === currentUserId,
    })),
    invites: (invites ?? []).map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expires_at,
      error: invite.error_message,
      createdAt: invite.created_at,
    })),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitId } = await params;

  const access = await requireKitRole(kitId, "viewer");
  if (!access.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!access.kit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (access.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await buildMembersPayload(kitId, access.user.id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitId } = await params;

  const access = await requireKitRole(kitId, "owner");
  if (!access.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!access.kit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (access.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = normalizeEmail(String(body?.email ?? ""));
  const role = body?.role;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (role !== "editor" && role !== "viewer") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await buildMembersPayload(kitId, access.user.id);
  if (existing.members.some((member) => normalizeEmail(member.email ?? "") === email)) {
    return NextResponse.json(
      { error: "That user is already a member" },
      { status: 409 },
    );
  }

  const token = crypto.randomUUID().replaceAll("-", "");
  const svc = getServiceClient();
  const { data: invite, error } = await svc
    .from("kit_invitations")
    .insert({
      kit_id: kitId,
      email,
      role,
      token,
      invited_by: access.user.id,
    })
    .select("id, email, role, expires_at, accepted_at, error_message, created_at")
    .single<InviteRow>();

  if (error || !invite) {
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }

  let sent = true;
  let sendError: string | null = null;

  try {
    await sendInviteEmail({
      to: email,
      inviterName: access.user.email ?? "A teammate",
      kitName: access.kit.name,
      role,
      token,
    });
  } catch (err) {
    sent = false;
    sendError = err instanceof Error ? err.message : "Failed to send invite email";
    await svc
      .from("kit_invitations")
      .update({ error_message: sendError })
      .eq("id", invite.id);
  }

  return NextResponse.json(
    {
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expires_at,
        error: sendError,
        createdAt: invite.created_at,
      },
      sent,
    },
    { status: 201 },
  );
}

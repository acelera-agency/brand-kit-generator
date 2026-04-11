import { NextRequest, NextResponse } from "next/server";
import { requireKitRole } from "@/lib/kit-server";
import { getServiceClient } from "@/lib/supabase";

type MemberRow = {
  user_id: string;
  role: "owner" | "editor" | "viewer";
};

async function countOwners(kitId: string) {
  const svc = getServiceClient();
  const { data: owners } = await svc
    .from("kit_members")
    .select("user_id")
    .eq("kit_id", kitId)
    .eq("role", "owner");

  return owners?.length ?? 0;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { id: kitId, userId } = await params;

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
  const role = body?.role;
  if (role !== "owner" && role !== "editor" && role !== "viewer") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const svc = getServiceClient();
  const { data: member } = await svc
    .from("kit_members")
    .select("user_id, role")
    .eq("kit_id", kitId)
    .eq("user_id", userId)
    .maybeSingle<MemberRow>();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.role === "owner" && role !== "owner" && await countOwners(kitId) <= 1) {
    return NextResponse.json(
      { error: "Cannot demote the last owner" },
      { status: 400 },
    );
  }

  await svc
    .from("kit_members")
    .update({ role })
    .eq("kit_id", kitId)
    .eq("user_id", userId);

  return NextResponse.json({ userId, role });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { id: kitId, userId } = await params;

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

  const svc = getServiceClient();
  const { data: member } = await svc
    .from("kit_members")
    .select("user_id, role")
    .eq("kit_id", kitId)
    .eq("user_id", userId)
    .maybeSingle<MemberRow>();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.role === "owner" && await countOwners(kitId) <= 1) {
    return NextResponse.json(
      { error: "Cannot remove the last owner" },
      { status: 400 },
    );
  }

  await svc
    .from("kit_members")
    .delete()
    .eq("kit_id", kitId)
    .eq("user_id", userId);

  return NextResponse.json({ userId, removed: true });
}

import { NextRequest, NextResponse } from "next/server";
import { requireKitRole, listUserEmails } from "@/lib/kit-server";
import { getServiceClient } from "@/lib/supabase";

type IterationRow = {
  id: string;
  actor_id: string | null;
  turn_index: number;
  user_message: string | null;
  v0_message_id: string | null;
  v0_version_id: string | null;
  demo_url: string | null;
  status: "pending" | "running" | "completed" | "failed";
  error_message: string | null;
  tokens_charged: number | string;
  usage_synced_at: string | null;
  created_at: string;
};

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

  const { data: generation } = await access.supabase
    .from("site_generations")
    .select("id")
    .eq("kit_id", kitId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!generation) {
    return NextResponse.json({ iterations: [] });
  }

  const svc = getServiceClient();
  const { data: rows } = await svc
    .from("site_iterations")
    .select("id, actor_id, turn_index, user_message, v0_message_id, v0_version_id, demo_url, status, error_message, tokens_charged, usage_synced_at, created_at")
    .eq("generation_id", generation.id)
    .order("turn_index", { ascending: false })
    .returns<IterationRow[]>();

  const emailByUserId = await listUserEmails((rows ?? []).map((row) => row.actor_id ?? ""));

  return NextResponse.json({
    generationId: generation.id,
    iterations: (rows ?? []).map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      actorEmail: row.actor_id ? emailByUserId[row.actor_id] ?? null : null,
      turnIndex: row.turn_index,
      userMessage: row.user_message,
      messageId: row.v0_message_id,
      versionId: row.v0_version_id,
      demoUrl: row.demo_url,
      status: row.status,
      error: row.error_message,
      tokensCharged: Number(row.tokens_charged ?? 0),
      usageSyncedAt: row.usage_synced_at,
      createdAt: row.created_at,
    })),
  });
}

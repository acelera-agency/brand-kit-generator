import { notFound, redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase";
import type { BrandStage, StoredKitData } from "@/lib/types";
import {
  buildWorkspaceState,
  buildWorkspaceView,
  type StageProgressStatus,
  type WorkspaceMessageRecord,
} from "@/lib/workspace-view";
import { InterviewChat } from "@/app/interview/[kitId]/InterviewChat";

export const dynamic = "force-dynamic";

type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  stage_id: string;
  created_at: string;
};

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ kitId: string }>;
}) {
  const { kitId } = await params;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: kitRow } = await supabase
    .from("brand_kits")
    .select("id, owner_id, brand_stage, source_material, kit")
    .eq("id", kitId)
    .single();
  if (!kitRow || kitRow.owner_id !== user.id) {
    notFound();
  }
  const brandStage = (kitRow.brand_stage as BrandStage | null) ?? "new";

  const [{ data: rawMessages }, { data: progressRows }] = await Promise.all([
    supabase
      .from("interview_messages")
      .select("id, role, content, stage_id, created_at")
      .eq("kit_id", kitId)
      .order("created_at", { ascending: true }),
    supabase
      .from("stage_progress")
      .select("stage_id, status")
      .eq("kit_id", kitId),
  ]);

  const messages = ((rawMessages ?? []) as StoredMessage[])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

  const progressByStage = Object.fromEntries(
    (progressRows ?? []).map((row) => [
      row.stage_id,
      row.status as StageProgressStatus,
    ]),
  ) as Partial<Record<WorkspaceMessageRecord["stageId"], StageProgressStatus>>;

  const workspaceMessages: WorkspaceMessageRecord[] = ((rawMessages ?? []) as StoredMessage[])
    .filter(
      (
        message,
      ): message is StoredMessage & { stage_id: WorkspaceMessageRecord["stageId"] } =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.stage_id === "string",
    )
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      stageId: message.stage_id as WorkspaceMessageRecord["stageId"],
      createdAt: message.created_at,
    }));

  const approvedKit = ((kitRow.kit ?? {}) as StoredKitData) ?? {};
  const workspaceState = buildWorkspaceState(workspaceMessages, progressByStage);
  const workspaceView = buildWorkspaceView({
    approvedKit,
    workspaceState,
    progressByStage,
  });
  const passedCount = Object.values(progressByStage).filter(
    (status) => status === "passed",
  ).length;

  return (
    <InterviewChat
      kitId={kitId}
      brandStage={brandStage}
      hasSourceMaterial={
        typeof kitRow.source_material === "string" &&
        kitRow.source_material.length > 0
      }
      initialMessages={messages}
      initialPassedCount={passedCount}
      initialApprovedKit={approvedKit}
      initialWorkspaceState={workspaceState}
      initialProgressByStage={progressByStage}
      initialWorkspaceView={workspaceView}
    />
  );
}

import { redirect, notFound } from "next/navigation";
import { getServerClient } from "@/lib/supabase";
import { STAGE_ORDER } from "@/lib/stage-requirements";
import type { BrandStage } from "@/lib/types";
import { InterviewChat } from "./InterviewChat";

export const dynamic = "force-dynamic";

type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  stage_id: string;
  created_at: string;
};

export default async function InterviewPage({
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

  // Verify ownership and load brand_stage
  const { data: kitRow } = await supabase
    .from("brand_kits")
    .select("id, owner_id, brand_stage")
    .eq("id", kitId)
    .single();
  if (!kitRow || kitRow.owner_id !== user.id) {
    notFound();
  }
  const brandStage = (kitRow.brand_stage as BrandStage | null) ?? "new";

  // Load messages + progress
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

  // Filter out system messages from display (we only show user + assistant)
  const messages = ((rawMessages ?? []) as StoredMessage[])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const progressByStage = Object.fromEntries(
    (progressRows ?? []).map((p) => [p.stage_id, p.status]),
  );

  // Determine current stage:
  // 1. The stage marked "in-progress" (there should be one)
  // 2. Else: first stage that's not "passed"
  // 3. Else: stage_8 (everything passed — kit done)
  const inProgressStage = STAGE_ORDER.find(
    (s) => progressByStage[s] === "in-progress",
  );
  const firstNotPassed = STAGE_ORDER.find(
    (s) => progressByStage[s] !== "passed",
  );
  const currentStage = inProgressStage ?? firstNotPassed ?? "stage_8";

  const passedCount = STAGE_ORDER.filter(
    (s) => progressByStage[s] === "passed",
  ).length;

  return (
    <InterviewChat
      kitId={kitId}
      brandStage={brandStage}
      initialMessages={messages}
      initialStage={currentStage}
      initialPassedCount={passedCount}
    />
  );
}

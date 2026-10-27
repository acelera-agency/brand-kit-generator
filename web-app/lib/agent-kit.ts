import type { SupabaseClient } from "@supabase/supabase-js";
import { exportStoredKitForAgent, type AgentExportFormat } from "./agent-export";
import { STAGE_ORDER, type StageId } from "./stage-requirements";
import { getServiceClient } from "./supabase";
import { submitFounderTurn, type SubmitFounderTurnResult } from "./founder-turn";
import type { BrandStage, LiveSiteStatus, StoredKitData } from "./types";
import { getVisiblePhase, getVisiblePhaseStatus, type VisiblePhase } from "./visible-phase";
import { loadWorkspaceSnapshot } from "./workspace-snapshot";
import type { StageProgressStatus } from "./workspace-view";

export type AgentKitCreateInput = {
  email: string;
  name?: string;
  brandStage?: BrandStage;
  initialContext?: string;
  supabase?: SupabaseClient;
};

export type AgentKitCreateResult = {
  kitId: string;
  turn: SubmitFounderTurnResult | null;
};

export type AgentKitStatus = {
  kitId: string;
  approvedKit: StoredKitData;
  visiblePhase: VisiblePhase;
  visiblePhaseStatus: string;
  progressByStage: Partial<Record<StageId, StageProgressStatus>>;
  liveSite: LiveSiteStatus;
};

function adminClient(input?: { supabase?: SupabaseClient }) {
  return input?.supabase ?? getServiceClient();
}

async function assertAgentKitOwner(input: {
  supabase: SupabaseClient;
  kitId: string;
  userId: string;
}) {
  const { data: kit } = await input.supabase
    .from("brand_kits")
    .select("id, owner_id")
    .eq("id", input.kitId)
    .single<{ id: string; owner_id: string }>();

  if (!kit || kit.owner_id !== input.userId) {
    throw new Error("Kit not found for agent user.");
  }
}

export async function resolveAgentUserId(input: {
  email: string;
  supabase?: SupabaseClient;
}) {
  const supabase = adminClient(input);
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: input.email,
  });

  if (error) {
    throw error;
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("Agent user could not be resolved.");
  }

  return userId;
}

export async function createAgentKit(
  input: AgentKitCreateInput,
): Promise<AgentKitCreateResult> {
  const supabase = adminClient(input);
  const userId = await resolveAgentUserId({
    email: input.email,
    supabase,
  });
  const name =
    input.name?.trim() ||
    `Agent brand kit ${new Date().toISOString().slice(0, 19).replace("T", " ")}`;

  const { data: kit, error: kitError } = await supabase
    .from("brand_kits")
    .insert({
      owner_id: userId,
      status: "draft",
      kit: {},
      name: name.slice(0, 80),
      brand_stage: input.brandStage ?? "new",
      experience_mode: "guided",
      handoff_requested_at: null,
      draft_checkpoint: "none",
      inspiration_items: [],
      source_material: null,
      source_material_meta: {},
    })
    .select("id")
    .single<{ id: string }>();

  if (kitError || !kit) {
    throw kitError ?? new Error("Failed to create agent kit.");
  }

  const progressRows = STAGE_ORDER.map((stage_id) => ({
    kit_id: kit.id,
    stage_id,
    status: stage_id === "stage_0" ? "in-progress" : "empty",
  }));

  const { error: progressError } = await supabase
    .from("stage_progress")
    .insert(progressRows);
  if (progressError) {
    await supabase.from("brand_kits").delete().eq("id", kit.id);
    throw progressError;
  }

  const initialContext = input.initialContext?.trim();
  const turn = initialContext
    ? await submitFounderTurn({
        supabase,
        kitId: kit.id,
        userId,
        message: initialContext,
        source: "agent",
      })
    : null;

  return {
    kitId: kit.id,
    turn,
  };
}

export async function submitAgentKitTurn(input: {
  email: string;
  kitId: string;
  message: string;
  supabase?: SupabaseClient;
}) {
  const supabase = adminClient(input);
  const userId = await resolveAgentUserId({
    email: input.email,
    supabase,
  });
  await assertAgentKitOwner({
    supabase,
    kitId: input.kitId,
    userId,
  });

  return submitFounderTurn({
    supabase,
    kitId: input.kitId,
    userId,
    message: input.message,
    source: "agent",
  });
}

export async function getAgentKitStatus(input: {
  email: string;
  kitId: string;
  supabase?: SupabaseClient;
}): Promise<AgentKitStatus> {
  const supabase = adminClient(input);
  const userId = await resolveAgentUserId({
    email: input.email,
    supabase,
  });
  await assertAgentKitOwner({
    supabase,
    kitId: input.kitId,
    userId,
  });
  const [snapshot, liveSite] = await Promise.all([
    loadWorkspaceSnapshot(supabase, input.kitId),
    getLatestLiveSiteStatus(supabase, input.kitId),
  ]);

  return {
    kitId: input.kitId,
    approvedKit: snapshot.approvedKit,
    visiblePhase: getVisiblePhase(snapshot.progressByStage),
    visiblePhaseStatus: getVisiblePhaseStatus(snapshot.progressByStage),
    progressByStage: snapshot.progressByStage,
    liveSite,
  };
}

export async function exportAgentKit(input: {
  email: string;
  kitId: string;
  format: AgentExportFormat;
  supabase?: SupabaseClient;
}) {
  const supabase = adminClient(input);
  const userId = await resolveAgentUserId({
    email: input.email,
    supabase,
  });
  await assertAgentKitOwner({
    supabase,
    kitId: input.kitId,
    userId,
  });
  const { data: kit, error } = await supabase
    .from("brand_kits")
    .select("kit")
    .eq("id", input.kitId)
    .single<{ kit: StoredKitData | null }>();

  if (error || !kit) {
    throw error ?? new Error("Kit not found.");
  }

  return input.format === "markdown"
    ? exportStoredKitForAgent(kit.kit ?? {}, "markdown")
    : exportStoredKitForAgent(kit.kit ?? {}, "json");
}

async function getLatestLiveSiteStatus(
  supabase: SupabaseClient,
  kitId: string,
): Promise<LiveSiteStatus> {
  const { data } = await supabase
    .from("site_generations")
    .select("id, status, demo_url, error_message")
    .eq("kit_id", kitId)
    .eq("generation_mode", "progressive")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      status: "pending" | "generating" | "completed" | "failed";
      demo_url: string | null;
      error_message: string | null;
    }>();

  if (!data) {
    return { status: "none" };
  }

  return {
    status: data.status === "pending" ? "queued" : data.status,
    generationId: data.id,
    demoUrl: data.demo_url,
    error: data.error_message,
  };
}

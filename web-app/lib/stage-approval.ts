import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getDraftCheckpoint } from "@/lib/founder-experience";
import { buildGateSystemPrompt } from "@/lib/gate-prompt";
import { MODEL_GATE, getOpenAI } from "@/lib/openai";
import { queueProgressiveSiteUpdate } from "@/lib/progressive-site";
import {
  Stage0Schema,
  Stage1Schema,
  Stage2Schema,
  Stage3Schema,
  Stage4Schema,
  Stage5Schema,
  Stage6Schema,
  Stage7Schema,
  Stage8Schema,
} from "@/lib/schemas";
import { getStageRequirement, STAGE_ORDER, type StageId } from "@/lib/stage-requirements";
import type { BrandStage, DraftCheckpoint, LiveSiteStatus } from "@/lib/types";
import { loadWorkspaceSnapshot } from "@/lib/workspace-snapshot";
import type { StageProgressStatus, WorkspaceState } from "@/lib/workspace-view";
import type { StoredKitData } from "@/lib/types";

const STAGE_SCHEMAS = {
  stage_0: Stage0Schema,
  stage_1: Stage1Schema,
  stage_2: Stage2Schema,
  stage_3: Stage3Schema,
  stage_4: Stage4Schema,
  stage_5: Stage5Schema,
  stage_6: Stage6Schema,
  stage_7: Stage7Schema,
  stage_8: Stage8Schema,
} as const;

type ValidationIssue = {
  path: string;
  message: string;
};

export type StageApprovalSuccess = {
  passed: true;
  gateResult: { data: unknown };
  approvedKit: StoredKitData;
  progressByStage: Partial<Record<StageId, StageProgressStatus>>;
  workspaceState: WorkspaceState;
  draftCheckpoint: DraftCheckpoint;
  liveSite: LiveSiteStatus;
};

export type StageApprovalFailure = {
  passed: false;
  reason: string;
  status?: number;
  validationErrors?: ValidationIssue[];
};

export type StageApprovalResult = StageApprovalSuccess | StageApprovalFailure;

function isEmptyExtractionResult(parsed: unknown): boolean {
  if (parsed === null || parsed === undefined) return true;
  if (typeof parsed !== "object") return true;
  if (Array.isArray(parsed)) return parsed.length === 0;
  return Object.keys(parsed as Record<string, unknown>).length === 0;
}

export async function approveStage(input: {
  supabase: SupabaseClient;
  kitId: string;
  stageId: StageId;
  userId: string;
  sourceMessages?: string[];
  logPrefix?: string;
}): Promise<StageApprovalResult> {
  const { supabase, kitId, stageId, userId } = input;
  const logPrefix = input.logPrefix ?? "[stage-approval]";
  const schema = STAGE_SCHEMAS[stageId];

  const { data: kit } = await supabase
    .from("brand_kits")
    .select("id, owner_id, kit, brand_stage, source_material")
    .eq("id", kitId)
    .single();

  if (!kit || kit.owner_id !== userId) {
    return { passed: false, reason: "Forbidden", status: 403 };
  }

  const brandStage = (kit.brand_stage as BrandStage | null) ?? "new";
  const requirement = getStageRequirement(stageId, brandStage);

  const userMessages = input.sourceMessages?.length
    ? input.sourceMessages
    : await (async () => {
        const { data: messages } = await supabase
          .from("interview_messages")
          .select("role, content")
          .eq("kit_id", kitId)
          .eq("stage_id", stageId)
          .order("created_at", { ascending: true });

        return (messages ?? [])
          .filter(
            (message): message is { role: "user"; content: string } =>
              message.role === "user",
          )
          .map((message) => message.content);
      })();

  if (userMessages.length === 0) {
    return {
      passed: false,
      reason: requirement.lookingFor,
    };
  }

  let jsonSchema;
  try {
    jsonSchema = z.toJSONSchema(schema);
  } catch (error) {
    console.error(`${logPrefix} toJSONSchema failed`, error);
    return {
      passed: false,
      reason: "Schema conversion failed",
      status: 500,
    };
  }

  const openai = getOpenAI();
  let parsedJson: unknown;
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_GATE,
      messages: [
        {
          role: "system",
          content: buildGateSystemPrompt({
            stageId,
            requirement,
            userReplies: userMessages,
            sourceMaterial:
              typeof kit.source_material === "string" ? kit.source_material : null,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: stageId,
          schema: jsonSchema as Record<string, unknown>,
          strict: false,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { passed: false, reason: requirement.lookingFor };
    }
    parsedJson = JSON.parse(content);
  } catch (error) {
    console.error(`${logPrefix} extraction failed`, error);
    const message = error instanceof Error ? error.message : String(error);
    return { passed: false, reason: `Extraction failed: ${message}` };
  }

  if (isEmptyExtractionResult(parsedJson)) {
    return { passed: false, reason: requirement.lookingFor };
  }

  const validation = schema.safeParse(parsedJson);
  if (!validation.success) {
    return {
      passed: false,
      reason: requirement.lookingFor,
      validationErrors: validation.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const existingKit =
    kit.kit && typeof kit.kit === "object" && !Array.isArray(kit.kit)
      ? (kit.kit as Record<string, unknown>)
      : {};
  const merged = { ...existingKit, ...(validation.data as object) };

  const { error: updateError } = await supabase
    .from("brand_kits")
    .update({ kit: merged })
    .eq("id", kitId);
  if (updateError) {
    return {
      passed: false,
      reason: "Failed to persist approved kit data",
      status: 500,
    };
  }

  const stageIndex = STAGE_ORDER.indexOf(stageId);
  const nextStageId =
    stageIndex >= 0 && stageIndex < STAGE_ORDER.length - 1
      ? STAGE_ORDER[stageIndex + 1]
      : null;

  const progressUpserts: Array<{
    kit_id: string;
    stage_id: string;
    status: "passed" | "in-progress";
    passed_at?: string;
  }> = [
    {
      kit_id: kitId,
      stage_id: stageId,
      status: "passed",
      passed_at: new Date().toISOString(),
    },
  ];

  if (nextStageId) {
    progressUpserts.push({
      kit_id: kitId,
      stage_id: nextStageId,
      status: "in-progress",
    });
  }

  await supabase
    .from("stage_progress")
    .upsert(progressUpserts, { onConflict: "kit_id,stage_id" });

  const snapshot = await loadWorkspaceSnapshot(supabase, kitId);
  const draftCheckpoint = getDraftCheckpoint(snapshot.progressByStage);
  const complete = STAGE_ORDER.every(
    (candidateStageId) => snapshot.progressByStage[candidateStageId] === "passed",
  );

  await supabase
    .from("brand_kits")
    .update({
      draft_checkpoint: draftCheckpoint,
      status: complete ? "completed" : "draft",
    })
    .eq("id", kitId);

  let liveSite: LiveSiteStatus;
  try {
    liveSite = await queueProgressiveSiteUpdate({
      kitId,
      ownerId: kit.owner_id,
      actorId: userId,
      stageId,
      approvedKit: snapshot.approvedKit,
      sourceMessages: userMessages,
    });
  } catch (error) {
    console.error(`${logPrefix} progressive site queue failed`, error);
    liveSite = {
      status: "paused",
      sourceStageId: stageId,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    passed: true,
    gateResult: { data: validation.data },
    approvedKit: snapshot.approvedKit,
    progressByStage: snapshot.progressByStage,
    workspaceState: snapshot.workspaceState,
    draftCheckpoint,
    liveSite,
  };
}

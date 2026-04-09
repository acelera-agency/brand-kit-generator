import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MODEL_GATE, getOpenAI } from "@/lib/openai";
import { buildGateSystemPrompt } from "@/lib/gate-prompt";
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
import { getStageRequirement, STAGE_ORDER } from "@/lib/stage-requirements";
import { getServerClient } from "@/lib/supabase";
import type { BrandStage } from "@/lib/types";
import { isStageId, loadWorkspaceSnapshot } from "../../../_shared";

export const runtime = "nodejs";

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

function isEmptyExtractionResult(parsed: unknown): boolean {
  if (parsed === null || parsed === undefined) return true;
  if (typeof parsed !== "object") return true;
  if (Array.isArray(parsed)) return parsed.length === 0;
  return Object.keys(parsed as Record<string, unknown>).length === 0;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await context.params;
  if (!isStageId(cardId)) {
    return NextResponse.json({ error: "Unknown card" }, { status: 400 });
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { kitId } = (await req.json()) as { kitId?: string };
  if (!kitId) {
    return NextResponse.json({ error: "Missing kitId" }, { status: 400 });
  }

  const schema = STAGE_SCHEMAS[cardId];
  const { data: kit } = await supabase
    .from("brand_kits")
    .select("id, owner_id, kit, brand_stage, source_material")
    .eq("id", kitId)
    .single();
  if (!kit || kit.owner_id !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const brandStage = (kit.brand_stage as BrandStage | null) ?? "new";
  const requirement = getStageRequirement(cardId, brandStage);

  const { data: messages } = await supabase
    .from("interview_messages")
    .select("role, content")
    .eq("kit_id", kitId)
    .eq("stage_id", cardId)
    .order("created_at", { ascending: true });

  const userMessages = (messages ?? []).filter(
    (message): message is { role: "user"; content: string } =>
      message.role === "user",
  );
  if (userMessages.length === 0) {
    return NextResponse.json({
      passed: false,
      reason: requirement.lookingFor,
    });
  }

  let jsonSchema;
  try {
    jsonSchema = z.toJSONSchema(schema);
  } catch (error) {
    console.error("[workspace/approve] toJSONSchema failed", error);
    return NextResponse.json(
      { passed: false, reason: "Schema conversion failed" },
      { status: 500 },
    );
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
            stageId: cardId,
            requirement,
            userReplies: userMessages.map((message) => message.content),
            sourceMaterial:
              typeof kit.source_material === "string" ? kit.source_material : null,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: cardId,
          schema: jsonSchema as Record<string, unknown>,
          strict: false,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ passed: false, reason: requirement.lookingFor });
    }
    parsedJson = JSON.parse(content);
  } catch (error) {
    console.error("[workspace/approve] extraction failed", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ passed: false, reason: `Extraction failed: ${message}` });
  }

  if (isEmptyExtractionResult(parsedJson)) {
    return NextResponse.json({ passed: false, reason: requirement.lookingFor });
  }

  const validation = schema.safeParse(parsedJson);
  if (!validation.success) {
    return NextResponse.json({
      passed: false,
      reason: requirement.lookingFor,
      validationErrors: validation.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
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
    return NextResponse.json(
      { passed: false, reason: "Failed to persist approved kit data" },
      { status: 500 },
    );
  }

  const stageIndex = STAGE_ORDER.indexOf(cardId);
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
      stage_id: cardId,
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

  return NextResponse.json({
    passed: true,
    gateResult: { data: validation.data },
    ...(await loadWorkspaceSnapshot(supabase, kitId)),
  });
}

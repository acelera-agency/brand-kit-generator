import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAI, MODEL_GATE } from "@/lib/openai";
import { getServerClient } from "@/lib/supabase";
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
import {
  getStageRequirement,
  STAGE_ORDER,
  type StageId,
} from "@/lib/stage-requirements";
import { buildGateSystemPrompt } from "@/lib/gate-prompt";
import type { BrandStage } from "@/lib/types";

export const runtime = "nodejs";

const STAGE_SCHEMAS: Record<StageId, z.ZodTypeAny> = {
  stage_0: Stage0Schema,
  stage_1: Stage1Schema,
  stage_2: Stage2Schema,
  stage_3: Stage3Schema,
  stage_4: Stage4Schema,
  stage_5: Stage5Schema,
  stage_6: Stage6Schema,
  stage_7: Stage7Schema,
  stage_8: Stage8Schema,
};

function isStageId(value: unknown): value is StageId {
  return typeof value === "string" && value in STAGE_SCHEMAS;
}

function isEmptyExtractionResult(parsed: unknown): boolean {
  if (parsed === null || parsed === undefined) return true;
  if (typeof parsed !== "object") return true;
  if (Array.isArray(parsed)) return parsed.length === 0;
  return Object.keys(parsed as Record<string, unknown>).length === 0;
}

export async function POST(req: NextRequest) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { kitId?: string; stageId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { kitId, stageId } = body;
  if (!kitId || !stageId) {
    return NextResponse.json(
      { error: "Missing kitId or stageId" },
      { status: 400 },
    );
  }

  if (!isStageId(stageId)) {
    return NextResponse.json(
      { error: `Unknown stage: ${stageId}` },
      { status: 400 },
    );
  }

  const schema = STAGE_SCHEMAS[stageId];

  // Verify ownership and load brand_stage
  const { data: kit, error: kitErr } = await supabase
    .from("brand_kits")
    .select("id, owner_id, kit, brand_stage, source_material")
    .eq("id", kitId)
    .single();
  if (kitErr || !kit || kit.owner_id !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }
  const brandStage = (kit.brand_stage as BrandStage | null) ?? "new";
  const requirement = getStageRequirement(stageId, brandStage);

  // Load conversation messages for this specific stage
  const { data: messages } = await supabase
    .from("interview_messages")
    .select("role, content")
    .eq("kit_id", kitId)
    .eq("stage_id", stageId)
    .order("created_at", { ascending: true });

  // Filter to USER messages only — assistant text must never be extracted
  // as if it were the user's answer.
  const userMessages = (messages ?? []).filter(
    (m): m is { role: "user"; content: string } => m.role === "user",
  );

  if (userMessages.length === 0) {
    return NextResponse.json({
      passed: false,
      reason: requirement.lookingFor,
    });
  }

  // Convert the zod schema to JSON Schema for OpenAI's structured output.
  // strict:false because our schemas use .optional()/.refine() which strict
  // mode rejects — we re-validate with the full zod schema below.
  let jsonSchema;
  try {
    jsonSchema = z.toJSONSchema(schema);
  } catch (err) {
    console.error("[check-gate] toJSONSchema failed", err);
    return NextResponse.json(
      { passed: false, reason: "Schema conversion failed" },
      { status: 500 },
    );
  }

  // Build a single system prompt that contains the user's replies as a
  // delimited DATA block. We do NOT pass user messages as role:"user" to the
  // model — that would let an attacker inject instructions via input.
  const systemPrompt = buildGateSystemPrompt({
    stageId,
    requirement,
    userReplies: userMessages.map((message) => message.content),
    sourceMaterial:
      typeof kit.source_material === "string" ? kit.source_material : null,
  });

  const openai = getOpenAI();
  let parsedJson: unknown;
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_GATE,
      messages: [
        {
          role: "system",
          content: systemPrompt,
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
      return NextResponse.json({
        passed: false,
        reason: requirement.lookingFor,
      });
    }
    parsedJson = JSON.parse(content);
  } catch (err) {
    console.error("[check-gate] OpenAI parse failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        passed: false,
        reason: `Extraction failed: ${msg}`,
      },
      { status: 200 },
    );
  }

  // Empty object → the extractor decided there's not enough substance.
  // Return a clean "not yet" response with the user-friendly looking-for
  // text instead of running zod and surfacing technical validation errors.
  if (isEmptyExtractionResult(parsedJson)) {
    return NextResponse.json({
      passed: false,
      reason: requirement.lookingFor,
    });
  }

  // Belt-and-braces: validate with the full zod schema (including .refine()s)
  const validation = schema.safeParse(parsedJson);
  if (!validation.success) {
    return NextResponse.json({
      passed: false,
      reason: requirement.lookingFor,
      validationErrors: validation.error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Merge validated data into brand_kits.kit JSONB
  const existingKit =
    (kit.kit && typeof kit.kit === "object" && !Array.isArray(kit.kit)
      ? (kit.kit as Record<string, unknown>)
      : {}) ?? {};
  const merged = { ...existingKit, ...(validation.data as object) };

  const { error: updateErr } = await supabase
    .from("brand_kits")
    .update({ kit: merged })
    .eq("id", kitId);
  if (updateErr) {
    console.error("[check-gate] kit update failed", updateErr);
    return NextResponse.json(
      { passed: false, reason: "Failed to persist kit data" },
      { status: 500 },
    );
  }

  // Mark this stage as passed AND advance the next stage to in-progress.
  // Without the second upsert, the stream route's `currentStageId` lookup
  // would not find any stage marked in-progress and would fall back to
  // stage_0, causing all subsequent user messages to be tagged with the
  // wrong stage_id and the next stage's gate-check to find zero messages.
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

  const { error: progressErr } = await supabase
    .from("stage_progress")
    .upsert(progressUpserts, { onConflict: "kit_id,stage_id" });
  if (progressErr) {
    console.error("[check-gate] stage_progress upsert failed", progressErr);
  }

  return NextResponse.json({ passed: true, data: validation.data });
}

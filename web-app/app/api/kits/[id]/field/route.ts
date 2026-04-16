import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireKitRole } from "@/lib/kit-server";
import type { StoredKitData } from "@/lib/types";
import {
  FieldPathSchema,
  FIELD_TO_STAGE,
  invalidateLintForField,
  setFieldByPath,
  stageSliceForValidation,
  type EditableFieldPath,
  type StageIdForEdit,
} from "@/lib/kit-field-paths";
import {
  Stage0Schema,
  Stage1Schema,
  Stage2Schema,
  Stage6Schema,
} from "@/lib/schemas";
import type { ZodTypeAny } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  path: FieldPathSchema,
  value: z.string().min(1, "Value cannot be empty.").max(4000, "Value is too long."),
});

const STAGE_SCHEMAS: Record<StageIdForEdit, ZodTypeAny> = {
  stage_0: Stage0Schema,
  stage_1: Stage1Schema,
  stage_2: Stage2Schema,
  stage_6: Stage6Schema,
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const access = await requireKitRole(id, "editor");
  if (!access.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!access.kit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (access.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }

  const { path, value } = parsed.data;
  const fieldPath = path as EditableFieldPath;

  const { data: row, error: fetchErr } = await access.supabase
    .from("brand_kits")
    .select("kit")
    .eq("id", id)
    .single();
  if (fetchErr || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const current = (row.kit ?? {}) as StoredKitData;
  const updated = setFieldByPath(current, fieldPath, value);

  const stageId = FIELD_TO_STAGE[fieldPath];
  const schema = STAGE_SCHEMAS[stageId];
  const slice = stageSliceForValidation(updated, stageId);
  const validation = schema.safeParse(slice);
  const warnings = validation.success
    ? []
    : validation.error.issues.map((issue) => issue.message);

  const persisted = invalidateLintForField(updated, fieldPath);

  const { error: updateErr } = await access.supabase
    .from("brand_kits")
    .update({ kit: persisted, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, warnings });
}

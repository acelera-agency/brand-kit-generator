import { NextResponse } from "next/server";
import {
  buildInspirationContext,
  makeInspirationItem,
  parseInspirationItems,
} from "@/lib/founder-experience";
import {
  extractMaterialSources,
  type SourceMaterialPart,
} from "@/lib/material-ingestion";
import { getServerClient } from "@/lib/supabase";

export const runtime = "nodejs";

function getStringValue(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" ? value : null;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: kit } = await supabase
    .from("brand_kits")
    .select("id, owner_id, inspiration_items")
    .eq("id", id)
    .single();
  if (!kit || kit.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const pdfEntry = formData.get("pdf");
  const noteLabel = getStringValue(formData.get("noteLabel"))?.trim();

  let parts: SourceMaterialPart[];
  let warnings: string[];
  try {
    const result = await extractMaterialSources({
      url: getStringValue(formData.get("url")),
      rawText: getStringValue(formData.get("rawText")),
      githubRepo: getStringValue(formData.get("githubRepo")),
      pdfFile: pdfEntry instanceof File ? pdfEntry : null,
    });
    parts = result.parts;
    warnings = result.warnings;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Material extraction failed",
      },
      { status: 500 },
    );
  }

  if (parts.length === 0) {
    return NextResponse.json(
      {
        error:
          warnings[0] ??
          "Provide a link, pasted text, PDF, or public GitHub repo before saving inspiration.",
        warnings,
      },
      { status: 400 },
    );
  }

  const normalizedParts = parts.map((part) => {
    if (part.kind === "text" && noteLabel) {
      return { ...part, label: noteLabel };
    }
    return part;
  });

  const currentItems = parseInspirationItems(kit.inspiration_items);
  const appendedItems = normalizedParts.map((part) => makeInspirationItem(part));
  const inspirationItems = [...currentItems, ...appendedItems];
  const builtContext = buildInspirationContext(inspirationItems);

  const { error: updateError } = await supabase
    .from("brand_kits")
    .update({
      inspiration_items: inspirationItems,
      source_material: builtContext.sourceMaterial,
      source_material_meta: builtContext.sourceMaterialMeta,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to save inspiration" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    inspirationItems,
    sourceMaterialMeta: builtContext.sourceMaterialMeta,
    warnings,
  });
}

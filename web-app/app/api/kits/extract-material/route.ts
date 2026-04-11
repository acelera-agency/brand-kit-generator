import { NextResponse } from "next/server";
import {
  buildSourceMaterial,
  extractMaterialSources,
  type SourceMaterialPart,
} from "@/lib/material-ingestion";
import { makeInspirationItem } from "@/lib/founder-experience";
import { getServerClient } from "@/lib/supabase";

export const runtime = "nodejs";

function getStringValue(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" ? value : null;
}

export async function POST(req: Request) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const pdfEntry = formData.get("pdf");

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
  } catch (err) {
    console.error("[extract-material] extraction failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Material extraction failed" },
      { status: 500 },
    );
  }

  if (parts.length === 0) {
    return NextResponse.json(
      {
        error:
          warnings[0] ??
          "Provide at least one website, pasted text, PDF, or public GitHub repo.",
        warnings,
      },
      { status: 400 },
    );
  }

  const result = buildSourceMaterial(parts);

  return NextResponse.json({
    sourceMaterial: result.sourceMaterial,
    sourceMaterialMeta: {
      ...result.sourceMaterialMeta,
      warnings: [...result.sourceMaterialMeta.warnings, ...warnings],
    },
    inspirationItems: parts.map((part) => makeInspirationItem(part)),
  });
}

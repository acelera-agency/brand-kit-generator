import { NextResponse } from "next/server";
import {
  buildSourceMaterial,
  extractMaterialSources,
} from "@/lib/material-ingestion";
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

  const formData = await req.formData();
  const pdfEntry = formData.get("pdf");

  const { parts, warnings } = await extractMaterialSources({
    url: getStringValue(formData.get("url")),
    rawText: getStringValue(formData.get("rawText")),
    githubRepo: getStringValue(formData.get("githubRepo")),
    pdfFile: pdfEntry instanceof File ? pdfEntry : null,
  });

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
  });
}

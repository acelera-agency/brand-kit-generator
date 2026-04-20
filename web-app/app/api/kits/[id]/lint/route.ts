import { NextRequest, NextResponse } from "next/server";
import { requireKitRole } from "@/lib/kit-server";
import type {
  StoredKitData,
  VoiceLintResult,
  VoiceLintSectionResult,
} from "@/lib/types";
import { hashVoiceRules, lintAgainstVoice } from "@/lib/voice-lint";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
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

  const { data: kitRow, error: kitErr } = await access.supabase
    .from("brand_kits")
    .select("kit")
    .eq("id", id)
    .single();

  if (kitErr || !kitRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const kit = (kitRow.kit ?? {}) as StoredKitData;
  if (!kit.voice) {
    return NextResponse.json(
      {
        error:
          "Voice rules aren't defined yet. Finish Stage 5 before running a voice review.",
      },
      { status: 400 },
    );
  }

  const voice = kit.voice;
  const voiceHash = hashVoiceRules(voice);

  const contextResult: VoiceLintSectionResult | undefined = kit.beforeAfter
    ? await lintAgainstVoice({
        target: kit.beforeAfter,
        targetLabel: "Context",
        voice,
      })
    : undefined;

  const templateResults: Record<string, VoiceLintSectionResult> = {};
  if (kit.templates) {
    const t = kit.templates;
    templateResults.homepageHero = await lintAgainstVoice({
      target: [t.homepageHero.eyebrow, t.homepageHero.h1, t.homepageHero.subhead]
        .filter(Boolean)
        .join("\n"),
      targetLabel: "Homepage hero",
      voice,
    });
    templateResults.coldOutreachBody = await lintAgainstVoice({
      target: t.coldOutreach.body,
      targetLabel: "Cold outreach body",
      voice,
    });
    templateResults.firstMinute = await lintAgainstVoice({
      target: t.firstMinute.script,
      targetLabel: "First-minute script",
      voice,
    });
    templateResults.linkedinBio = await lintAgainstVoice({
      target: t.socialBios.linkedin,
      targetLabel: "LinkedIn bio",
      voice,
    });
  }

  const lint: VoiceLintResult = {
    generatedAt: new Date().toISOString(),
    voiceHash,
    sections: {
      ...(contextResult ? { context: contextResult } : {}),
      ...(Object.keys(templateResults).length > 0
        ? { templates: templateResults }
        : {}),
    },
  };

  const updatedKit: StoredKitData = { ...kit, lint };

  const { error: updateErr } = await access.supabase
    .from("brand_kits")
    .update({ kit: updatedKit, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ lint });
}

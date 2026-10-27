import { NextResponse } from "next/server";
import { parseDemoStartInput, buildDemoKitName } from "@/lib/demo-start";
import { getDemoUserEmail, isDemoModeEnabled } from "@/lib/demo-mode";
import { submitFounderTurn } from "@/lib/founder-turn";
import { STAGE_ORDER } from "@/lib/stage-requirements";
import { getServerClient, getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

async function createDemoSession(email: string) {
  const admin = getServiceClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error) {
    throw error;
  }

  const token = data.properties?.email_otp;
  if (!token) {
    throw new Error("Supabase did not return an email OTP.");
  }

  const supabase = await getServerClient();
  let { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "magiclink",
  });

  if (verifyError?.code === "otp_expired") {
    const retry = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    verifyError = retry.error;
  }

  if (verifyError) {
    throw verifyError;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw userError ?? new Error("Demo session did not produce a user.");
  }

  return { supabase, user };
}

export async function POST(request: Request) {
  if (!isDemoModeEnabled()) {
    return NextResponse.json({ error: "Demo mode is not available" }, { status: 404 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseDemoStartInput(parsedBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  let email: string;
  try {
    email = getDemoUserEmail() ?? "";
  } catch (error) {
    console.error("[demo/start] invalid demo config", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid demo config" },
      { status: 500 },
    );
  }

  try {
    const { user } = await createDemoSession(email);
    const admin = getServiceClient();

    const { data: kit, error: kitError } = await admin
      .from("brand_kits")
      .insert({
        owner_id: user.id,
        status: "draft",
        kit: {},
        name: buildDemoKitName(parsed.brandName),
        brand_stage: "new",
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
      throw kitError ?? new Error("Failed to create demo kit.");
    }

    const progressRows = STAGE_ORDER.map((stage_id) => ({
      kit_id: kit.id,
      stage_id,
      status: stage_id === "stage_0" ? "in-progress" : "empty",
    }));

    const { error: progressError } = await admin
      .from("stage_progress")
      .insert(progressRows);
    if (progressError) {
      await admin.from("brand_kits").delete().eq("id", kit.id);
      throw progressError;
    }

    const turn = await submitFounderTurn({
      supabase: admin,
      kitId: kit.id,
      userId: user.id,
      message: parsed.context,
      source: "ui",
    });

    if (turn.appliedStages.length === 0) {
      return NextResponse.json(turn, { status: 422 });
    }

    return NextResponse.json({
      kitId: kit.id,
      interviewUrl: `/interview/${kit.id}?demo=1`,
      liveSite: turn.liveSite ?? { status: "none" },
      turn,
    });
  } catch (error) {
    console.error("[demo/start] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start demo" },
      { status: 500 },
    );
  }
}

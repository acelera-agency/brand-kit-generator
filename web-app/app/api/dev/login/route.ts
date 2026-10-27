import { NextResponse } from "next/server";
import { getDevLoginConfig, normalizeDevNextPath } from "@/lib/dev-auth";
import { getServerClient, getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

async function createDevSession(email: string) {
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
}

export async function GET(request: Request) {
  const config = getDevLoginConfig(process.env);
  if (!config.enabled) {
    return NextResponse.json(
      { error: "Dev login is not available", reason: config.reason },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const next = normalizeDevNextPath(url.searchParams.get("next"));

  try {
    await createDevSession(config.email);
    return NextResponse.redirect(new URL(next, request.url), 303);
  } catch (err) {
    console.error("[dev/login] failed to create dev session", err);
    return NextResponse.json(
      { error: "Failed to create dev session" },
      { status: 500 },
    );
  }
}

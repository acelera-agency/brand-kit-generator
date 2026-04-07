import { NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTIFY_TO = process.env.WAITLIST_NOTIFY_TO || "hello@acelera.agency";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email).trim().toLowerCase()
      : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  if (!process.env.RESEND_API_KEY) {
    // Local development without an API key — log and succeed so the form
    // is still testable end-to-end.
    console.log(`[waitlist] (no RESEND_API_KEY) signup: ${email}`);
    return NextResponse.json({ ok: true });
  }

  // Lazy-instantiate so the module load doesn't crash when the env var
  // is missing (e.g., during local dev or unrelated route handlers).
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "Brand Kit Generator <onboarding@resend.dev>",
      to: NOTIFY_TO,
      subject: `New waitlist signup: ${email}`,
      text: `${email} joined the brand-kit-generator waitlist.`,
    });
  } catch (err) {
    console.error("[waitlist] resend error:", err);
    return NextResponse.json(
      { error: "Could not record signup. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

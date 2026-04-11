import { Resend } from "resend";
import { buildInviteEmailHtml } from "./templates/invite";

let resend: Resend | null = null;

export function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

type SendInviteEmailInput = {
  to: string;
  inviterName: string;
  kitName: string;
  role: string;
  token: string;
};

export async function sendInviteEmail({
  to,
  inviterName,
  kitName,
  role,
  token,
}: SendInviteEmailInput) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const from = process.env.RESEND_FROM_EMAIL;

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not set");
  }

  const inviteUrl = `${appUrl}/invite/${token}`;

  return getResend().emails.send({
    from,
    to,
    subject: `${inviterName} invited you to ${kitName}`,
    html: buildInviteEmailHtml({
      inviterName,
      kitName,
      role,
      inviteUrl,
    }),
  });
}

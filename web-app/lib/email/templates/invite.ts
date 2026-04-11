type InviteTemplateProps = {
  inviterName: string;
  kitName: string;
  role: string;
  inviteUrl: string;
};

export function buildInviteEmailHtml({
  inviterName,
  kitName,
  role,
  inviteUrl,
}: InviteTemplateProps) {
  return `
    <div style="background:#f7f5ef;padding:32px;font-family:Georgia,serif;color:#0b0f14;line-height:1.5;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(11,15,20,0.12);padding:32px;">
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6c737d;">Brand Kit Generator</p>
        <h1 style="margin:0 0 16px;font-size:32px;line-height:1;">You were invited to collaborate.</h1>
        <p style="margin:0 0 16px;font-size:16px;">
          <strong>${inviterName}</strong> invited you to join <strong>${kitName}</strong> as <strong>${role}</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:16px;color:#37414d;">
          Open the invitation, sign in with the invited email, and you will land directly inside the shared kit.
        </p>
        <a href="${inviteUrl}" style="display:inline-block;background:#0b0f14;color:#f7f5ef;text-decoration:none;padding:14px 20px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;">
          Open invitation
        </a>
        <p style="margin:24px 0 0;font-size:13px;color:#6c737d;">
          If the button does not open, use this link:<br />
          <a href="${inviteUrl}" style="color:#0b0f14;">${inviteUrl}</a>
        </p>
      </div>
    </div>
  `;
}

import type { KitRole } from "@/lib/kit-collaboration";
import type { MembersData } from "./types";

type Props = {
  data: MembersData;
  currentUserRole: KitRole | null;
  open: boolean;
  inviteEmail: string;
  inviteRole: "editor" | "viewer";
  inviting: boolean;
  managingMemberId: string | null;
  onToggle: () => void;
  onInviteEmailChange: (value: string) => void;
  onInviteRoleChange: (value: "editor" | "viewer") => void;
  onInviteSubmit: () => void;
  onChangeMemberRole: (userId: string, role: KitRole) => void;
  onRemoveMember: (userId: string) => void;
};

export function MembersPanel({
  data,
  currentUserRole,
  open,
  inviteEmail,
  inviteRole,
  inviting,
  managingMemberId,
  onToggle,
  onInviteEmailChange,
  onInviteRoleChange,
  onInviteSubmit,
  onChangeMemberRole,
  onRemoveMember,
}: Props) {
  const canManage = currentUserRole === "owner";

  return (
    <section className="border border-rule-strong bg-paper p-5 sm:p-6">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Members
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
            Shared access
          </h2>
        </div>

        <span className="btn-secondary px-3 py-2 text-xs">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open ? (
        <div className="mt-5 space-y-5">
          <div className="space-y-3">
            {data.members.map((member) => (
              <div
                key={member.userId}
                className="flex flex-col gap-3 border border-rule bg-paper-pure px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {member.email ?? member.userId}
                    {member.isCurrentUser ? " (you)" : ""}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                    {member.role}
                  </p>
                </div>

                {canManage && !member.isCurrentUser ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={member.role}
                      disabled={managingMemberId === member.userId}
                      onChange={(event) =>
                        onChangeMemberRole(
                          member.userId,
                          event.target.value as KitRole,
                        )
                      }
                      className="border border-rule-strong bg-paper px-3 py-2 text-sm text-ink outline-none"
                    >
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    <button
                      type="button"
                      disabled={managingMemberId === member.userId}
                      onClick={() => onRemoveMember(member.userId)}
                      className="btn-secondary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {data.invites.length > 0 ? (
            <div className="space-y-3 border-t border-rule pt-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                Pending invites
              </p>
              {data.invites.map((invite) => (
                <div
                  key={invite.id}
                  className="border border-rule bg-paper-pure px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{invite.email}</p>
                    <span className="process-tag">pending</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                    {invite.role}
                  </p>
                  {invite.error ? (
                    <p className="mt-2 text-sm text-[#a13c1d]">{invite.error}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {canManage ? (
            <form
              className="space-y-3 border-t border-rule pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                onInviteSubmit();
              }}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                Invite collaborator
              </p>
              <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => onInviteEmailChange(event.target.value)}
                  placeholder="name@company.com"
                  className="border border-rule-strong bg-paper-pure px-4 py-3 text-sm text-ink outline-none placeholder:text-muted"
                />
                <select
                  value={inviteRole}
                  onChange={(event) =>
                    onInviteRoleChange(event.target.value as "editor" | "viewer")
                  }
                  className="border border-rule-strong bg-paper px-3 py-3 text-sm text-ink outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="btn-primary px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {inviting ? "Sending..." : "Send invite"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

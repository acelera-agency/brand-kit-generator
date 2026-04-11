export type KitRole = "owner" | "editor" | "viewer";

const ROLE_RANK: Record<KitRole, number> = {
  viewer: 0,
  editor: 1,
  owner: 2,
};

export function hasKitRole(
  currentRole: KitRole | null | undefined,
  minimumRole: KitRole,
) {
  if (!currentRole) {
    return false;
  }

  return ROLE_RANK[currentRole] >= ROLE_RANK[minimumRole];
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { hasKitRole, type KitRole } from "./kit-collaboration";
import { getServerClient, getServiceClient } from "./supabase";

type AuthenticatedUser = {
  id: string;
  email: string | null;
};

export type KitSummary = {
  id: string;
  ownerId: string;
  name: string;
  status: string;
};

type RoleRow = {
  role: KitRole;
};

type KitRow = {
  id: string;
  owner_id: string;
  name: string;
  status: string;
};

export async function getKitRoleForUser(
  supabase: SupabaseClient,
  kitId: string,
  userId: string,
): Promise<KitRole | null> {
  const { data: membership } = await supabase
    .from("kit_members")
    .select("role")
    .eq("kit_id", kitId)
    .eq("user_id", userId)
    .maybeSingle<RoleRow>();

  return membership?.role ?? null;
}

export async function getKitAccess(kitId: string) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, kit: null, role: null as KitRole | null };
  }

  const { data: kit } = await supabase
    .from("brand_kits")
    .select("id, owner_id, name, status")
    .eq("id", kitId)
    .maybeSingle<KitRow>();

  if (!kit) {
    return {
      supabase,
      user: { id: user.id, email: user.email ?? null } satisfies AuthenticatedUser,
      kit: null,
      role: null as KitRole | null,
    };
  }

  const role = await getKitRoleForUser(supabase, kitId, user.id);

  return {
    supabase,
    user: { id: user.id, email: user.email ?? null } satisfies AuthenticatedUser,
    kit: {
      id: kit.id,
      ownerId: kit.owner_id,
      name: kit.name,
      status: kit.status,
    } satisfies KitSummary,
    role,
  };
}

export async function requireKitRole(kitId: string, minimumRole: KitRole) {
  const access = await getKitAccess(kitId);

  if (!access.user || !access.kit) {
    return access;
  }

  if (!hasKitRole(access.role, minimumRole)) {
    return {
      ...access,
      forbidden: true as const,
    };
  }

  return {
    ...access,
    forbidden: false as const,
  };
}

export async function listUserEmails(userIds: string[]) {
  const svc = getServiceClient();
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  const entries = await Promise.all(
    uniqueIds.map(async (userId) => {
      const { data } = await svc.auth.admin.getUserById(userId);
      return [userId, data.user?.email ?? null] as const;
    }),
  );

  return Object.fromEntries(entries);
}

import { getServiceClient } from "./supabase";
import { getUsageForMessage } from "./v0-client";
import type { V0UsageCosts } from "./v0-client";

type TokenQuotaRow = {
  user_id: string;
  monthly_limit: number | string;
  current_month_used: number | string;
  current_month_start: string;
};

export type TokenQuotaSummary = {
  used: number;
  limit: number;
  remaining: number;
  monthStart: string;
};

function getCurrentMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

function toSummary(row: TokenQuotaRow): TokenQuotaSummary {
  const used = Number(row.current_month_used ?? 0);
  const limit = Number(row.monthly_limit ?? 0);

  return {
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    monthStart: row.current_month_start,
  };
}

export function costToTokens(totalCost: number) {
  return Math.max(0, Math.ceil(totalCost));
}

async function loadQuotaRow(userId: string): Promise<TokenQuotaRow> {
  const svc = getServiceClient();

  let { data: row } = await svc
    .from("token_quota")
    .select("user_id, monthly_limit, current_month_used, current_month_start")
    .eq("user_id", userId)
    .maybeSingle<TokenQuotaRow>();

  if (!row) {
    const { data: inserted } = await svc
      .from("token_quota")
      .upsert({ user_id: userId }, { onConflict: "user_id" })
      .select("user_id, monthly_limit, current_month_used, current_month_start")
      .single<TokenQuotaRow>();

    if (!inserted) {
      throw new Error("Failed to initialize token quota row");
    }

    row = inserted;
  }

  const currentMonthStart = getCurrentMonthStart();
  if (row.current_month_start < currentMonthStart) {
    const { data: resetRow } = await svc
      .from("token_quota")
      .update({
        current_month_used: 0,
        current_month_start: currentMonthStart,
      })
      .eq("user_id", userId)
      .select("user_id, monthly_limit, current_month_used, current_month_start")
      .single<TokenQuotaRow>();

    if (!resetRow) {
      throw new Error("Failed to reset token quota row");
    }

    row = resetRow;
  }

  return row;
}

export async function getOrInitQuota(userId: string): Promise<TokenQuotaSummary> {
  const row = await loadQuotaRow(userId);
  return toSummary(row);
}

export async function reserveTokens(userId: string, estimate: number) {
  await getOrInitQuota(userId);

  const svc = getServiceClient();
  const { data, error } = await svc.rpc("claim_token_budget", {
    p_user_id: userId,
    p_estimate: estimate,
  });

  if (error) {
    throw error;
  }

  return { ok: Boolean(data) };
}

export async function refundTokens(userId: string, amount: number) {
  if (amount <= 0) {
    return;
  }

  const quota = await getOrInitQuota(userId);
  const svc = getServiceClient();

  await svc
    .from("token_quota")
    .update({ current_month_used: Math.max(quota.used - amount, 0) })
    .eq("user_id", userId);
}

export async function chargeRealCost(
  userId: string,
  iterationId: string,
  usage: V0UsageCosts,
) {
  const svc = getServiceClient();
  const { data: iteration } = await svc
    .from("site_iterations")
    .select("tokens_charged")
    .eq("id", iterationId)
    .single<{ tokens_charged: number | string }>();

  const reserved = Number(iteration?.tokens_charged ?? 0);
  const tokensCharged = costToTokens(usage.totalCost);
  const quota = await getOrInitQuota(userId);

  await svc
    .from("token_quota")
    .update({
      current_month_used: Math.max(quota.used + tokensCharged - reserved, 0),
    })
    .eq("user_id", userId);

  await svc
    .from("site_iterations")
    .update({
      prompt_cost: usage.promptCost,
      completion_cost: usage.completionCost,
      total_cost: usage.totalCost,
      tokens_charged: tokensCharged,
      usage_synced_at: new Date().toISOString(),
    })
    .eq("id", iterationId);

  return tokensCharged;
}

export async function syncUsageForIteration(
  userId: string,
  iterationId: string,
  chatId: string,
  messageId: string,
) {
  const usage = await getUsageForMessage(chatId, messageId);
  if (!usage) {
    return null;
  }

  await chargeRealCost(userId, iterationId, usage);
  return usage;
}

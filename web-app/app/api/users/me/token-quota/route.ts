import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { getOrInitQuota } from "@/lib/token-quota";

export async function GET() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quota = await getOrInitQuota(user.id);
  return NextResponse.json(quota);
}

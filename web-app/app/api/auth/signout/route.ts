import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = await getServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), 303);
}

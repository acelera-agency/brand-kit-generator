import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase";
import { CreateKitWizard } from "./CreateKitWizard";

export const dynamic = "force-dynamic";

export default async function NewKitPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return <CreateKitWizard />;
}

import { notFound } from "next/navigation";
import { getDemoFallbackUrl, isDemoModeEnabled } from "@/lib/demo-mode";
import { DemoStartClient } from "./DemoStartClient";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  if (!isDemoModeEnabled()) {
    notFound();
  }

  return <DemoStartClient fallbackUrl={getDemoFallbackUrl()} />;
}

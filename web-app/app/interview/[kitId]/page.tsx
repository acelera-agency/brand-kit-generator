import { notFound, redirect } from "next/navigation";
import { getDemoFallbackUrl, isDemoModeEnabled } from "@/lib/demo-mode";
import { getDraftCheckpoint } from "@/lib/founder-experience";
import type {
  BrandStage,
  DraftCheckpoint,
  ExperienceMode,
} from "@/lib/types";
import { getServerClient } from "@/lib/supabase";
import { loadWorkspaceSnapshot } from "@/app/api/workspace/_shared";
import { getProgressiveSiteStatus } from "@/lib/progressive-site";
import { FounderInterviewFlow } from "./FounderInterviewFlow";

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ kitId: string }>;
  searchParams?: Promise<{ demo?: string }>;
}) {
  const { kitId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: kitRow } = await supabase
    .from("brand_kits")
    .select(
      "id, owner_id, name, brand_stage, experience_mode, handoff_requested_at, draft_checkpoint",
    )
    .eq("id", kitId)
    .single();
  if (!kitRow || kitRow.owner_id !== user.id) {
    notFound();
  }

  const [snapshot, liveSite] = await Promise.all([
    loadWorkspaceSnapshot(supabase, kitId),
    getProgressiveSiteStatus(kitId),
  ]);
  const demoFallbackUrl =
    resolvedSearchParams.demo === "1" && isDemoModeEnabled()
      ? getDemoFallbackUrl()
      : null;

  return (
    <FounderInterviewFlow
      kitId={kitId}
      kitName={kitRow.name}
      brandStage={(kitRow.brand_stage as BrandStage | null) ?? "new"}
      experienceMode={
        ((kitRow.experience_mode as ExperienceMode | null) ?? "guided")
      }
      handoffRequestedAt={
        typeof kitRow.handoff_requested_at === "string"
          ? kitRow.handoff_requested_at
          : null
      }
      initialApprovedKit={snapshot.approvedKit}
      initialProgressByStage={snapshot.progressByStage}
      initialWorkspaceState={snapshot.workspaceState}
      initialDraftCheckpoint={
        ((kitRow.draft_checkpoint as DraftCheckpoint | null) ??
          getDraftCheckpoint(snapshot.progressByStage))
      }
      initialInspirationItems={snapshot.inspirationItems}
      initialLiveSite={liveSite}
      demoFallbackUrl={demoFallbackUrl}
    />
  );
}

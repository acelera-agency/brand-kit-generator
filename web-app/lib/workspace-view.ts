import { STAGE_LABELS, STAGE_ORDER, type StageId } from "./stage-requirements";
import type { StoredKitData } from "./types";

export type StageProgressStatus = "empty" | "in-progress" | "passed";

export type WorkspaceMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  stageId: StageId;
  createdAt: string;
};

type WorkspaceMessageSnapshot = {
  id: string;
  content: string;
  createdAt: string;
};

export type WorkspaceState = {
  latestAssistantByStage: Partial<Record<StageId, WorkspaceMessageSnapshot>>;
  latestUserByStage: Partial<Record<StageId, WorkspaceMessageSnapshot>>;
  reviewedAssistantIdByStage: Partial<Record<StageId, string>>;
};

export type EditableCardView = {
  stageId: StageId;
  title: string;
  status: "passed" | "active" | "locked";
  progress: StageProgressStatus;
  preview: string[];
  hasFreshDraft: boolean;
};

export type FoundationCardView = EditableCardView;

export type ManualModuleView = EditableCardView;

export type HomepageDraftView = {
  hero: { eyebrow: string };
  title: string;
  description: string;
  primaryCta: string;
};

export type WorkspaceView = {
  activeStageId: StageId;
  foundationCards: FoundationCardView[];
  homepageDraft: HomepageDraftView | null;
  manualModules: ManualModuleView[];
};

const FOUNDATION_STAGE_IDS: StageId[] = [
  "stage_0",
  "stage_1",
  "stage_2",
  "stage_3",
  "stage_4",
];

const MANUAL_STAGE_IDS: StageId[] = ["stage_5", "stage_6", "stage_7", "stage_8"];

const MANUAL_LABELS: Record<StageId, string> = {
  stage_0: "Context",
  stage_1: "Enemy",
  stage_2: "Stack",
  stage_3: "Positioning",
  stage_4: "ICP",
  stage_5: "Voice",
  stage_6: "Templates",
  stage_7: "Visual",
  stage_8: "Rules",
};

export function getActiveStageId(
  progressByStage: Partial<Record<StageId, StageProgressStatus>>,
): StageId {
  const inProgressStage = STAGE_ORDER.find(
    (stageId) => progressByStage[stageId] === "in-progress",
  );
  if (inProgressStage) {
    return inProgressStage;
  }

  const firstNotPassed = STAGE_ORDER.find(
    (stageId) => progressByStage[stageId] !== "passed",
  );
  return firstNotPassed ?? STAGE_ORDER[STAGE_ORDER.length - 1];
}

export function buildWorkspaceState(
  messages: WorkspaceMessageRecord[],
  progressByStage: Partial<Record<StageId, StageProgressStatus>> = {},
): WorkspaceState {
  const latestAssistantByStage: WorkspaceState["latestAssistantByStage"] = {};
  const latestUserByStage: WorkspaceState["latestUserByStage"] = {};

  for (const message of messages) {
    const snapshot = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
    };

    if (message.role === "assistant") {
      latestAssistantByStage[message.stageId] = snapshot;
    } else {
      latestUserByStage[message.stageId] = snapshot;
    }
  }

  const reviewedAssistantIdByStage: WorkspaceState["reviewedAssistantIdByStage"] = {};
  for (const stageId of STAGE_ORDER) {
    if (progressByStage[stageId] === "passed") {
      const latestAssistant = latestAssistantByStage[stageId];
      if (latestAssistant) {
        reviewedAssistantIdByStage[stageId] = latestAssistant.id;
      }
    }
  }

  return {
    latestAssistantByStage,
    latestUserByStage,
    reviewedAssistantIdByStage,
  };
}

export function buildWorkspaceView({
  approvedKit,
  workspaceState,
  progressByStage,
}: {
  approvedKit: StoredKitData;
  workspaceState: WorkspaceState;
  progressByStage: Partial<Record<StageId, StageProgressStatus>>;
}): WorkspaceView {
  const activeStageId = getActiveStageId(progressByStage);
  const firstUnresolvedFoundationIndex = FOUNDATION_STAGE_IDS.findIndex(
    (stageId) => progressByStage[stageId] !== "passed",
  );

  const foundationCards = FOUNDATION_STAGE_IDS.map((stageId, index) => {
    const progress = progressByStage[stageId] ?? "empty";
    const latestAssistant = workspaceState.latestAssistantByStage[stageId];

    let status: FoundationCardView["status"] = "passed";
    if (progress !== "passed") {
      status =
        firstUnresolvedFoundationIndex === -1 ||
        index <= firstUnresolvedFoundationIndex + 1
          ? "active"
          : "locked";
    }

    return {
      stageId,
      title: MANUAL_LABELS[stageId] ?? STAGE_LABELS[stageId],
      status,
      progress,
      preview: buildFoundationPreview(stageId, approvedKit, latestAssistant?.content),
      hasFreshDraft:
        Boolean(latestAssistant?.content) &&
        latestAssistant?.id !== workspaceState.reviewedAssistantIdByStage[stageId],
    };
  });

  const manualModules: ManualModuleView[] = MANUAL_STAGE_IDS.map((stageId) => {
    const stageIndex = STAGE_ORDER.indexOf(stageId);
    const previousStageId = stageIndex > 0 ? STAGE_ORDER[stageIndex - 1] : null;
    const previousPassed =
      previousStageId === null || progressByStage[previousStageId] === "passed";
    const progress = progressByStage[stageId] ?? "empty";
    const latestAssistant = workspaceState.latestAssistantByStage[stageId];

    let status: ManualModuleView["status"] = "locked";
    if (progress === "passed") {
      status = "passed";
    } else if (previousPassed) {
      status = "active";
    }

    return {
      stageId,
      title: MANUAL_LABELS[stageId],
      status,
      progress,
      preview: buildManualModulePreview(stageId, approvedKit, latestAssistant?.content),
      hasFreshDraft:
        Boolean(latestAssistant?.content) &&
        latestAssistant?.id !== workspaceState.reviewedAssistantIdByStage[stageId],
    };
  });

  return {
    activeStageId,
    foundationCards,
    homepageDraft: buildHomepageDraft(approvedKit),
    manualModules,
  };
}

function buildHomepageDraft(approvedKit: StoredKitData): HomepageDraftView | null {
  const hero = approvedKit.templates?.homepageHero;
  if (!hero) {
    return null;
  }

  return {
    hero: { eyebrow: hero.eyebrow },
    title: hero.h1,
    description: hero.subhead,
    primaryCta: hero.ctaVariants[0] ?? "",
  };
}

function buildFoundationPreview(
  stageId: StageId,
  approvedKit: StoredKitData,
  latestAssistantDraft?: string,
): string[] {
  switch (stageId) {
    case "stage_0":
      return approvedKit.beforeAfter
        ? [approvedKit.beforeAfter]
        : toPreviewLines(latestAssistantDraft);
    case "stage_1":
      return approvedKit.enemy ? [approvedKit.enemy] : toPreviewLines(latestAssistantDraft);
    case "stage_2":
      return approvedKit.stack
        ? [
            `Character: ${approvedKit.stack.character}`,
            `Promise: ${approvedKit.stack.promise}`,
            `Method: ${approvedKit.stack.method}`,
          ]
        : toPreviewLines(latestAssistantDraft);
    case "stage_3":
      return approvedKit.antiPositioning?.length
        ? approvedKit.antiPositioning
            .slice(0, 3)
            .map((item) => `${item.statement} -> ${item.cost}`)
        : toPreviewLines(latestAssistantDraft);
    case "stage_4":
      return approvedKit.icp?.primary?.signals?.length
        ? approvedKit.icp.primary.signals.slice(0, 3)
        : toPreviewLines(latestAssistantDraft);
    default:
      return toPreviewLines(latestAssistantDraft);
  }
}

function buildManualModulePreview(
  stageId: StageId,
  approvedKit: StoredKitData,
  latestAssistantDraft?: string,
): string[] {
  switch (stageId) {
    case "stage_5":
      if (approvedKit.voice) {
        const lines: string[] = [];
        if (approvedKit.voice.principles?.length) {
          lines.push(`Principles: ${approvedKit.voice.principles.slice(0, 2).join(" / ")}`);
        }
        if (approvedKit.voice.do?.length) {
          lines.push(`Do: ${approvedKit.voice.do[0]}`);
        }
        if (approvedKit.voice.dont?.length) {
          lines.push(`Don't: ${approvedKit.voice.dont[0]}`);
        }
        return lines.length ? lines : toPreviewLines(latestAssistantDraft);
      }
      return toPreviewLines(latestAssistantDraft);
    case "stage_6":
      if (approvedKit.templates) {
        const lines: string[] = [];
        if (approvedKit.templates.homepageHero?.h1) {
          lines.push(`H1: ${approvedKit.templates.homepageHero.h1}`);
        }
        if (approvedKit.templates.coldOutreach?.subjects?.[0]) {
          lines.push(`Cold subject: ${approvedKit.templates.coldOutreach.subjects[0]}`);
        }
        if (approvedKit.templates.socialBios?.twitter) {
          lines.push(`Twitter: ${approvedKit.templates.socialBios.twitter.slice(0, 80)}`);
        }
        return lines.length ? lines : toPreviewLines(latestAssistantDraft);
      }
      return toPreviewLines(latestAssistantDraft);
    case "stage_7":
      if (approvedKit.visual) {
        const lines: string[] = [];
        if (approvedKit.visual.palette?.length) {
          lines.push(
            `Palette: ${approvedKit.visual.palette
              .slice(0, 3)
              .map((token) => `${token.name} ${token.hex}`)
              .join(", ")}`,
          );
        }
        if (approvedKit.visual.typography?.display?.family) {
          lines.push(
            `Display: ${approvedKit.visual.typography.display.family}`,
          );
        }
        if (approvedKit.visual.logoDirection) {
          lines.push(`Logo: ${approvedKit.visual.logoDirection.slice(0, 80)}`);
        }
        return lines.length ? lines : toPreviewLines(latestAssistantDraft);
      }
      return toPreviewLines(latestAssistantDraft);
    case "stage_8":
      if (approvedKit.rules) {
        const lines: string[] = [];
        if (approvedKit.rules.outreach?.[0]?.rule) {
          lines.push(`Outreach: ${approvedKit.rules.outreach[0].rule}`);
        }
        if (approvedKit.rules.salesMeeting?.[0]?.rule) {
          lines.push(`Sales: ${approvedKit.rules.salesMeeting[0].rule}`);
        }
        if (approvedKit.rules.proposals?.[0]?.rule) {
          lines.push(`Proposals: ${approvedKit.rules.proposals[0].rule}`);
        }
        return lines.length ? lines : toPreviewLines(latestAssistantDraft);
      }
      return toPreviewLines(latestAssistantDraft);
    default:
      return toPreviewLines(latestAssistantDraft);
  }
}

function toPreviewLines(content?: string): string[] {
  if (!content) {
    return ["No draft yet."];
  }

  return content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
}

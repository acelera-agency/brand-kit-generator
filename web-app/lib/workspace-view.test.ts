import { describe, expect, it } from "vitest";
import {
  buildWorkspaceState,
  buildWorkspaceView,
  type WorkspaceMessageRecord,
} from "./workspace-view";
import type { StoredKitData } from "./types";

describe("buildWorkspaceState", () => {
  it("keeps the latest user and assistant messages per stage", () => {
    const messages: WorkspaceMessageRecord[] = [
      {
        id: "1",
        role: "assistant",
        content: "First prompt",
        stageId: "stage_0",
        createdAt: "2026-04-09T10:00:00.000Z",
      },
      {
        id: "2",
        role: "user",
        content: "First answer",
        stageId: "stage_0",
        createdAt: "2026-04-09T10:01:00.000Z",
      },
      {
        id: "3",
        role: "assistant",
        content: "Sharper follow-up",
        stageId: "stage_0",
        createdAt: "2026-04-09T10:02:00.000Z",
      },
    ];

    expect(buildWorkspaceState(messages)).toEqual({
      latestAssistantByStage: {
        stage_0: {
          id: "3",
          content: "Sharper follow-up",
          createdAt: "2026-04-09T10:02:00.000Z",
        },
      },
      latestUserByStage: {
        stage_0: {
          id: "2",
          content: "First answer",
          createdAt: "2026-04-09T10:01:00.000Z",
        },
      },
      reviewedAssistantIdByStage: {},
    });
  });
});

describe("buildWorkspaceView", () => {
  it("builds the progressive foundation workspace from raw state", () => {
    const approvedKit: StoredKitData = {
      beforeAfter:
        "Most agencies sell execution. We are building a brand system that makes positioning operational.",
      templates: {
        homepageHero: {
          eyebrow: "Brand systems for founder-led firms",
          h1: "Turn sharp positioning into a site your team can ship.",
          subhead:
            "We turn strategic language into reusable website and sales assets.",
          ctaVariants: ["See the system", "Start the interview"],
        },
        coldOutreach: {
          subjects: ["A", "B", "C"],
          body: "Body",
          signOff: "Team",
        },
        socialBios: {
          linkedin: "LinkedIn",
          twitter: "Twitter",
          instagram: "Instagram",
        },
        firstMinute: {
          script: "Script",
          wordCount: 90,
        },
        emailSignature: "Sig",
      },
    };

    const workspaceState = buildWorkspaceState([
      {
        id: "a1",
        role: "assistant",
        content: "What current options get wrong?",
        stageId: "stage_1",
        createdAt: "2026-04-09T10:00:00.000Z",
      },
      {
        id: "u1",
        role: "user",
        content: "They confuse motion for leverage.",
        stageId: "stage_1",
        createdAt: "2026-04-09T10:01:00.000Z",
      },
      {
        id: "a2",
        role: "assistant",
        content: "Give me the category behavior you want to erase.",
        stageId: "stage_2",
        createdAt: "2026-04-09T10:02:00.000Z",
      },
    ]);

    const view = buildWorkspaceView({
      approvedKit,
      workspaceState,
      progressByStage: {
        stage_0: "passed",
        stage_1: "in-progress",
        stage_2: "empty",
        stage_3: "empty",
        stage_4: "empty",
        stage_5: "empty",
        stage_6: "empty",
        stage_7: "empty",
        stage_8: "empty",
      },
    });

    expect(view.activeStageId).toBe("stage_1");
    expect(view.foundationCards.map((card) => card.status)).toEqual([
      "passed",
      "active",
      "active",
      "locked",
      "locked",
    ]);
    expect(view.foundationCards[1]).toMatchObject({
      title: "Enemy",
      hasFreshDraft: true,
    });
    expect(view.foundationCards[3].title).toBe("Positioning");
    expect(view.homepageDraft).toEqual({
      hero: { eyebrow: "Brand systems for founder-led firms" },
      title: "Turn sharp positioning into a site your team can ship.",
      description:
        "We turn strategic language into reusable website and sales assets.",
      primaryCta: "See the system",
    });
    expect(view.manualModules.map((module) => module.status)).toEqual([
      "locked",
      "locked",
      "locked",
      "locked",
    ]);
    expect(view.manualModules[0]).toMatchObject({
      title: "Voice",
      preview: ["No draft yet."],
      hasFreshDraft: false,
    });
  });

  it("activates a manual module once its previous stage passes and surfaces its preview", () => {
    const approvedKit: StoredKitData = {
      voice: {
        principles: [
          "Make claims, not features.",
          "Use you more than we.",
          "Cut sentences a competitor could ship.",
        ],
        do: ['"A 60-page PDF nobody opens isn\'t a brand."'],
        dont: ['"We believe in empowering teams."'],
        writingRules: ["Sentence length under 22 words."],
        beforeAfter: [
          { old: "Old line", new: "New line" },
        ],
      },
    };

    const view = buildWorkspaceView({
      approvedKit,
      workspaceState: buildWorkspaceState([]),
      progressByStage: {
        stage_0: "passed",
        stage_1: "passed",
        stage_2: "passed",
        stage_3: "passed",
        stage_4: "passed",
        stage_5: "in-progress",
        stage_6: "empty",
        stage_7: "empty",
        stage_8: "empty",
      },
    });

    expect(view.manualModules.map((module) => module.status)).toEqual([
      "active",
      "locked",
      "locked",
      "locked",
    ]);
    expect(view.manualModules[0].preview).toEqual([
      "Principles: Make claims, not features. / Use you more than we.",
      'Do: "A 60-page PDF nobody opens isn\'t a brand."',
      'Don\'t: "We believe in empowering teams."',
    ]);
  });
});

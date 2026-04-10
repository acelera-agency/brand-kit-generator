import type { DraftCheckpoint, StoredKitData } from "./types";

export type SnapshotBlock = {
  title: string;
  items: string[];
};

export type ProgressiveSnapshot = {
  title: string;
  description: string;
  blocks: SnapshotBlock[];
};

export function buildProgressiveSnapshot(
  checkpoint: DraftCheckpoint,
  approvedKit: StoredKitData,
): ProgressiveSnapshot | null {
  if (checkpoint === "none") {
    return null;
  }

  if (checkpoint === "foundation") {
    return {
      title: "Foundation draft ready",
      description:
        "You now have the first useful cut of the brand foundation. It is enough to see the stance taking shape before the full kit is complete.",
      blocks: [
        {
          title: "Context",
          items: approvedKit.beforeAfter ? [approvedKit.beforeAfter] : [],
        },
        {
          title: "Enemy",
          items: approvedKit.enemy ? [approvedKit.enemy] : [],
        },
        {
          title: "Core stack",
          items: approvedKit.stack
            ? [
                `Character: ${approvedKit.stack.character}`,
                `Promise: ${approvedKit.stack.promise}`,
                `Method: ${approvedKit.stack.method}`,
              ]
            : [],
        },
      ].filter((block) => block.items.length > 0),
    };
  }

  if (checkpoint === "positioning") {
    return {
      title: "Positioning draft ready",
      description:
        "The brand is now specific enough to judge fit, reject work, and hear the voice starting to become usable.",
      blocks: [
        {
          title: "Anti-positioning",
          items:
            approvedKit.antiPositioning?.slice(0, 3).map(
              (item) => `${item.statement} -> ${item.cost}`,
            ) ?? [],
        },
        {
          title: "ICP signals",
          items: approvedKit.icp?.primary.signals.slice(0, 4) ?? [],
        },
        {
          title: "Voice direction",
          items: approvedKit.voice
            ? [
                ...(approvedKit.voice.principles?.slice(0, 2) ?? []),
                ...(approvedKit.voice.do?.slice(0, 2) ?? []),
              ]
            : [],
        },
      ].filter((block) => block.items.length > 0),
    };
  }

  return {
    title: "Final brand kit ready",
    description:
      "The full methodology is complete. Review the finished kit, export it, and generate a site only if you need that next.",
    blocks: [
      {
        title: "What is complete",
        items: [
          "Strategic foundation",
          "Voice constraints and templates",
          "Visual direction and surface rules",
        ],
      },
    ],
  };
}

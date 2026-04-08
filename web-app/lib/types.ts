export interface BrandKit {
  id: string;
  ownerId: string;
  status: "draft" | "completed" | "published";
  createdAt: Date;
  updatedAt: Date;
  stageProgress: Record<`stage_${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`, "empty" | "in-progress" | "passed">;

  context: {
    beforeAfter: string;
  };

  enemy: string;

  stack: {
    character: string;
    promise: string;
    method: string;
  };

  antiPositioning: Array<{
    statement: string;
    cost: string;
  }>;

  icp: {
    primary: {
      signals: string[];
    };
    secondary?: {
      role: string;
      signals: string[];
    };
  };

  voice: {
    principles: string[];
    do: string[];
    dont: string[];
    writingRules: string[];
    beforeAfter: Array<{
      old: string;
      new: string;
    }>;
  };

  templates: {
    homepageHero: {
      eyebrow: string;
      h1: string;
      subhead: string;
      ctaVariants: string[];
    };
    coldOutreach: {
      subjects: string[];
      body: string;
      signOff: string;
    };
    socialBios: {
      linkedin: string;
      twitter: string;
      instagram: string;
    };
    firstMinute: {
      script: string;
      wordCount: number;
    };
    emailSignature: string;
  };

  visual: {
    palette: Array<{
      name: string;
      hex: string;
      role: "primary" | "secondary" | "background" | "accent" | "neutral";
      narrative?: string;
    }>;
    typography: {
      display: {
        family: string;
        weights: number[];
        source: "google" | "adobe" | "self-hosted";
        url?: string;
      };
      body: {
        family: string;
        weights: number[];
        source: "google" | "adobe" | "self-hosted";
        url?: string;
      };
      mono?: {
        family: string;
        weights: number[];
        source: "google" | "adobe" | "self-hosted";
        url?: string;
      };
    };
    characteristicComponents: Array<{
      name: string;
      description: string;
    }>;
    forbiddenVisuals: string[];
    logoDirection: string;
  };

  rules: {
    outreach: Array<{
      rule: string;
      reason: string;
    }>;
    salesMeeting: Array<{
      rule: string;
      reason: string;
    }>;
    proposals: Array<{
      rule: string;
      reason: string;
    }>;
    cases: Array<{
      rule: string;
      reason: string;
    }>;
    visual: Array<{
      rule: string;
      reason: string;
    }>;
  };

  assets?: {
    logoSvg?: string;
    logoPng?: string;
    customFontFiles?: string[];
  };

  generatedSite?: {
    githubRepo: string;
    vercelProjectId: string;
    previewUrl: string;
    domain?: string;
  };

  generatedManual?: {
    pdfUrl: string;
    composedAt: Date;
    composeVersion: string;
  };
}

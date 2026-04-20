/**
 * Where the founder is in their brand journey. Drives which question variants
 * the interview asks (past-tense for 'existing', present/future for 'new')
 * and which gate-check anti-fabrication rules apply.
 */
export type BrandStage = "new" | "existing";
export type ExperienceMode = "guided" | "expert-led";
export type DraftCheckpoint = "none" | "foundation" | "positioning" | "final";

export type SourceKind = "url" | "text" | "pdf" | "github";

export type InspirationItem = {
  id: string;
  kind: SourceKind;
  label: string;
  content: string;
  charCount: number;
  createdAt: string;
  warnings: string[];
};

export type SourceMaterialMeta = {
  sources: Array<{
    kind: SourceKind;
    label: string;
    charCount: number;
    truncated: boolean;
  }>;
  totalChars: number;
  truncated: boolean;
  warnings: string[];
};

export interface BrandKit {
  id: string;
  ownerId: string;
  status: "draft" | "completed" | "published";
  brandStage: BrandStage;
  experienceMode: ExperienceMode;
  handoffRequestedAt?: Date | null;
  draftCheckpoint: DraftCheckpoint;
  sourceMaterial?: string | null;
  sourceMaterialMeta?: SourceMaterialMeta | null;
  inspirationItems: InspirationItem[];
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
    badFitSignals?: string[];
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

/**
 * Shape of `brand_kits.kit` JSONB after the gate-check route's shallow merge
 * (`{ ...existingKit, ...validation.data }`). Each field is the result of one
 * stage's Zod schema being shallow-merged at the top level. All fields are
 * optional because a kit may be partially completed.
 *
 * Used by the kit view page to render whichever sections have data.
 */
export type StoredKitData = {
  // Stage 0 — Stage0Schema has shape { beforeAfter: string }, lifted to top
  beforeAfter?: string;
  // Stage 1 — Stage1Schema has shape { enemy: string }, lifted to top
  enemy?: string;
  // Stage 2-8 — each stored under its named key
  stack?: BrandKit["stack"];
  antiPositioning?: BrandKit["antiPositioning"];
  icp?: BrandKit["icp"];
  voice?: BrandKit["voice"];
  templates?: BrandKit["templates"];
  visual?: BrandKit["visual"];
  rules?: BrandKit["rules"];
  // Voice-consistency lint results, refreshed on demand via POST /api/kits/:id/lint
  lint?: VoiceLintResult;
};

export type VoiceLintViolationKind =
  | "dont-phrase"
  | "word-count"
  | "tone-mismatch"
  | "register-mismatch";

export type VoiceLintViolation = {
  kind: VoiceLintViolationKind;
  snippet: string;
  ruleReference: string;
  suggestedRewrite: string;
};

export type VoiceLintSectionResult = {
  target: string;
  violations: VoiceLintViolation[];
};

export type VoiceLintResult = {
  generatedAt: string;
  voiceHash: string;
  sections: {
    context?: VoiceLintSectionResult;
    templates?: Record<string, VoiceLintSectionResult>;
  };
};

export type SiteGenerationStatus = "pending" | "generating" | "completed" | "failed";

export interface SiteGeneration {
  id: string;
  kitId: string;
  ownerId: string;
  status: SiteGenerationStatus;
  v0ProjectId: string | null;
  v0ChatId: string | null;
  v0VersionId: string | null;
  demoUrl: string | null;
  generatedFiles: Array<{ name: string; content: string }>;
  promptHash: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

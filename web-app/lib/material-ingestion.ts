import * as cheerio from "cheerio";
import type { SourceKind, SourceMaterialMeta } from "./types";

export type SourceMaterialPart = {
  kind: SourceKind;
  label: string;
  text: string;
};

export type SourceMaterialOptions = {
  maxCharsPerSource?: number;
  maxCharsTotal?: number;
};

type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;

type GitHubMaterialOptions = {
  maxFiles?: number;
  maxCharsPerFile?: number;
  maxCharsPerSource?: number;
};

export type MaterialExtractionInput = {
  url?: string | null;
  rawText?: string | null;
  githubRepo?: string | null;
  pdfFile?: File | null;
};

const DEFAULT_MAX_CHARS_PER_SOURCE = 12000;
const DEFAULT_MAX_CHARS_TOTAL = 24000;
const DEFAULT_MAX_GITHUB_FILES = 12;
const DEFAULT_MAX_GITHUB_FILE_CHARS = 1800;
const MAX_PDF_BYTES = 5 * 1024 * 1024;

const BLOCKED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) {
    return false;
  }

  const [a, b] = [Number(match[1]), Number(match[2])];
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function truncateText(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return { text: value, truncated: false };
  }

  return {
    text: value.slice(0, maxChars).trimEnd(),
    truncated: true,
  };
}

function assertPublicHttpUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http(s) URLs are supported.");
  }

  if (BLOCKED_HOSTNAMES.has(url.hostname.toLowerCase())) {
    throw new Error("Local URLs are not allowed.");
  }

  if (isPrivateIpv4(url.hostname)) {
    throw new Error("Private-network URLs are not allowed.");
  }

  return url;
}

function scoreGitHubPath(path: string): number {
  const lower = path.toLowerCase();
  if (lower === "readme.md") return 100;
  if (lower.endsWith("/readme.md")) return 90;
  if (lower.endsWith("brand.md") || lower.endsWith("brand-kit.md")) return 80;
  if (lower.endsWith("package.json")) return 70;
  if (lower.startsWith("src/")) return 60;
  if (lower.startsWith("app/")) return 55;
  if (lower.startsWith("content/")) return 50;
  return 10;
}

function isLikelyGitHubTextFile(path: string): boolean {
  const lower = path.toLowerCase();
  if (
    lower.includes("node_modules/") ||
    lower.includes("dist/") ||
    lower.includes("build/") ||
    lower.includes("coverage/") ||
    lower.includes(".next/")
  ) {
    return false;
  }

  return /\.(md|mdx|txt|html|css|js|jsx|ts|tsx|json|ya?ml|astro|vue|svelte)$/i.test(
    lower,
  );
}

function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, header, footer, noscript, svg, iframe").remove();
  const text = $("body").text() ?? $("main").text() ?? $.root().text();
  return normalizeText(text);
}

export function parseGitHubRepoUrl(
  value: string,
): { owner: string; repo: string } | null {
  try {
    const url = new URL(value);
    if (url.hostname !== "github.com") {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    const [owner, rawRepo] = parts;
    if (!owner || !rawRepo) {
      return null;
    }

    return {
      owner,
      repo: rawRepo.replace(/\.git$/i, ""),
    };
  } catch {
    return null;
  }
}

export function buildSourceMaterial(
  parts: SourceMaterialPart[],
  options: SourceMaterialOptions = {},
): {
  sourceMaterial: string;
  sourceMaterialMeta: SourceMaterialMeta;
} {
  const maxCharsPerSource =
    options.maxCharsPerSource ?? DEFAULT_MAX_CHARS_PER_SOURCE;
  const maxCharsTotal = options.maxCharsTotal ?? DEFAULT_MAX_CHARS_TOTAL;
  const warnings: string[] = [];
  const normalizedParts = parts
    .map((part) => {
      const normalized = normalizeText(part.text);
      if (!normalized) {
        return null;
      }

      const truncated = truncateText(normalized, maxCharsPerSource);
      if (truncated.truncated) {
        warnings.push(`Source '${part.label}' was truncated to fit the limit.`);
      }

      return {
        ...part,
        text: truncated.text,
        truncated: truncated.truncated,
      };
    })
    .filter((part): part is SourceMaterialPart & { truncated: boolean } =>
      Boolean(part),
    );

  const rawDocument = normalizedParts
    .map(
      (part) =>
        `[${part.kind.toUpperCase()}] ${part.label}\n${part.text}`,
    )
    .join("\n\n");

  const truncatedDocument = truncateText(rawDocument, maxCharsTotal);
  if (truncatedDocument.truncated) {
    warnings.push("Combined source material was truncated to fit the prompt budget.");
  }

  const sourceMaterialMeta: SourceMaterialMeta = {
    sources: normalizedParts.map((part) => ({
      kind: part.kind,
      label: part.label,
      charCount: part.text.length,
      truncated: part.truncated,
    })),
    totalChars: truncatedDocument.text.length,
    truncated:
      truncatedDocument.truncated || normalizedParts.some((part) => part.truncated),
    warnings,
  };

  return {
    sourceMaterial: truncatedDocument.text,
    sourceMaterialMeta,
  };
}

export async function fetchWebsiteMaterial(
  value: string,
  fetcher: Fetcher = fetch,
): Promise<SourceMaterialPart> {
  const url = assertPublicHttpUrl(value);
  const label = value.trim();
  const response = await fetcher(url, {
    headers: {
      Accept: "text/html,text/plain;q=0.9,*/*;q=0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`Website fetch failed (${response.status}).`);
  }

  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const text = contentType.includes("html")
    ? extractTextFromHtml(body)
    : normalizeText(body);

  return {
    kind: "url",
    label,
    text,
  };
}

export async function fetchGitHubRepoMaterial(
  value: string,
  fetcher: Fetcher = fetch,
  options: GitHubMaterialOptions = {},
): Promise<SourceMaterialPart> {
  const repo = parseGitHubRepoUrl(value);
  if (!repo) {
    throw new Error("Invalid GitHub repository URL.");
  }

  const repoResponse = await fetcher(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}`,
    {
      headers: { Accept: "application/vnd.github+json" },
    },
  );
  if (!repoResponse.ok) {
    throw new Error(`GitHub repo lookup failed (${repoResponse.status}).`);
  }

  const repoData = (await repoResponse.json()) as { default_branch?: string };
  const defaultBranch = repoData.default_branch;
  if (!defaultBranch) {
    throw new Error("GitHub repo is missing a default branch.");
  }

  const treeResponse = await fetcher(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}/git/trees/${defaultBranch}?recursive=1`,
    {
      headers: { Accept: "application/vnd.github+json" },
    },
  );
  if (!treeResponse.ok) {
    throw new Error(`GitHub tree lookup failed (${treeResponse.status}).`);
  }

  const treeData = (await treeResponse.json()) as {
    tree?: Array<{ path?: string; type?: string }>;
  };

  const maxFiles = options.maxFiles ?? DEFAULT_MAX_GITHUB_FILES;
  const maxCharsPerFile =
    options.maxCharsPerFile ?? DEFAULT_MAX_GITHUB_FILE_CHARS;
  const maxCharsPerSource =
    options.maxCharsPerSource ?? DEFAULT_MAX_CHARS_PER_SOURCE;

  const candidatePaths = (treeData.tree ?? [])
    .filter(
      (entry): entry is { path: string; type: string } =>
        entry.type === "blob" && typeof entry.path === "string",
    )
    .map((entry) => entry.path)
    .filter(isLikelyGitHubTextFile)
    .sort((a, b) => scoreGitHubPath(b) - scoreGitHubPath(a))
    .slice(0, maxFiles);

  const fileTexts = await Promise.all(
    candidatePaths.map(async (path) => {
      const rawResponse = await fetcher(
        `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${defaultBranch}/${path}`,
      );
      if (!rawResponse.ok) {
        return null;
      }

      const rawText = normalizeText(await rawResponse.text());
      if (!rawText) {
        return null;
      }

      const truncated = truncateText(rawText, maxCharsPerFile);
      return `FILE: ${path}\n${truncated.text}`;
    }),
  );

  const combined = truncateText(
    fileTexts.filter(Boolean).join("\n\n"),
    maxCharsPerSource,
  );

  return {
    kind: "github",
    label: `https://github.com/${repo.owner}/${repo.repo}`,
    text: combined.text,
  };
}

export async function fetchPdfMaterial(file: File): Promise<SourceMaterialPart> {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("PDF exceeds the 5 MB limit.");
  }

  const { PDFParse } = await import("pdf-parse");
  const data = Buffer.from(await file.arrayBuffer());
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();
    const text = normalizeText(result.text ?? "");
    if (!text) {
      throw new Error("PDF contained no extractable text.");
    }

    return {
      kind: "pdf",
      label: file.name || "uploaded.pdf",
      text,
    };
  } finally {
    await parser.destroy();
  }
}

export async function extractMaterialSources(
  input: MaterialExtractionInput,
  fetcher: Fetcher = fetch,
): Promise<{
  parts: SourceMaterialPart[];
  warnings: string[];
}> {
  const warnings: string[] = [];
  const tasks: Array<Promise<SourceMaterialPart | null>> = [];

  const url = input.url?.trim();
  if (url) {
    tasks.push(
      fetchWebsiteMaterial(url, fetcher).catch((error: unknown) => {
        warnings.push(
          `Website import failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }),
    );
  }

  const rawText = normalizeText(input.rawText ?? "");
  if (rawText) {
    tasks.push(
      Promise.resolve({
        kind: "text" as const,
        label: "Pasted text",
        text: rawText,
      }),
    );
  }

  const githubRepo = input.githubRepo?.trim();
  if (githubRepo) {
    tasks.push(
      fetchGitHubRepoMaterial(githubRepo, fetcher).catch((error: unknown) => {
        warnings.push(
          `GitHub import failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }),
    );
  }

  if (input.pdfFile && input.pdfFile.size > 0) {
    tasks.push(
      fetchPdfMaterial(input.pdfFile).catch((error: unknown) => {
        warnings.push(
          `PDF import failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }),
    );
  }

  const parts = (await Promise.all(tasks)).filter(
    (part): part is SourceMaterialPart => Boolean(part),
  );

  return { parts, warnings };
}

import type {
  PullRequestData,
  PullRequestLocation,
} from "./pull-request";

const GITHUB_TITLE_SELECTORS = [
  '[data-component="PH_Title"]',
  'h1[data-testid="issue-title"]',
  'h1 [data-testid="issue-title"]',
  "h1 .js-issue-title",
  "h1[data-test-selector='issue-title']",
  ".gh-header-title .markdown-title",
];

const GRAPHITE_TITLE_SELECTORS = [
  '[class^="PullRequestInfo_pullRequestTitle__"] [class*="utilities_textEmphasis__"]',
  '[data-new-file-navigation-enabled="true"] [class*="utilities_textEmphasis__"]',
];

const DIFFSTAT_SELECTORS = [
  "[data-test-selector='diff-stats']",
  "[data-component='diffstat']",
  ".diffstat",
  ".gh-header-meta .color-fg-muted",
  ".gh-header-meta .fgColor-muted",
  "[class*='FileChangeStats_fileChangeStats__']", // Graphite UI
];

const GITHUB_ADDITIONS_SELECTORS = [".color-fg-success", ".fgColor-success"];
const GITHUB_DELETIONS_SELECTORS = [".color-fg-danger", ".fgColor-danger"];

const GRAPHITE_ADDITIONS_SELECTOR =
  "[class*='FileChangeStats_linesAdded__']";
const GRAPHITE_DELETIONS_SELECTOR =
  "[class*='FileChangeStats_linesRemoved__']";

export function scrapePullRequestFromDom(
  pr: PullRequestLocation
): PullRequestData | null {
  const platform = detectPlatform();
  const title = readTitle(platform, pr.number);
  if (!title) return null;

  const stats = readDiffStats();

  return {
    title,
    additions: stats.additions,
    deletions: stats.deletions,
    html_url: `https://github.com/${pr.owner}/${pr.repo}/pull/${pr.number}`,
  };
}

type HostPlatform = "github" | "graphite" | "other";

function readTitle(platform: HostPlatform, prNumber: number): string | null {
  const selectors =
    platform === "graphite"
      ? GRAPHITE_TITLE_SELECTORS
      : GITHUB_TITLE_SELECTORS;

  for (const selector of selectors) {
    const element = Array.from(
      document.querySelectorAll<HTMLElement>(selector)
    ).find(isReadableTitleElement);
    if (!element) continue;
    const value = cleanTitleText(element.textContent, platform, prNumber);
    if (value) return value;
  }

  if (platform === "github") {
    return readGitHubTitleFromDocumentTitle();
  }

  return null;
}

function readGitHubTitleFromDocumentTitle(): string | null {
  const match = document.title.match(
    /^(.*?)\s+by\s+.+?\s+·\s+Pull Request #\d+\s+·\s+.+$/
  );
  const title = match?.[1]?.trim();
  return title || null;
}

function isReadableTitleElement(element: HTMLElement): boolean {
  if (!element.isConnected) return false;
  if (element.closest("a")) return false;
  if (element.getClientRects().length === 0) return false;

  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function cleanTitleText(
  raw: string | null | undefined,
  platform: HostPlatform,
  prNumber: number
): string | null {
  if (!raw) return null;
  const trimmed = raw.replace(/·.*$/, "").trim();
  if (!trimmed) return null;

  if (platform === "github") {
    const title = trimmed
      .replace(new RegExp(`\\s*#${prNumber}\\s*Edit title\\s*$`, "i"), "")
      .replace(new RegExp(`\\s*#${prNumber}\\s*$`), "")
      .trim();
    if (title) return title;
  }

  if (platform === "graphite") {
    const match = trimmed.match(/^#\d+\s+(.*)$/);
    if (match?.[1]) {
      const title = match[1].trim();
      if (title) return title;
    }
  }

  return trimmed;
}

function detectPlatform(): HostPlatform {
  const host = window.location.host;
  if (host === "github.com" || host.endsWith(".github.com")) return "github";
  if (host.endsWith("graphite.com")) return "graphite";
  return "other";
}

function readDiffStats(): { additions: number; deletions: number } {
  for (const selector of DIFFSTAT_SELECTORS) {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) continue;

    const label = element.getAttribute("aria-label");
    const labelStats = extractStats(label);
    if (labelStats) return labelStats;

    const contentStats = extractStats(element.textContent);
    if (contentStats) return contentStats;

    const spansStats = readFromDiffstatSpans(element);
    if (spansStats) return spansStats;
  }

  // Newer GitHub UI may keep the numeric values in sr-only text outside
  // previous diffstat containers.
  const srOnlyStats = readFromLinesChangedLabel(document);
  if (srOnlyStats) return srOnlyStats;

  return { additions: 0, deletions: 0 };
}

function readFromDiffstatSpans(
  element: HTMLElement
): { additions: number; deletions: number } | null {
  const additionsText =
    readTextFromSelectors(element, GITHUB_ADDITIONS_SELECTORS) ??
    element.querySelector<HTMLElement>(GRAPHITE_ADDITIONS_SELECTOR)
      ?.textContent ??
    "";
  const deletionsText =
    readTextFromSelectors(element, GITHUB_DELETIONS_SELECTORS) ??
    element.querySelector<HTMLElement>(GRAPHITE_DELETIONS_SELECTOR)
      ?.textContent ??
    "";

  const additions = parseLooseNumber(additionsText);
  const deletions = parseLooseNumber(deletionsText);

  if (typeof additions === "number" || typeof deletions === "number") {
    return {
      additions: additions ?? 0,
      deletions: deletions ?? 0,
    };
  }
  return null;
}

function readFromLinesChangedLabel(
  root: ParentNode
): { additions: number; deletions: number } | null {
  const labels = root.querySelectorAll<HTMLElement>(".sr-only");
  for (const label of labels) {
    const text = label.textContent;
    if (!text || !/lines?\s+changed/i.test(text)) continue;
    const stats = extractStats(text);
    if (stats) return stats;
  }
  return null;
}

function extractStats(
  text: string | null | undefined
): { additions: number; deletions: number } | null {
  if (!text) return null;
  const normalized = text.replace(/\u2212/g, "-");
  const additions =
    parseNumber(normalized, /([\d,]+)\s+additions?/i) ??
    parseNumber(normalized, /\+\s*([\d,]+)/);
  const deletions =
    parseNumber(normalized, /([\d,]+)\s+deletions?/i) ??
    parseNumber(normalized, /-\s*([\d,]+)/);

  if (typeof additions === "number" || typeof deletions === "number") {
    return {
      additions: additions ?? 0,
      deletions: deletions ?? 0,
    };
  }
  return null;
}

function parseNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function parseLooseNumber(text: string): number | null {
  if (!text) return null;
  const normalized = text.replace(/[^\d-]/g, "");
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.abs(value) : null;
}

function readTextFromSelectors(
  root: ParentNode,
  selectors: string[]
): string | null {
  for (const selector of selectors) {
    const value = root.querySelector<HTMLElement>(selector)?.textContent;
    if (value) return value;
  }
  return null;
}

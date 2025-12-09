import {
  normalizeBranchName,
  type PullRequestData,
  type PullRequestLocation,
} from "./pull-request";

const TITLE_SELECTORS = [
  '[data-testid="issue-title"]',
  ".js-issue-title",
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
];

const GITHUB_BRANCH_SELECTORS = [
  "[data-test-selector='head-ref']",
  ".gh-header-meta .commit-ref:last-of-type .css-truncate-target",
  ".commit-ref .css-truncate-target",
];

const GRAPHITE_BRANCH_SELECTORS = [
  '[class*="BranchName_branchName__"]',
  '[class*="BranchReference_branchReference__"]',
];

export function scrapePullRequestFromDom(
  pr: PullRequestLocation
): PullRequestData | null {
  const platform = detectPlatform();
  const title = readTitle(platform);
  if (!title) return null;

  const stats = readDiffStats();
  const branchName = readBranchName(platform, pr);

  return {
    title,
    additions: stats.additions,
    deletions: stats.deletions,
    html_url: `https://github.com/${pr.owner}/${pr.repo}/pull/${pr.number}`,
    branchName,
  };
}

type HostPlatform = "github" | "graphite" | "other";

function readTitle(platform: HostPlatform): string | null {
  const selectors =
    platform === "graphite"
      ? [...GRAPHITE_TITLE_SELECTORS, ...TITLE_SELECTORS]
      : TITLE_SELECTORS;

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) continue;
    const value = cleanTitleText(element.textContent, platform);
    if (value) return value;
  }

  const meta = document.querySelector<HTMLMetaElement>(
    "meta[property='og:title']"
  );
  const metaValue = cleanTitleText(meta?.content, platform);
  if (metaValue) return metaValue;

  return null;
}

function cleanTitleText(
  raw: string | null | undefined,
  platform: HostPlatform
): string | null {
  if (!raw) return null;
  const trimmed = raw.replace(/·.*$/, "").trim();
  if (!trimmed) return null;

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

function readBranchName(
  platform: HostPlatform,
  pr: PullRequestLocation
): string | undefined {
  if (platform === "github") {
    const meta = document.querySelector<HTMLMetaElement>(
      "meta[name='octolytics-dimension-pr_head_ref']"
    );
    const metaValue = normalizeBranchName(meta?.content);
    if (metaValue) return metaValue;
  }

  const selectors =
    platform === "graphite"
      ? GRAPHITE_BRANCH_SELECTORS
      : GITHUB_BRANCH_SELECTORS;

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) continue;
    const value = normalizeBranchName(element.textContent);
    if (value) return value;
    const titleValue = normalizeBranchName(element.getAttribute("title"));
    if (titleValue) return titleValue;
  }

  return readBranchFromLinks(pr);
}

function readBranchFromLinks(
  pr: PullRequestLocation
): string | undefined {
  const repoPath = `/${pr.owner}/${pr.repo}`;
  const anchors = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("a[href*='/tree/']")
  );

  for (const anchor of anchors) {
    const href = anchor.getAttribute("href");
    if (!href) continue;
    const url = toAbsoluteUrl(href);
    if (!url) continue;
    if (!url.pathname.includes(repoPath)) continue;
    const match = url.pathname.match(/\/tree\/([^/?#]+)/);
    if (!match?.[1]) continue;
    const decoded = decodeURIComponent(match[1]);
    const normalized = normalizeBranchName(decoded);
    if (normalized) return normalized;
  }

  return undefined;
}

function toAbsoluteUrl(href: string): URL | null {
  try {
    return new URL(href, window.location.origin);
  } catch {
    return null;
  }
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

  return { additions: 0, deletions: 0 };
}

function readFromDiffstatSpans(
  element: HTMLElement
): { additions: number; deletions: number } | null {
  const additionsText =
    element.querySelector<HTMLElement>(".color-fg-success")?.textContent ?? "";
  const deletionsText =
    element.querySelector<HTMLElement>(".color-fg-danger")?.textContent ?? "";

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

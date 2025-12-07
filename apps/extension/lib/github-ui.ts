import type {
  PullRequestData,
  PullRequestLocation,
} from "./pull-request";

const TITLE_SELECTORS = [
  '[data-testid="issue-title"]',
  ".js-issue-title",
  "h1[data-test-selector='issue-title']",
  ".gh-header-title .markdown-title",
];

const DIFFSTAT_SELECTORS = [
  "[data-test-selector='diff-stats']",
  "[data-component='diffstat']",
  ".diffstat",
  ".gh-header-meta .color-fg-muted",
];

export function scrapePullRequestFromDom(
  pr: PullRequestLocation
): PullRequestData | null {
  const title = readTitle();
  if (!title) return null;

  const stats = readDiffStats();

  return {
    title,
    additions: stats.additions,
    deletions: stats.deletions,
    html_url: `https://github.com/${pr.owner}/${pr.repo}/pull/${pr.number}`,
  };
}

function readTitle(): string | null {
  for (const selector of TITLE_SELECTORS) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      const value = element.textContent?.trim();
      if (value) return value;
    }
  }

  const meta = document.querySelector<HTMLMetaElement>(
    "meta[property='og:title']"
  );
  if (meta?.content) {
    const cleaned = meta.content.replace(/·.*$/, "").trim();
    if (cleaned) return cleaned;
  }

  return null;
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

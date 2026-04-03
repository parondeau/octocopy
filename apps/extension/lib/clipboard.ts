import type {
  MessageFormat,
  PlatformSettings,
} from "../entrypoints/popup/types";
import type { PullRequestData, PullRequestLocation } from "./pull-request";

export type CopyPayload = {
  text: string;
  html: string;
};

const GRAPHITE_BASE_URL = "https://app.graphite.com/github/pr";
const DEVIN_BASE_URL = "https://app.devin.com/review";

export function buildCopyPayload(
  pr: PullRequestLocation,
  data: PullRequestData,
  platforms: PlatformSettings,
  messageFormat: MessageFormat
): CopyPayload {
  const repoSlug = `${pr.owner}/${pr.repo}`;
  const prPath = `${pr.owner}/${pr.repo}/pull/${pr.number}`;

  const links: Array<{ label: string; url: string }> = [];
  if (platforms.github) {
    links.push({ label: "github", url: data.html_url });
  }
  if (platforms.devin) {
    links.push({
      label: "devin",
      url: `${DEVIN_BASE_URL}/${prPath}`,
    });
  }
  if (platforms.graphite) {
    links.push({
      label: "graphite",
      url: `${GRAPHITE_BASE_URL}/${pr.owner}/${pr.repo}/${pr.number}`,
    });
  }

  if (messageFormat === "linked-title") {
    const [primaryLink, ...extraLinks] = links;

    const textTitle = primaryLink
      ? `[${data.title}](${primaryLink.url})`
      : data.title;
    const htmlTitle = primaryLink
      ? `<a href="${escapeHtml(primaryLink.url)}">${escapeHtml(
          data.title
        )}</a>`
      : escapeHtml(data.title);

    const textLinks = extraLinks
      .map(({ label, url }) => `[${label}](${url})`)
      .join(", ");
    const htmlLinks = extraLinks
      .map(
        ({ label, url }) =>
          `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`
      )
      .join(", ");

    const textSuffix = textLinks ? ` [${textLinks}]` : "";
    const htmlSuffix = htmlLinks ? ` [${htmlLinks}]` : "";

    const text = `${textTitle} (${repoSlug} +${data.additions}/-${data.deletions})${textSuffix}`;
    const html = `${htmlTitle} (${repoSlug} +${data.additions}/-${data.deletions})${htmlSuffix}`;

    return { text, html };
  }

  const textLinks = links
    .map(({ label, url }) => `[${label}](${url})`)
    .join(", ");
  const htmlLinks = links
    .map(
      ({ label, url }) =>
        `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`
    )
    .join(", ");

  const textSuffix = textLinks ? ` [${textLinks}]` : "";
  const htmlSuffix = htmlLinks ? ` [${htmlLinks}]` : "";

  const text = `[${repoSlug}#${pr.number}]: ${data.title} (+${data.additions}/-${data.deletions})${textSuffix}`;
  const html = `[${repoSlug}#${pr.number}]: ${escapeHtml(
    data.title
  )} (+${data.additions}/-${data.deletions})${htmlSuffix}`;

  return { text, html };
}

export async function copyToClipboard(payload: CopyPayload) {
  if ("ClipboardItem" in window) {
    const item = new ClipboardItem({
      "text/plain": new Blob([payload.text], { type: "text/plain" }),
      "text/html": new Blob([payload.html], { type: "text/html" }),
    });
    await navigator.clipboard.write([item]);
  } else {
    await navigator.clipboard.writeText(payload.text);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

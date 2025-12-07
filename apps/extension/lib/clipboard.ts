import type {
  PullRequestData,
  PullRequestLocation,
} from "./pull-request";

export type CopyPayload = {
  text: string;
  html: string;
};

export function buildCopyPayload(
  pr: PullRequestLocation,
  data: PullRequestData
): CopyPayload {
  const repoSlug = `${pr.owner}/${pr.repo}`;
  const text = `[${repoSlug}/${pr.number}]: ${data.title} (+${data.additions}/-${data.deletions}) [[github](${data.html_url})]`;
  const html = `<strong>[${repoSlug}/${pr.number}]:</strong> ${escapeHtml(
    data.title
  )} (+${data.additions}/-${data.deletions}) [<a href="${
    data.html_url
  }">github</a>]`;

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

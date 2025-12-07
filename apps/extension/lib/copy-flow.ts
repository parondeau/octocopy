import { fetchPullRequest } from "./github";
import { buildCopyPayload, copyToClipboard } from "./clipboard";
import type { PullRequestLocation } from "./pull-request";

export async function copyPullRequest(pr: PullRequestLocation) {
  const data = await fetchPullRequest(pr);
  if (!data) {
    throw new Error("Unable to load PR details.");
  }

  const payload = buildCopyPayload(pr, data);
  await copyToClipboard(payload);
}

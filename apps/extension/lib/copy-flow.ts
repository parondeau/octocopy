import { buildCopyPayload, copyToClipboard } from "./clipboard";
import { fetchPullRequestWithApp, fetchPullRequestWithToken } from "./github";
import { scrapePullRequestFromDom } from "./github-ui";
import type { PullRequestData, PullRequestLocation } from "./pull-request";
import { loadExtensionSettings } from "./settings";

export async function copyPullRequest(pr: PullRequestLocation) {
  const settings = await loadExtensionSettings();
  const data = await resolvePullRequestData(pr, settings.mode, settings.token);
  if (!data) {
    throw new Error("Unable to load PR details.");
  }

  const payload = buildCopyPayload(pr, data, {
    platforms: settings.platforms,
    includeBranchName: settings.includeBranchName,
  });
  await copyToClipboard(payload);
}

async function resolvePullRequestData(
  pr: PullRequestLocation,
  mode: "app" | "token" | "ui",
  token: string
): Promise<PullRequestData | null> {
  switch (mode) {
    case "token": {
      const trimmed = token.trim();
      if (!trimmed) {
        throw new Error(
          "Add a personal access token in the Octocopy popup before copying."
        );
      }
      return fetchPullRequestWithToken(pr, trimmed);
    }
    case "ui":
      return scrapePullRequestFromDom(pr);
    case "app":
    default:
      return fetchPullRequestWithApp(pr);
  }
}

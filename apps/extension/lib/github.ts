import { Octokit } from "@octokit/core";

import type {
  PullRequestData,
  PullRequestLocation,
} from "./pull-request";

const API_BASE_URL: string =
  import.meta.env.VITE_OCTOCOPY_API_BASE_URL || "http://localhost:3001";
const EXTENSION_API_KEY = import.meta.env.VITE_OCTOCOPY_EXTENSION_API_KEY;

type TokenCacheEntry = {
  value: string;
  expiresAt: number;
};

const tokenCache = new Map<string, TokenCacheEntry>();

export async function fetchPullRequest(
  pr: PullRequestLocation
): Promise<PullRequestData | null> {
  const token = await getAccessToken(pr);

  const octokit = new Octokit({
    auth: token ?? undefined,
    userAgent: "Octocopy-Extension",
  });

  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      {
        owner: pr.owner,
        repo: pr.repo,
        pull_number: pr.number,
      }
    );

    return {
      title: data.title ?? "",
      additions: data.additions ?? 0,
      deletions: data.deletions ?? 0,
      html_url:
        data.html_url ??
        `https://github.com/${pr.owner}/${pr.repo}/pull/${pr.number}`,
    };
  } catch (error) {
    console.warn("Octocopy: GitHub API request failed", error);
    return null;
  }
}

async function getAccessToken(
  pr: PullRequestLocation
): Promise<string | null> {
  const cacheKey = `${pr.owner}/${pr.repo}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt - Date.now() > 60_000) {
    return cached.value;
  }

  const result = await requestAccessToken(pr);
  if (!result) return null;

  const token = {
    value: result.token,
    expiresAt: result.expiresAt ?? Date.now() + 10 * 60_000,
  };

  const cacheKeys = new Set<string>([
    cacheKey,
    result.installationId ? String(result.installationId) : cacheKey,
  ]);

  cacheKeys.forEach((key) => tokenCache.set(key, token));

  return token.value;
}

async function requestAccessToken(pr: PullRequestLocation): Promise<{
  token: string;
  expiresAt?: number;
  installationId?: number;
} | null> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (EXTENSION_API_KEY) {
    headers["x-octocopy-key"] = EXTENSION_API_KEY;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/github-app-token`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        owner: pr.owner,
        repo: pr.repo,
      }),
    });

    if (!response.ok) {
      console.warn(
        "Octocopy: token request failed",
        response.status,
        await response.text()
      );
      return null;
    }

    const payload = (await response.json()) as {
      token?: string;
      expiresAt?: string;
      installationId?: number;
    };

    if (!payload.token) return null;

    return {
      token: payload.token,
      expiresAt: payload.expiresAt
        ? new Date(payload.expiresAt).getTime()
        : undefined,
      installationId: payload.installationId,
    };
  } catch (error) {
    console.error("Octocopy: token request error", error);
    return null;
  }
}

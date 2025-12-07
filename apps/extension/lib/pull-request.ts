export type PullRequestLocation = {
  owner: string;
  repo: string;
  number: number;
};

export type PullRequestData = {
  title: string;
  additions: number;
  deletions: number;
  html_url: string;
};

export function parsePullRequestFromPath(
  pathname: string
): PullRequestLocation | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 4) return null;

  const [owner, repo, pullLiteral, pullNumber] = segments;
  if (pullLiteral !== "pull") return null;

  const number = Number(pullNumber);
  if (!Number.isInteger(number)) return null;

  return { owner, repo, number };
}

export function serializePullRequest(pr: PullRequestLocation) {
  return JSON.stringify(pr);
}

export function deserializePullRequest(
  raw?: string | null
): PullRequestLocation | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.owner === "string" &&
      typeof parsed.repo === "string" &&
      typeof parsed.number === "number"
    ) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Octocopy: failed to parse PR data", error);
    return null;
  }
}

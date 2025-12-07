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

  // GitHub PR path: /:owner/:repo/pull/:number
  if (segments.length >= 4 && segments[2] === "pull") {
    const [owner, repo, , pullNumber] = segments;
    const number = Number(pullNumber);
    if (!Number.isInteger(number)) return null;
    return { owner, repo, number };
  }

  // Graphite PR path: /github/pr/:owner/:repo/:number(/...)
  if (segments.length >= 5 && segments[0] === "github" && segments[1] === "pr") {
    const owner = segments[2];
    const repo = segments[3];
    const number = Number(segments[4]);
    if (!owner || !repo || !Number.isInteger(number)) return null;
    return { owner, repo, number };
  }

  return null;
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

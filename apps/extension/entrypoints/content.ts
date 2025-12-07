import { Octokit } from "@octokit/core";

type PullRequestLocation = {
  owner: string;
  repo: string;
  number: number;
};

type PullRequestData = {
  title: string;
  additions: number;
  deletions: number;
  html_url: string;
};

const BUTTON_ID = "octocopy-copy-pr-button";
const API_BASE_URL: string =
  import.meta.env.VITE_OCTOCOPY_API_BASE_URL || "http://localhost:3001";
const EXTENSION_API_KEY = import.meta.env.VITE_OCTOCOPY_EXTENSION_API_KEY;

const tokenCache = new Map<
  string,
  {
    value: string;
    expiresAt: number;
  }
>();

export default defineContentScript({
  matches: ["*://github.com/*/*/pull/*"],
  main() {
    const observer = new MutationObserver(handleDomChange);
    observer.observe(document.body, { childList: true, subtree: true });

    handleDomChange();
  },
});

let lastPathKey = "";

function handleDomChange() {
  // Avoid rework when the URL has not changed.
  const locationKey = `${window.location.pathname}${window.location.search}`;
  const buttonExists = Boolean(document.getElementById(BUTTON_ID));
  if (locationKey === lastPathKey && buttonExists) return;
  lastPathKey = locationKey;

  const prLocation = parsePullRequestFromLocation(window.location.pathname);
  if (!prLocation) {
    removeButton();
    return;
  }

  const mountPoint =
    document.querySelector(".gh-header-actions") ||
    document.querySelector(".gh-header-title")?.parentElement;
  if (!mountPoint) return;

  let button = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;
  if (!button) {
    button = createButton(prLocation);
    // Prefer to append to the actions row; fallback to end of the title stack.
    mountPoint.appendChild(button);
  } else {
    button.dataset.pr = serializePr(prLocation);
  }
}

function parsePullRequestFromLocation(
  pathname: string
): PullRequestLocation | null {
  // Expected pattern: /{owner}/{repo}/pull/{number}[...]
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 4) return null;
  const [owner, repo, maybePull, num] = parts;
  if (maybePull !== "pull") return null;
  const prNumber = Number(num);
  if (!Number.isInteger(prNumber)) return null;
  return { owner, repo, number: prNumber };
}

function createButton(pr: PullRequestLocation) {
  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.className = "btn btn-sm btn-primary";
  button.style.marginLeft = "8px";
  button.textContent = "Copy PR";
  button.dataset.pr = serializePr(pr);

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    const parsed = deserializePr(button.dataset.pr);
    if (!parsed) return;
    await handleCopy(button, parsed);
  });

  return button;
}

async function handleCopy(button: HTMLButtonElement, pr: PullRequestLocation) {
  setButtonState(button, "loading");

  try {
    const data = await fetchPullRequest(pr);
    if (!data) {
      throw new Error("Unable to load PR details.");
    }

    const text = formatTextMessage(pr, data);
    const html = formatHtmlMessage(pr, data);
    await copyToClipboard(text, html);

    setButtonState(button, "success");
  } catch (error) {
    console.error("Octocopy: failed to copy PR", error);
    setButtonState(button, "error");
  } finally {
    setTimeout(() => setButtonState(button, "idle"), 1500);
  }
}

async function fetchPullRequest(
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

async function getAccessToken(pr: PullRequestLocation): Promise<string | null> {
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

function formatTextMessage(pr: PullRequestLocation, data: PullRequestData) {
  const repoSlug = `${pr.owner}/${pr.repo}`;
  return `[${repoSlug}/${pr.number}]: ${data.title} (+${data.additions}/-${data.deletions}) [[github](${data.html_url})]`;
}

function formatHtmlMessage(pr: PullRequestLocation, data: PullRequestData) {
  const repoSlug = `${pr.owner}/${pr.repo}`;
  const escapedTitle = escapeHtml(data.title);
  return `<strong>[${repoSlug}/${pr.number}]:</strong> ${escapedTitle} (+${data.additions}/-${data.deletions}) [<a href="${data.html_url}">github</a>]`;
}

async function copyToClipboard(text: string, html: string) {
  if ("ClipboardItem" in window) {
    const item = new ClipboardItem({
      "text/plain": new Blob([text], { type: "text/plain" }),
      "text/html": new Blob([html], { type: "text/html" }),
    });
    await navigator.clipboard.write([item]);
  } else {
    await navigator.clipboard.writeText(text);
  }
}

function setButtonState(
  button: HTMLButtonElement,
  state: "idle" | "loading" | "success" | "error"
) {
  switch (state) {
    case "loading":
      button.disabled = true;
      button.textContent = "Copying...";
      break;
    case "success":
      button.disabled = false;
      button.textContent = "Copied!";
      break;
    case "error":
      button.disabled = false;
      button.textContent = "Error";
      break;
    default:
      button.disabled = false;
      button.textContent = "Copy PR";
  }
}

function removeButton() {
  const existing = document.getElementById(BUTTON_ID);
  if (existing?.parentElement) {
    existing.parentElement.removeChild(existing);
  }
}

function serializePr(pr: PullRequestLocation) {
  return JSON.stringify(pr);
}

function deserializePr(raw?: string | null): PullRequestLocation | null {
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

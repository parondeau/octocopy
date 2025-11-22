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
  const url = `https://api.github.com/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    console.warn("Octocopy: GitHub API request failed", response.status);
    return null;
  }

  const data = await response.json();
  return {
    title: data.title ?? "",
    additions: data.additions ?? 0,
    deletions: data.deletions ?? 0,
    html_url:
      data.html_url ?? url.replace("api.github.com/repos", "github.com"),
  };
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

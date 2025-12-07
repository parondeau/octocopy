import { copyPullRequest } from "../lib/copy-flow";
import {
  PullRequestLocation,
  deserializePullRequest,
  parsePullRequestFromPath,
  serializePullRequest,
} from "../lib/pull-request";

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

  const prLocation = parsePullRequestFromPath(window.location.pathname);
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
    button.dataset.pr = serializePullRequest(prLocation);
  }
}

function createButton(pr: PullRequestLocation) {
  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.className = "btn btn-sm btn-primary";
  button.style.marginLeft = "8px";
  button.textContent = "Copy PR";
  button.dataset.pr = serializePullRequest(pr);

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    const parsed = deserializePullRequest(button.dataset.pr);
    if (!parsed) return;
    await handleCopy(button, parsed);
  });

  return button;
}

async function handleCopy(button: HTMLButtonElement, pr: PullRequestLocation) {
  setButtonState(button, "loading");

  try {
    await copyPullRequest(pr);
    setButtonState(button, "success");
  } catch (error) {
    console.error("Octocopy: failed to copy PR", error);
    setButtonState(button, "error");
  } finally {
    setTimeout(() => setButtonState(button, "idle"), 1500);
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

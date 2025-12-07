import { copyPullRequest } from "../lib/copy-flow";
import {
  PullRequestLocation,
  deserializePullRequest,
  parsePullRequestFromPath,
  serializePullRequest,
} from "../lib/pull-request";

const BUTTON_ID = "octocopy-copy-pr-button";

type TargetPlatform = "github" | "graphite";

export default defineContentScript({
  matches: ["*://github.com/*/*/pull/*", "*://app.graphite.com/github/pr/*"],
  main() {
    const observer = new MutationObserver(handleDomChange);
    observer.observe(document.body, { childList: true, subtree: true });

    handleDomChange();
  },
});

let lastPathKey = "";

function handleDomChange() {
  // Avoid rework when the URL has not changed.
  const locationKey = `${window.location.host}${window.location.pathname}${window.location.search}`;
  const buttonExists = Boolean(document.getElementById(BUTTON_ID));
  if (locationKey === lastPathKey && buttonExists) return;
  lastPathKey = locationKey;

  const platform = getPlatform();
  if (!platform) {
    removeButton();
    return;
  }

  const prLocation = parsePullRequestFromPath(window.location.pathname);
  if (!prLocation) {
    removeButton();
    return;
  }

  const mountPoint = findMountPoint(platform);
  if (!mountPoint) return;

  let button = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;
  if (!button) {
    button = createButton(prLocation, platform);
  } else {
    button.dataset.pr = serializePullRequest(prLocation);
  }

  ensureButtonIsFirst(mountPoint, button);
}

function createButton(pr: PullRequestLocation, platform: TargetPlatform) {
  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.dataset.platform = platform;
  button.dataset.pr = serializePullRequest(pr);

  if (platform === "graphite") {
    styleGraphiteButton(button);
  } else {
    button.className = "Button Button--secondary Button--small flex-order-2";
  }
  setButtonLabel(button, "Copy PR");

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
      setButtonLabel(button, "Copying...");
      break;
    case "success":
      button.disabled = false;
      setButtonLabel(button, "Copied!");
      break;
    case "error":
      button.disabled = false;
      setButtonLabel(button, "Error");
      break;
    default:
      button.disabled = false;
      setButtonLabel(button, "Copy PR");
  }
}

function removeButton() {
  const existing = document.getElementById(BUTTON_ID);
  if (existing?.parentElement) {
    existing.parentElement.removeChild(existing);
  }
}

function getPlatform(): TargetPlatform | null {
  const host = window.location.host;
  if (host === "github.com" || host.endsWith(".github.com")) return "github";
  if (host.endsWith("graphite.com")) return "graphite";
  return null;
}

function findMountPoint(platform: TargetPlatform): HTMLElement | null {
  if (platform === "github") {
    return (
      document.querySelector(".gh-header-actions") ||
      document.querySelector(".gh-header-title")?.parentElement ||
      null
    );
  }

  const titleBar = document.querySelector<HTMLElement>(
    '[class^="PullRequestTitleBar_container__"]'
  );
  if (!titleBar) return null;
  const actionRow = titleBar.querySelector<HTMLElement>(
    '[class*="utilities_flexShrink0__"]'
  );
  return actionRow ?? titleBar;
}

function styleGraphiteButton(button: HTMLButtonElement) {
  const reference = document.querySelector<HTMLButtonElement>(
    '[class^="PullRequestTitleBar_container__"] button'
  );

  if (reference) {
    button.className = reference.className;
    copyGraphiteButtonAttributes(reference, button);
    const contentsClass = reference.querySelector<HTMLElement>(
      '[class^="Button_gdsButtonContents__"]'
    )?.className;
    const textClass = reference.querySelector<HTMLElement>(
      '[class^="Button_gdsButtonText__"]'
    )?.className;

    const contents = document.createElement("span");
    if (contentsClass) contents.className = contentsClass;
    const textWrapper = document.createElement("span");
    if (textClass) textWrapper.className = textClass;
    contents.appendChild(textWrapper);
    button.replaceChildren(contents);
    return;
  }

  button.className = "Button_gdsButton__SadwL";
  button.setAttribute("data-kind", "neutral");
  button.setAttribute("data-priority", "secondary");
  button.setAttribute("data-size", "m");
}

function copyGraphiteButtonAttributes(
  source: HTMLButtonElement,
  target: HTMLButtonElement
) {
  const attrs = ["data-kind", "data-priority", "data-size"];
  attrs.forEach((attr) => {
    const value = source.getAttribute(attr);
    if (value) target.setAttribute(attr, value);
  });
}

function setButtonLabel(button: HTMLButtonElement, label: string) {
  if (button.dataset.platform === "graphite") {
    const textWrapper = button.querySelector<HTMLElement>(
      '[class^="Button_gdsButtonText__"]'
    );
    if (textWrapper) {
      textWrapper.textContent = label;
      return;
    }
  }

  button.textContent = label;
}

function ensureButtonIsFirst(
  mountPoint: HTMLElement,
  button: HTMLButtonElement
) {
  const firstElement = mountPoint.firstElementChild;
  if (!firstElement) {
    mountPoint.appendChild(button);
    return;
  }

  if (firstElement === button) {
    if (button.parentElement !== mountPoint) {
      mountPoint.insertBefore(button, firstElement);
    }
    return;
  }

  mountPoint.insertBefore(button, firstElement);
}

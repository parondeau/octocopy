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
    styleGitHubButton(button);
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

function styleGitHubButton(button: HTMLButtonElement) {
  button.className = "Button Button--secondary Button--small flex-order-2";
  const contents = document.createElement("span");
  contents.style.display = "inline-flex";
  contents.style.alignItems = "center";
  contents.style.gap = "0.25rem";

  const icon = createIconWrapper();
  const label = document.createElement("span");
  label.dataset.octocopyLabel = "true";

  contents.append(icon, label);
  button.replaceChildren(contents);
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
    textWrapper.dataset.octocopyLabel = "true";
    const icon = createIconWrapper();
    contents.append(icon, textWrapper);
    button.replaceChildren(contents);
    return;
  }

  button.className = "Button_gdsButton__SadwL";
  button.setAttribute("data-kind", "neutral");
  button.setAttribute("data-priority", "secondary");
  button.setAttribute("data-size", "m");
  const contents = document.createElement("span");
  const textWrapper = document.createElement("span");
  textWrapper.dataset.octocopyLabel = "true";
  contents.append(createIconWrapper(), textWrapper);
  button.replaceChildren(contents);
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
  const labelTarget = button.querySelector<HTMLElement>(
    "[data-octocopy-label]"
  );
  if (labelTarget) {
    labelTarget.textContent = label;
    return;
  }

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

function createIconWrapper() {
  const wrapper = document.createElement("span");
  wrapper.dataset.octocopyIcon = "true";
  wrapper.style.display = "inline-flex";
  wrapper.style.alignItems = "center";
  wrapper.style.lineHeight = "0";
  wrapper.style.marginRight = "0.25rem";
  wrapper.appendChild(createCopyIcon());
  return wrapper;
}

function createCopyIcon() {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("xmlns", svgNS);
  svg.setAttribute("fill", "none");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute(
    "d",
    "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
  );
  svg.appendChild(path);
  return svg;
}

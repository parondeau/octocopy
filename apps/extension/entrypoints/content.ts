import { copyPullRequest } from "../lib/copy-flow";
import {
  PullRequestLocation,
  deserializePullRequest,
  parsePullRequestFromPath,
  serializePullRequest,
} from "../lib/pull-request";

const BUTTON_ID = "octocopy-copy-pr-button";
const COPY_MESSAGE_TYPE = "octocopy:copy-current-pr";
const TOAST_ID = "octocopy-toast";

type TargetPlatform = "github" | "graphite";

export default defineContentScript({
  matches: ["*://github.com/*/*/pull/*", "*://app.graphite.com/github/pr/*"],
  main() {
    const observer = new MutationObserver(handleDomChange);
    observer.observe(document.body, { childList: true, subtree: true });

    browser.runtime.onMessage.addListener((message) => {
      if (!message || message.type !== COPY_MESSAGE_TYPE) return;
      void handleToolbarCopy();
    });

    handleDomChange();
  },
});

let lastPathKey = "";

function handleDomChange() {
  // Avoid rework when the URL has not changed.
  const locationKey = `${window.location.host}${window.location.pathname}${window.location.search}`;
  const buttonExists = Boolean(document.getElementById(BUTTON_ID));
  if (locationKey === lastPathKey && buttonExists && !shouldRefreshExistingButton()) {
    return;
  }
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

  ensureButtonPlacement(platform, mountPoint, button);
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
  const reference = findGitHubReferenceButton();

  if (reference) {
    button.className = reference.className;
    copyGitHubButtonAttributes(reference, button);

    const contentClass = reference.querySelector<HTMLElement>(
      '[data-component="buttonContent"]'
    )?.className;
    const textClass = reference.querySelector<HTMLElement>(
      '[data-component="text"]'
    )?.className;

    // Match new GitHub button anatomy with a plain text button (no custom icon).
    if (contentClass && textClass) {
      const content = document.createElement("span");
      content.className = contentClass;
      content.setAttribute("data-component", "buttonContent");
      content.setAttribute("data-align", "center");

      const leadingVisualClass = reference.querySelector<HTMLElement>(
        '[data-component="leadingVisual"]'
      )?.className;
      const leadingVisual = document.createElement("span");
      if (leadingVisualClass) {
        leadingVisual.className = leadingVisualClass;
      } else {
        leadingVisual.className = "prc-Button-Visual-YNt2F prc-Button-VisualWrap-E4cnq";
      }
      leadingVisual.setAttribute("data-component", "leadingVisual");
      leadingVisual.append(createPrimerCopyIcon());

      const text = document.createElement("span");
      text.className = textClass;
      text.setAttribute("data-component", "text");
      text.dataset.octocopyLabel = "true";
      content.append(leadingVisual);
      content.append(text);
      button.replaceChildren(content);
      button.dataset.githubStyle = "primer-icon";
      return;
    }
  }

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
  button.dataset.githubStyle = "legacy";
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

async function handleToolbarCopy() {
  const prLocation = parsePullRequestFromPath(window.location.pathname);
  if (!prLocation) return;
  try {
    await copyPullRequest(prLocation);
    showToast("Copied PR to clipboard.");
  } catch (error) {
    console.error("Octocopy: failed to copy PR from toolbar click", error);
    showToast("Unable to copy PR details.", "error");
  }
}

function showToast(message: string, tone: "success" | "error" = "success") {
  const existing = document.getElementById(TOAST_ID);
  if (existing?.parentElement) {
    existing.parentElement.removeChild(existing);
  }

  const wrapper = document.createElement("div");
  wrapper.id = TOAST_ID;
  wrapper.style.position = "fixed";
  wrapper.style.top = "16px";
  wrapper.style.right = "16px";
  wrapper.style.transform = "translateY(-8px)";
  wrapper.style.zIndex = "2147483647";
  wrapper.style.opacity = "0";
  wrapper.style.transition = "opacity 140ms ease, transform 140ms ease";

  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.border = "1px solid";
  toast.style.borderColor = tone === "success" ? "#1f883d" : "#cf222e";
  toast.style.backgroundColor = tone === "success" ? "#dafbe1" : "#ffebe9";
  toast.style.color = tone === "success" ? "#1a7f37" : "#cf222e";
  toast.style.borderRadius = "6px";
  toast.style.padding = "12px 16px";
  toast.style.whiteSpace = "nowrap";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "500";
  toast.style.boxShadow = "0 8px 24px rgba(31, 35, 40, 0.15)";

  wrapper.appendChild(toast);
  document.body.appendChild(wrapper);

  requestAnimationFrame(() => {
    wrapper.style.opacity = "1";
    wrapper.style.transform = "translateY(0)";
  });

  window.setTimeout(() => {
    wrapper.style.opacity = "0";
    wrapper.style.transform = "translateY(-8px)";
    window.setTimeout(() => wrapper.remove(), 160);
  }, 1800);
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
    return findGitHubMountPoint();
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

function findGitHubMountPoint(): HTMLElement | null {
  const pageHeaderActions = document.querySelector<HTMLElement>(
    '[data-component="PH_Actions"]'
  );

  if (pageHeaderActions) {
    const textNodes = pageHeaderActions.querySelectorAll<HTMLElement>(
      '[data-component="text"]'
    );
    const codeText = Array.from(textNodes).find(
      (node) => node.textContent?.trim() === "Code"
    );
    const codeButton = codeText?.closest("button");
    if (codeButton?.parentElement) {
      return codeButton.parentElement as HTMLElement;
    }
    const rightActionGroup = pageHeaderActions.querySelector<HTMLElement>(
      ".d-flex.gap-2"
    );
    if (rightActionGroup) return rightActionGroup;
    return pageHeaderActions;
  }

  return (
    document.querySelector<HTMLElement>('[class*="PageHeader-Actions"]') ||
    document.querySelector<HTMLElement>(".gh-header-actions") ||
    document.querySelector<HTMLElement>(".gh-header-title")?.parentElement ||
    null
  );
}

function findGitHubReferenceButton(): HTMLButtonElement | null {
  const newHeader = document.querySelector<HTMLElement>('[data-component="PH_Actions"]');
  if (newHeader) {
    return (
      newHeader.querySelector<HTMLButtonElement>(
        'button[data-size="small"][data-variant="default"][data-no-visuals="true"]'
      ) ||
      newHeader.querySelector<HTMLButtonElement>(
        'button[data-size="small"][data-variant="default"]'
      ) ||
      newHeader.querySelector<HTMLButtonElement>("button")
    );
  }

  return (
    document.querySelector<HTMLButtonElement>(".gh-header-actions button") ||
    document.querySelector<HTMLButtonElement>(".gh-header-actions .Button") ||
    document.querySelector<HTMLButtonElement>(
      '[class*="PageHeader-Actions"] button'
    )
  );
}

function copyGitHubButtonAttributes(
  source: HTMLButtonElement,
  target: HTMLButtonElement
) {
  const attrs = ["data-size", "data-variant", "data-no-visuals", "data-loading"];
  attrs.forEach((attr) => {
    const value = source.getAttribute(attr);
    if (value) target.setAttribute(attr, value);
  });
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

function ensureButtonPlacement(
  platform: TargetPlatform,
  mountPoint: HTMLElement,
  button: HTMLButtonElement
) {
  if (platform === "github") {
    if (button.parentElement !== mountPoint) {
      mountPoint.appendChild(button);
      return;
    }

    if (mountPoint.lastElementChild !== button) {
      mountPoint.appendChild(button);
    }
    return;
  }

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

function shouldRefreshExistingButton() {
  const button = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;
  if (!button) return false;

  if (button.dataset.platform !== "github") return false;
  if (button.dataset.githubStyle === "primer-icon") return false;

  return Boolean(findGitHubReferenceButton());
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

function createPrimerCopyIcon() {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("class", "octicon octicon-copy");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("display", "inline-block");
  svg.setAttribute("overflow", "visible");
  svg.style.verticalAlign = "text-bottom";

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute(
    "d",
    "M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"
  );
  svg.appendChild(path);

  return svg;
}

import { parsePullRequestFromPath } from "../lib/pull-request";

const OPEN_MENU_ITEM_ID = "octocopy-open-menu";
const COPY_MESSAGE_TYPE = "octocopy:copy-current-pr";
const POPUP_PAGE = "/popup.html";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void initializeActionMenu();
  });

  browser.runtime.onStartup.addListener(() => {
    void initializeActionMenu();
  });

  browser.action.onClicked.addListener((tab) => {
    void handleToolbarClick(tab);
  });

  browser.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === OPEN_MENU_ITEM_ID) {
      void openMenuUi();
    }
  });

  void initializeActionMenu();
});

async function initializeActionMenu() {
  // Disable popup so toolbar clicks always route through action.onClicked.
  await browser.action.setPopup({ popup: "" });

  try {
    await browser.contextMenus.remove(OPEN_MENU_ITEM_ID);
  } catch {
    // Ignore remove failures when the item does not exist yet.
  }

  const contexts = getActionMenuContexts();
  for (const context of contexts) {
    try {
      browser.contextMenus.create({
        id: OPEN_MENU_ITEM_ID,
        title: "Open Octocopy Settings",
        contexts: [context],
      });
      return;
    } catch {
      // Try the next context for cross-browser compatibility.
    }
  }
}

async function handleToolbarClick(tab: { id?: number; url?: string }) {
  if (!tab.id || !tab.url) return;

  const url = new URL(tab.url);
  const pr = parsePullRequestFromPath(url.pathname);
  if (!pr) return;

  try {
    await browser.tabs.sendMessage(tab.id, { type: COPY_MESSAGE_TYPE });
  } catch {
    // Ignore if the content script is not ready on the current tab.
  }
}

function getActionMenuContexts() {
  return ["action", "browser_action"] as const;
}

async function openMenuUi() {
  const popupUrl = browser.runtime.getURL(POPUP_PAGE);
  await browser.tabs.create({ url: popupUrl });
}

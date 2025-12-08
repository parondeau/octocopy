# Octocopy Browser Extension

Octocopy adds a contextual **Copy PR** button to GitHub and Graphite pull request pages.  
When clicked, it gathers the PR title and diff statistics (via the DOM, a personal access token, or the Octocopy GitHub App), builds a Markdown/HTML payload, and pushes it to the clipboard so reviewers can paste rich PR summaries anywhere.

## Development quick start

```bash
cd apps/extension
bun install        # once

# Local development (Chromium-based browsers)
bun run dev

# Local development targeting Firefox
bun run dev:firefox
```

- `bun run build` / `bun run build:firefox` outputs production bundles to `dist/`.
- `bun run zip` / `bun run zip:firefox` produces store-ready archives in `dist-zip/`.
- Optional environment variables:  
  - `VITE_OCTOCOPY_API_BASE_URL` (defaults to `https://octocopy.app/api`).  
  - `VITE_OCTOCOPY_EXTENSION_API_KEY` (only needed when exercising the GitHub App flow against the hosted API).

## Permissions requested

| Permission | Reason |
| --- | --- |
| `clipboardWrite` | Required to write both the Markdown and HTML payloads when the button is clicked. |
| `storage` | Stores the selected mode (App, PAT, UI-only), platform toggles, and optional PAT locally. |
| `https://github.com/*` & `*://app.graphite.com/*` (content script) | Injects the Copy PR button into pull request pages and scrapes DOM data in UI-only mode. |
| `https://api.github.com/*` | Fetches pull request metadata when using the PAT or GitHub App modes. |
| `http://localhost:3000/*` | Allows developers to point the extension at a locally running Octocopy API during development; production builds do not contact this origin unless the API base URL is overridden. |

No credentials or clipboard data leave the user’s machine unless the reviewer explicitly supplies a PAT or connects to the Octocopy backend.

## Instructions for store reviewers

The default **UI-only** mode requires no special credentials and exercises every permission requested above. All steps below can be executed with the platform-specific zip(s) emitted into `dist-zip/` by `bun run zip` / `bun run zip:firefox`, or with an unpacked build from `bun run build`.

### Chrome Web Store

1. Navigate to `chrome://extensions`, enable **Developer mode**, and load the build (`Load unpacked` → `dist/` or drag in `chrome-mv3.zip`). Pin “Octocopy” so the toolbar icon is visible.
2. Open any public GitHub pull request (for example, `https://github.com/octokit/rest.js/pull/2342`). A `Copy PR` button should appear next to the existing GitHub header buttons.
3. Leave the popup in the default **UI-only** mode. Toggle the GitHub/Graphite switches if desired; at least one platform must remain enabled.
4. Click the injected `Copy PR` button. The label should advance through `Copying…` → `Copied!`. Paste into any text field to confirm the clipboard payload looks like `[owner/repo/123]: Title (+12/-2) [github](...)`.
5. Toggle to **Personal Access Token** mode to verify the UI controls (you do not need to supply a real token for approval). Return to **UI-only** afterwards.
6. If you have a Graphite account, visit `https://app.graphite.com/github/pr/<owner>/<repo>/<number>` to confirm the button renders there as well; otherwise this step is optional.
7. Expected network traffic: unauthenticated requests to `https://github.com/*` for asset loading and optional requests to `https://api.github.com/*` only when PAT/App modes are used.

### Firefox Add-ons

1. Visit `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…**, and choose either the Firefox zip (`dist-zip/firefox-mv2.zip`) or `manifest.json` inside `dist/`.
2. Repeat steps 2–5 from the Chrome flow inside Firefox (the UI is identical). Clipboard copy will fall back to `navigator.clipboard.writeText` if rich clipboard is unavailable, which is acceptable for review.
3. When testing PAT or App modes, note that the GitHub App flow requires an Octocopy reviewer account. If you do not have one, keep the extension in UI-only mode; all other functionality can be validated that way.
4. Confirm that disabling both platform toggles is disallowed (one must stay enabled) and that the popup clearly surfaces the detected hostname in UI-only mode.
5. Expected Firefox-specific permissions: the extension injects scripts only on the host patterns listed above and never requests remote code.

If you run into questions while reviewing either build, reach out via the support email listed in the store metadata and we can provide temporary PATs or Octocopy App credentials.

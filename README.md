# Octocopy

Octocopy is a focused toolkit for copying GitHub resources—repositories, labels, milestones, and other metadata—without losing traceability. This monorepo contains the public documentation site plus the browser extension that adds a contextual **Copy PR** button to GitHub and Graphite so reviewers can share rich summaries anywhere.

## Apps & packages

- `apps/web` – TanStack Start/Vite app that powers octocopy.app, the landing page and documentation that explains how to authorize the GitHub App or provision personal access tokens.
- `apps/extension` – WXT + React browser extension that reads pull request metadata, talks to the Octocopy backend when needed, and prepares Markdown/HTML snippets for reviewers.
- `packages/@octocopy/eslint-config` – shared ESLint configuration for every workspace.
- `packages/@octocopy/typescript-config` – base `tsconfig` presets consumed by both apps.

Everything is TypeScript and orchestrated through Turborepo with Bun as the package manager.

## Requirements

- Node.js 18 or newer
- [Bun 1.2+](https://bun.sh/)
- Chrome or Firefox (only when testing the extension locally)

## Install dependencies

```bash
bun install
```

Run the command above from the repository root once; it will install dependencies for every workspace.

## Run the stack

- `bun run dev` – starts every available `dev` task through Turbo (web on port `3000`, extension via WXT, etc.).
- `bun run build` – produces production builds for both apps (`dist/`, `.output/`, and extension bundles).
- `bun run lint`, `bun run check-types` – repo-wide linting and type-checking.

Use Turbo filters when you only need a single workspace:

```bash
# Docs / marketing site
bun run dev -- --filter=@octocopy/web
bun run build -- --filter=@octocopy/web

# Browser extension
bun run dev -- --filter=@octocopy/extension
bun run build -- --filter=@octocopy/extension
```

The `web` app becomes available at http://localhost:3000 by default. The extension dev task streams WXT logs and makes the unpacked build available for Chromium and Firefox—follow the prompts printed in the terminal to load it into your browser. Run `bun run zip -- --filter=@octocopy/extension` when you need store-ready archives.

For in-depth extension instructions (permissions, reviewer flows, and optional environment variables), see `apps/extension/README.md`.

# Octocopy Web

This app powers octocopy.app—the landing page and docs that walk through PATs, the GitHub App, and extension workflows. It is a TanStack Start project wired up with Vite, React, Tailwind, and Vitest.

## Getting started

```bash
cd apps/web
bun install        # once from repo root, or run here if needed
bun --bun run dev  # http://localhost:3000
```

## Production build

```bash
bun --bun run build
bun --bun run serve  # preview the build locally
```

Tests (`bun --bun run test`) and linting (`bun --bun run lint`) are optional but available when you need them.

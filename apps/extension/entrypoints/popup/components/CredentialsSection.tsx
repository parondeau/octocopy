import type { Mode } from "../types";
import { sectionCardClass } from "./ui";

type Props = {
  mode: Mode;
  tokenValue: string;
  onTokenChange: (value: string) => void;
};

export function CredentialsSection({ mode, tokenValue, onTokenChange }: Props) {
  return (
    <section className={sectionCardClass}>
      <h2 className="text-base font-semibold text-slate-900">
        Credentials &amp; configuration
      </h2>
      {mode === "app" && (
        <>
          <p className="text-sm text-slate-600">
            Install the Github app so the Octocopy API can mint short-lived
            GitHub tokens on demand.
          </p>
          <p className="text-xs text-slate-500">
            We only cache installation IDs locally. Tokens are minted
            server-side.{" "}
          </p>
          <p>
            <a
              href="https://octocopy.app/docs/install-github-app"
              className="ml-1 text-indigo-600 underline hover:text-indigo-500"
              target="_blank"
              rel="noreferrer"
            >
              Read the setup guide
            </a>
          </p>
        </>
      )}

      {mode === "token" && (
        <>
          <p className="text-sm text-slate-600">
            Paste a classic PAT with <code>repo</code> + <code>read:org</code>{" "}
            scopes to fetch private PR data.
            <a
              href="https://octocopy.app/docs/personal-access-token"
              className="ml-1 text-indigo-600 underline hover:text-indigo-500"
              target="_blank"
              rel="noreferrer"
            >
              Read the setup guide
            </a>
            .
          </p>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            <span>Personal access token</span>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxx"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              value={tokenValue}
              onChange={(event) => onTokenChange(event.target.value)}
            />
          </label>
          <p className="text-xs text-slate-500">
            Tokens never leave your browser; we store them securely locally.
          </p>
        </>
      )}

      {mode === "ui" && (
        <>
          <p className="text-sm text-slate-600">
            UI-only mode inspects DOM nodes from the current tab to assemble PR
            stats.
          </p>
          <p className="text-xs text-slate-500">
            Some layouts (Graphite, custom GitHub themes) may hide data we need.
            We will surface fallback prompts if parsing fails.
          </p>
        </>
      )}
    </section>
  );
}

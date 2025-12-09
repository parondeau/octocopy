import type { Mode } from "../types";
import { cx, secondaryButton, sectionCardClass, statusTone } from "./ui";

type Props = {
  mode: Mode;
  tokenValue: string;
  tokenStatus: "idle" | "validating" | "valid" | "invalid";
  detectedSite: string | null;
  onValidateToken: () => void;
  onTokenChange: (value: string) => void;
};

const badgeBase =
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";

export function CredentialsSection({
  detectedSite,
  mode,
  tokenStatus,
  tokenValue,
  onTokenChange,
  onValidateToken,
}: Props) {
  return (
    <section className={sectionCardClass}>
      <h2 className="text-base font-semibold text-slate-900">
        Credentials &amp; configuration
      </h2>
      {mode === "app" && (
        <>
          <p className="text-sm text-slate-600">
            Connect the popup to the Octocopy API so we can mint short-lived
            GitHub tokens on demand.
          </p>
          <p className="text-xs text-slate-500">
            We only cache installation IDs locally. Tokens are minted
            server-side via{" "}
            <code className="font-mono text-[11px]">apps/web</code>.
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
          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <button className={secondaryButton} onClick={onValidateToken}>
              Validate token
            </button>
            <span className={cx(badgeBase, statusTone[tokenStatus])}>
              {tokenStatus === "idle" && "Not validated"}
              {tokenStatus === "validating" && "Validating…"}
              {tokenStatus === "valid" && "Looks good"}
              {tokenStatus === "invalid" && "Check token"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Tokens never leave your browser; we store them securely locally.
          </p>
        </>
      )}

      {mode === "ui" && (
        <>
          <p className="text-sm text-slate-600">
            UI-only mode inspects DOM nodes from the current tab to assemble PR
            stats. Great for locked-down orgs, but data is limited to what the
            UI shows.
          </p>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Detected site:</span>
            <span className={cx(badgeBase, statusTone.neutral)}>
              {detectedSite ?? "Unknown"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Some layouts (Graphite, custom GitHub themes) may hide data we need.
            We will surface fallback prompts if parsing fails.
          </p>
        </>
      )}
    </section>
  );
}

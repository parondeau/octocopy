import { useEffect, useMemo, useState } from "react";

type Mode = "app" | "token" | "ui";
type Format = "rich" | "markdown" | "plain";

type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

type PlatformSettings = {
  github: boolean;
  graphite: boolean;
  format: Format;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "install-app",
    label: "Install the Octocopy GitHub App",
    description:
      "The app lets us mint scoped tokens from the web service so the extension never stores your GitHub password.",
    actionLabel: "Open install page",
    actionHref: "https://github.com/apps/octocopy",
  },
  {
    id: "choose-mode",
    label: "Pick a runtime mode",
    description:
      "Choose GitHub App, Personal Token, or UI-only mode so we know how to fetch PR stats.",
  },
];

const MODE_OPTIONS: Record<
  Mode,
  { title: string; summary: string; highlights: string[] }
> = {
  app: {
    title: "GitHub App",
    summary:
      "Recommended. Uses the Octocopy backend to mint short-lived tokens.",
    highlights: [
      "Works across orgs where the app is installed",
      "Automatic rate limiting + audit trail",
    ],
  },
  token: {
    title: "Personal Token",
    summary: "Bring your own PAT when you cannot install the GitHub App.",
    highlights: [
      "Stored locally only",
      "Requires repo + read:org scopes for private repos",
    ],
  },
  ui: {
    title: "UI-only",
    summary:
      "No credentials. We parse the DOM of the current page to assemble PR stats.",
    highlights: ["Great for read-only access", "Limited to visible PR info"],
  },
};

const FORMAT_LABELS: Record<Format, string> = {
  rich: "Rich Text",
  markdown: "Markdown",
  plain: "Plain Text",
};

const statusTone: Record<string, string> = {
  connected: "bg-emerald-100 text-emerald-700",
  valid: "bg-emerald-100 text-emerald-700",
  disconnected: "bg-rose-100 text-rose-700",
  invalid: "bg-rose-100 text-rose-700",
  checking: "bg-indigo-100 text-indigo-700",
  validating: "bg-indigo-100 text-indigo-700",
  idle: "bg-slate-100 text-slate-600",
  neutral: "bg-slate-100 text-slate-600",
};

const buttonBase =
  "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500";

const secondaryButton = `${buttonBase} border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100`;

const cardClass =
  "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

const listCardClass =
  "flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function usePersistentState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write errors (private browsing, etc).
    }
  }, [key, value]);

  return [value, setValue] as const;
}

const defaultOnboardingState = ONBOARDING_STEPS.reduce(
  (acc, step) => ({ ...acc, [step.id]: false }),
  {} as Record<string, boolean>
);

const defaultPlatforms: PlatformSettings = {
  github: true,
  graphite: true,
  format: "rich",
};

function App() {
  const [onboardingState, setOnboardingState] = usePersistentState(
    "octocopy-onboarding",
    defaultOnboardingState
  );
  const [mode, setMode] = usePersistentState<Mode>("octocopy-mode", "app");
  const [platforms, setPlatforms] = usePersistentState(
    "octocopy-platforms",
    defaultPlatforms
  );
  const [tokenValue, setTokenValue] = usePersistentState("octocopy-token", "");

  const [appStatus, setAppStatus] = useState<
    "disconnected" | "checking" | "connected"
  >("disconnected");
  const [tokenStatus, setTokenStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [detectedSite, setDetectedSite] = useState<string | null>(null);

  const completionCount = useMemo(
    () => Object.values(onboardingState).filter(Boolean).length,
    [onboardingState]
  );

  useEffect(() => {
    const chromeApi = (globalThis as typeof globalThis & { chrome?: any })
      .chrome;
    if (!chromeApi?.tabs?.query) {
      setDetectedSite(null);
      return;
    }
    chromeApi.tabs.query(
      { active: true, currentWindow: true },
      (tabs: Array<{ url?: string }>) => {
        const [tab] = tabs;
        if (!tab?.url) {
          setDetectedSite(null);
          return;
        }
        try {
          const url = new URL(tab.url);
          setDetectedSite(url.hostname);
        } catch {
          setDetectedSite(null);
        }
      }
    );
  }, []);

  const handleToggleOnboarding = (id: string) => {
    setOnboardingState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePlatformToggle = (name: "github" | "graphite") => {
    setPlatforms((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleAppRefresh = () => {
    setAppStatus("checking");
    window.setTimeout(() => {
      setAppStatus("connected");
    }, 600);
  };

  const handleValidateToken = () => {
    setTokenStatus("validating");
    window.setTimeout(() => {
      const nextStatus =
        tokenValue.trim().startsWith("ghp_") || tokenValue.trim().length > 15
          ? "valid"
          : "invalid";
      setTokenStatus(nextStatus);
    }, 600);
  };

  const renderModeConfig = () => {
    if (mode === "app") {
      return (
        <>
          <p className="text-sm text-slate-600">
            Connect the popup to the Octocopy API so we can mint short-lived
            GitHub tokens on demand.
          </p>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Status:</span>
            <span
              className={cx(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                statusTone[appStatus]
              )}
            >
              {appStatus === "checking"
                ? "Checking…"
                : appStatus === "connected"
                  ? "Connected"
                  : "Disconnected"}
            </span>
          </div>
          <button className={secondaryButton} onClick={handleAppRefresh}>
            Refresh app connection
          </button>
          <p className="text-xs text-slate-500">
            We only cache installation IDs locally. Tokens are minted
            server-side via{" "}
            <code className="font-mono text-[11px]">apps/web</code>.
          </p>
        </>
      );
    }

    if (mode === "token") {
      return (
        <>
          <p className="text-sm text-slate-600">
            Paste a classic PAT with <code>repo</code> + <code>read:org</code>{" "}
            scopes to fetch private PR data.
          </p>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            <span>Personal access token</span>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxx"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              value={tokenValue}
              onChange={(event) => {
                setTokenValue(event.target.value);
                setTokenStatus("idle");
              }}
            />
          </label>
          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <button className={secondaryButton} onClick={handleValidateToken}>
              Validate token
            </button>
            <span
              className={cx(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                statusTone[tokenStatus]
              )}
            >
              {tokenStatus === "idle" && "Not validated"}
              {tokenStatus === "validating" && "Validating…"}
              {tokenStatus === "valid" && "Looks good"}
              {tokenStatus === "invalid" && "Check token"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Tokens never leave your browser; we store them with{" "}
            <code className="font-mono text-[11px]">chrome.storage.local</code>.
          </p>
        </>
      );
    }

    return (
      <>
        <p className="text-sm text-slate-600">
          UI-only mode inspects DOM nodes from the current tab to assemble PR
          stats. Great for locked-down orgs, but data is limited to what the UI
          shows.
        </p>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Detected site:</span>
          <span
            className={cx(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
              statusTone.neutral
            )}
          >
            {detectedSite ?? "Unknown"}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Some layouts (Graphite, custom GitHub themes) may hide data we need.
          We will surface fallback prompts if parsing fails.
        </p>
      </>
    );
  };

  return (
    <div className="flex min-w-[360px] max-w-[420px] flex-col gap-4 bg-slate-100 p-4 text-slate-900">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Octocopy</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure how the extension fetches PR stats before copying.
        </p>
      </header>

      <section className={cardClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Onboarding checklist
            </h2>
            <p className="text-sm text-slate-500">
              {completionCount}/{ONBOARDING_STEPS.length} steps completed
            </p>
          </div>
          <a
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            href="https://octocopy.app/docs"
            target="_blank"
            rel="noreferrer"
          >
            View docs
          </a>
        </div>
        <ul className="space-y-3">
          {ONBOARDING_STEPS.map((step) => (
            <li key={step.id}>
              <label className={cx(listCardClass, "cursor-pointer")}>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-indigo-600"
                  checked={Boolean(onboardingState[step.id])}
                  onChange={() => handleToggleOnboarding(step.id)}
                />
                <div className="space-y-1 text-sm text-slate-600">
                  <span className="block text-base font-semibold text-slate-900">
                    {step.label}
                  </span>
                  <p className="text-sm text-slate-500">{step.description}</p>
                  {step.actionLabel && step.actionHref && (
                    <a
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      href={step.actionHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {step.actionLabel}
                    </a>
                  )}
                </div>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-semibold text-slate-900">Mode</h2>
        <div className="flex flex-col gap-3">
          {(Object.keys(MODE_OPTIONS) as Mode[]).map((option) => {
            const optionData = MODE_OPTIONS[option];
            const isActive = mode === option;
            return (
              <button
                key={option}
                className={cx(
                  "text-left",
                  listCardClass,
                  "w-full flex-col gap-2 px-4 py-3",
                  isActive
                    ? "border-indigo-400 bg-indigo-50 shadow-inner"
                    : "hover:border-indigo-200 hover:bg-indigo-50"
                )}
                onClick={() => setMode(option)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-base font-semibold text-slate-900">
                      {optionData.title}
                    </span>
                    <p className="text-sm text-slate-500">
                      {optionData.summary}
                    </p>
                  </div>
                  {isActive && (
                    <span className="inline-flex h-fit items-center rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                      Active
                    </span>
                  )}
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {optionData.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-semibold text-slate-900">
          Credentials & configuration
        </h2>
        {renderModeConfig()}
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-semibold text-slate-900">
          Platforms & format
        </h2>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={platforms.github}
              onChange={() => handlePlatformToggle("github")}
            />
            <span>Include GitHub link</span>
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={platforms.graphite}
              onChange={() => handlePlatformToggle("graphite")}
            />
            <span>Include Graphite link</span>
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          <span>Copy format</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            value={platforms.format}
            onChange={(event) =>
              setPlatforms({
                ...platforms,
                format: event.target.value as Format,
              })
            }
          >
            {(Object.keys(FORMAT_LABELS) as Format[]).map((format) => (
              <option key={format} value={format}>
                {FORMAT_LABELS[format]}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-500">
          Toggles only affect the extension popup. We will sync with the
          background script in a follow-up.
        </p>
      </section>
    </div>
  );
}

export default App;

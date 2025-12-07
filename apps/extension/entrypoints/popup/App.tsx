import { useEffect, useState } from "react";
import { CredentialsSection } from "./components/CredentialsSection";
import { ModeSection } from "./components/ModeSection";
import { PlatformsSection } from "./components/PlatformsSection";
import { useStoredState } from "./hooks/useStoredState";
import type { Mode, PlatformSettings } from "./types";

const MODE_OPTIONS: Record<
  Mode,
  { title: string; summary: string; highlights: string[] }
> = {
  token: {
    title: "Personal Access Token",
    summary:
      "Recommended. Bring your own PAT when you cannot install the GitHub App.",
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
  app: {
    title: "GitHub App",
    summary: "Uses the Octocopy backend to mint short-lived tokens.",
    highlights: [
      "Works across orgs where the app is installed",
      "Automatic rate limiting + audit trail",
    ],
  },
};

const defaultPlatforms: PlatformSettings = {
  github: true,
  graphite: false,
};

function App() {
  const [mode, setMode] = useStoredState<Mode>("octocopy-mode", "app");
  const [platforms, setPlatforms] = useStoredState(
    "octocopy-platforms",
    defaultPlatforms
  );
  const [tokenValue, setTokenValue] = useStoredState("octocopy-token", "");

  const [appStatus, setAppStatus] = useState<
    "disconnected" | "checking" | "connected"
  >("disconnected");
  const [tokenStatus, setTokenStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [detectedSite, setDetectedSite] = useState<string | null>(null);

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

  const handlePlatformToggle = (name: "github" | "graphite") => {
    setPlatforms((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleTokenChange = (value: string) => {
    setTokenValue(value);
    setTokenStatus("idle");
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

  return (
    <div className="flex min-w-[360px] max-w-[420px] flex-col gap-4 bg-slate-100 p-4 text-slate-900">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Octocopy</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure how the extension fetches PR stats before copying.
        </p>
      </header>

      <ModeSection mode={mode} options={MODE_OPTIONS} onChange={setMode} />

      <CredentialsSection
        mode={mode}
        tokenValue={tokenValue}
        appStatus={appStatus}
        tokenStatus={tokenStatus}
        detectedSite={detectedSite}
        onRefreshApp={handleAppRefresh}
        onValidateToken={handleValidateToken}
        onTokenChange={handleTokenChange}
      />

      <PlatformsSection platforms={platforms} onToggle={handlePlatformToggle} />
    </div>
  );
}

export default App;

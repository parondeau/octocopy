import { useEffect } from "react";
import { CredentialsSection } from "./components/CredentialsSection";
import { ModeSection } from "./components/ModeSection";
import { MessageSection } from "./components/MessageSection";
import { PlatformsSection } from "./components/PlatformsSection";
import { useStoredState } from "./hooks/useStoredState";
import type { Mode, PlatformSettings } from "./types";

const MODE_OPTIONS = {
  ui: {
    title: "UI-only",
    summary:
      "Recommended. No credentials. We parse the DOM of the current page to assemble PR stats.",
    highlights: ["Great for read-only access", "Limited to visible PR info"],
  },
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
    title: "Personal Access Token",
    summary: "Bring your own PAT when you cannot install the GitHub App.",
    highlights: [
      "Stored locally only",
      "Requires repo + read:org scopes for private repos",
    ],
  },
};

const defaultPlatforms: PlatformSettings = {
  github: true,
  graphite: false,
};

function App() {
  const [mode, setMode] = useStoredState<Mode>("octocopy-mode", "ui");
  const [platforms, setPlatforms] = useStoredState(
    "octocopy-platforms",
    defaultPlatforms
  );
  const [tokenValue, setTokenValue] = useStoredState("octocopy-token", "");
  const [includeBranchName, setIncludeBranchName] = useStoredState(
    "octocopy-include-branch",
    false
  );

  useEffect(() => {
    if (!platforms.github && !platforms.graphite) {
      setPlatforms(defaultPlatforms);
    }
  }, [platforms, setPlatforms]);

  const handlePlatformToggle = (name: "github" | "graphite") => {
    setPlatforms((prev) => {
      const nextValue = !prev[name];
      if (!nextValue) {
        const otherPlatform = name === "github" ? prev.graphite : prev.github;
        if (!otherPlatform) {
          return prev;
        }
      }
      return {
        ...prev,
        [name]: nextValue,
      };
    });
  };

  const handleTokenChange = (value: string) => {
    setTokenValue(value);
  };

  const handleIncludeBranchToggle = (value: boolean) => {
    setIncludeBranchName(value);
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
        onTokenChange={handleTokenChange}
      />

      <PlatformsSection platforms={platforms} onToggle={handlePlatformToggle} />
      <MessageSection
        includeBranchName={includeBranchName}
        onToggle={handleIncludeBranchToggle}
      />
    </div>
  );
}

export default App;

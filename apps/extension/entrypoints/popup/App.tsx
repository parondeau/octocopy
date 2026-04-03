import { useEffect } from "react";
import { CredentialsSection } from "./components/CredentialsSection";
import { MessageFormatSection } from "./components/MessageFormatSection";
import { ModeSection } from "./components/ModeSection";
import { PlatformsSection } from "./components/PlatformsSection";
import { useStoredState } from "./hooks/useStoredState";
import type { MessageFormat, Mode, PlatformSettings } from "./types";

const MODE_OPTIONS = {
  ui: {
    title: "UI-only",
    summary:
      "Recommended. No credentials. We parse the DOM of the current page to assemble PR stats.",
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
  devin: false,
  graphite: false,
};

function App() {
  const [mode, setMode] = useStoredState<Mode>("octocopy-mode", "ui");
  const [messageFormat, setMessageFormat] = useStoredState<MessageFormat>(
    "octocopy-message-format",
    "default"
  );
  const [platforms, setPlatforms] = useStoredState(
    "octocopy-platforms",
    defaultPlatforms
  );
  const [tokenValue, setTokenValue] = useStoredState("octocopy-token", "");

  useEffect(() => {
    if (!platforms.github && !platforms.devin && !platforms.graphite) {
      setPlatforms(defaultPlatforms);
    }
  }, [platforms, setPlatforms]);

  const handlePlatformToggle = (name: "github" | "devin" | "graphite") => {
    setPlatforms((prev) => {
      const nextValue = !prev[name];
      if (!nextValue) {
        const enabledCount = Object.values(prev).filter(Boolean).length;
        if (enabledCount === 1) {
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <header className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Octocopy Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure how Octocopy fetches pull request stats and formats copied
            output.
          </p>
        </header>

        <ModeSection mode={mode} options={MODE_OPTIONS} onChange={setMode} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CredentialsSection
            mode={mode}
            tokenValue={tokenValue}
            onTokenChange={handleTokenChange}
          />

          <MessageFormatSection
            format={messageFormat}
            onChange={setMessageFormat}
          />
        </div>

        <PlatformsSection
          platforms={platforms}
          onToggle={handlePlatformToggle}
        />
      </main>
    </div>
  );
}

export default App;

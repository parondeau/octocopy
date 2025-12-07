import type { PlatformSettings } from "../types";
import { sectionCardClass } from "./ui";

type Props = {
  platforms: PlatformSettings;
  onToggle: (name: "github" | "graphite") => void;
};

export function PlatformsSection({
  platforms,
  onToggle,
}: Props) {
  const isGithubLocked = platforms.github && !platforms.graphite;
  const isGraphiteLocked = platforms.graphite && !platforms.github;

  return (
    <section className={sectionCardClass}>
      <h2 className="text-base font-semibold text-slate-900">
        Platforms
      </h2>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            checked={platforms.github}
            disabled={isGithubLocked}
            onChange={() => onToggle("github")}
            />
          <span>Include GitHub link</span>
        </label>
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            checked={platforms.graphite}
            disabled={isGraphiteLocked}
            onChange={() => onToggle("graphite")}
          />
          <span>Include Graphite link</span>
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Toggles only affect the extension popup. We will sync with the
        background script in a follow-up.
      </p>
    </section>
  );
}

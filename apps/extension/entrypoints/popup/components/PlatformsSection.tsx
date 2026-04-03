import type { PlatformSettings } from "../types";
import { sectionCardClass } from "./ui";

type Props = {
  platforms: PlatformSettings;
  onToggle: (name: "github" | "devin" | "graphite") => void;
};

export function PlatformsSection({ platforms, onToggle }: Props) {
  const enabledCount = Object.values(platforms).filter(Boolean).length;
  const isGithubLocked = platforms.github && enabledCount === 1;
  const isDevinLocked = platforms.devin && enabledCount === 1;
  const isGraphiteLocked = platforms.graphite && enabledCount === 1;

  return (
    <section className={sectionCardClass}>
      <h2 className="text-base font-semibold text-slate-900">Platforms</h2>
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
            checked={platforms.devin}
            disabled={isDevinLocked}
            onChange={() => onToggle("devin")}
          />
          <span>Include Devin link</span>
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
    </section>
  );
}

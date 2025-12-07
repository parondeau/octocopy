import type { Format, PlatformSettings } from "../types";
import { sectionCardClass } from "./ui";

type Props = {
  platforms: PlatformSettings;
  formatLabels: Record<Format, string>;
  onToggle: (name: "github" | "graphite") => void;
  onFormatChange: (format: Format) => void;
};

export function PlatformsSection({
  platforms,
  formatLabels,
  onToggle,
  onFormatChange,
}: Props) {
  return (
    <section className={sectionCardClass}>
      <h2 className="text-base font-semibold text-slate-900">
        Platforms &amp; format
      </h2>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-indigo-600"
            checked={platforms.github}
            onChange={() => onToggle("github")}
          />
          <span>Include GitHub link</span>
        </label>
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-indigo-600"
            checked={platforms.graphite}
            onChange={() => onToggle("graphite")}
          />
          <span>Include Graphite link</span>
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
        <span>Copy format</span>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          value={platforms.format}
          onChange={(event) => onFormatChange(event.target.value as Format)}
        >
          {(Object.keys(formatLabels) as Format[]).map((format) => (
            <option key={format} value={format}>
              {formatLabels[format]}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-slate-500">
        Toggles only affect the extension popup. We will sync with the
        background script in a follow-up.
      </p>
    </section>
  );
}

import { useState } from "react";
import type { Mode } from "../types";
import { cx, listCardClass, sectionCardClass } from "./ui";

type ModeOption = {
  title: string;
  summary: string;
  highlights: string[];
};

type Props = {
  mode: Mode;
  options: Record<Mode, ModeOption>;
  onChange: (mode: Mode) => void;
};

export function ModeSection({ mode, options, onChange }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const activeOption = options[mode];
  const accordionContentId = "mode-section-options";

  return (
    <section className={sectionCardClass}>
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-expanded={!isCollapsed}
        aria-controls={accordionContentId}
        className="flex w-full items-center justify-between gap-2 text-left cursor-pointer"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">Mode</h2>
          <p className="text-sm text-slate-500">
            {activeOption
              ? `${activeOption.title} • ${activeOption.summary}`
              : "Choose how Octocopy fetches PR stats"}
          </p>
        </div>
        <svg
          className={cx(
            "h-4 w-4 text-slate-500 transition-transform",
            !isCollapsed && "rotate-180"
          )}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 8l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        id={accordionContentId}
        className={cx("mt-3 flex flex-col gap-3", isCollapsed && "hidden")}
      >
        {(Object.keys(options) as Mode[]).map((option) => {
          const optionData = options[option];
          const isActive = mode === option;
          return (
            <button
              key={option}
              className={cx(
                "w-full flex-col text-left cursor-pointer",
                listCardClass,
                "gap-2 px-4 py-3",
                isActive
                  ? "border-indigo-400 bg-indigo-50 shadow-inner"
                  : "hover:border-indigo-200 hover:bg-indigo-50"
              )}
              onClick={() => onChange(option)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-base font-semibold text-slate-900">
                    {optionData.title}
                  </span>
                  <p className="text-sm text-slate-500">{optionData.summary}</p>
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
  );
}

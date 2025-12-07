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
  return (
    <section className={sectionCardClass}>
      <h2 className="text-base font-semibold text-slate-900">Mode</h2>
      <div className="flex flex-col gap-3">
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

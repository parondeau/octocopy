import type { MessageFormat } from "../types";
import { cx, listCardClass, sectionCardClass } from "./ui";

type Option = {
  id: MessageFormat;
  label: string;
  description: string;
  example: string;
};

const OPTIONS: Option[] = [
  {
    id: "default",
    label: "Default",
    description: "Repo + PR number first, links appended.",
    example:
      "[octo/repo#381]: Add format picker (+12/-3) [github](https://github.com/octo/repo/pull/381)",
  },
  {
    id: "linked-title",
    label: "Linked title",
    description: "PR title links to the primary PR page.",
    example:
      "[Add format picker](https://github.com/octo/repo/pull/381) (octo/repo +12/-3)",
  },
];

type Props = {
  format: MessageFormat;
  onChange: (format: MessageFormat) => void;
};

export function MessageFormatSection({ format, onChange }: Props) {
  return (
    <section className={sectionCardClass}>
      <h2 className="text-base font-semibold text-slate-900">Message format</h2>
      <div className="flex flex-col gap-3">
        {OPTIONS.map((option) => {
          const isSelected = option.id === format;
          return (
            <label
              key={option.id}
              className={cx(
                listCardClass,
                "cursor-pointer flex-col gap-1",
                isSelected && "border-indigo-200 bg-indigo-50"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="message-format"
                  className="h-4 w-4 accent-indigo-600"
                  checked={isSelected}
                  onChange={() => onChange(option.id)}
                />
                <span className="text-sm font-medium text-slate-800">
                  {option.label}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {option.description}
              </span>
              <code className="text-xs font-mono text-slate-600 break-words">
                {option.example}
              </code>
            </label>
          );
        })}
      </div>
    </section>
  );
}

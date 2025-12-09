import { sectionCardClass } from "./ui";

type Props = {
  includeBranchName: boolean;
  onToggle: (value: boolean) => void;
};

export function MessageSection({ includeBranchName, onToggle }: Props) {
  return (
    <section className={sectionCardClass}>
      <h2 className="text-base font-semibold text-slate-900">Message format</h2>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-indigo-600"
          checked={includeBranchName}
          onChange={(event) => onToggle(event.target.checked)}
        />
        <span>
          <span className="font-medium text-slate-900">
            Include branch name
          </span>
          <p className="text-xs font-normal text-slate-500">
            Adds <code>[branch]</code> after the PR slug when copying the
            message.
          </p>
        </span>
      </label>
    </section>
  );
}

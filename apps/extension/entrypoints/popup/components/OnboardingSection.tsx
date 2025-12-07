import type { OnboardingStep } from '../types';
import { cx, listCardClass, sectionCardClass } from './ui';

type Props = {
  steps: OnboardingStep[];
  state: Record<string, boolean>;
  completionCount: number;
  onToggle: (id: string) => void;
};

export function OnboardingSection({
  steps,
  state,
  completionCount,
  onToggle,
}: Props) {
  return (
    <section className={sectionCardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Onboarding checklist
          </h2>
          <p className="text-sm text-slate-500">
            {completionCount}/{steps.length} steps completed
          </p>
        </div>
        <a
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          href="https://octocopy.app/docs"
          target="_blank"
          rel="noreferrer"
        >
          View docs
        </a>
      </div>
      <ul className="space-y-3">
        {steps.map((step) => (
          <li key={step.id}>
            <label className={cx(listCardClass, 'cursor-pointer')}>
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-indigo-600"
                checked={Boolean(state[step.id])}
                onChange={() => onToggle(step.id)}
              />
              <div className="space-y-1 text-sm text-slate-600">
                <span className="block text-base font-semibold text-slate-900">
                  {step.label}
                </span>
                <p className="text-sm text-slate-500">{step.description}</p>
                {step.actionLabel && step.actionHref && (
                  <a
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    href={step.actionHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {step.actionLabel}
                  </a>
                )}
              </div>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const sectionCardClass =
  'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm';

export const listCardClass =
  'flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left';

export const buttonBase =
  'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500';

export const secondaryButton = `${buttonBase} border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100`;

export const statusTone: Record<string, string> = {
  connected: 'bg-emerald-100 text-emerald-700',
  valid: 'bg-emerald-100 text-emerald-700',
  disconnected: 'bg-rose-100 text-rose-700',
  invalid: 'bg-rose-100 text-rose-700',
  checking: 'bg-indigo-100 text-indigo-700',
  validating: 'bg-indigo-100 text-indigo-700',
  idle: 'bg-slate-100 text-slate-600',
  neutral: 'bg-slate-100 text-slate-600',
};

export function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

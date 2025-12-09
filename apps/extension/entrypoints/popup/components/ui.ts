export const sectionCardClass =
  'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm';

export const listCardClass =
  'flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left';

export function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

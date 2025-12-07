import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/personal-access-token')({
  component: PersonalAccessTokenDoc,
})

function PersonalAccessTokenDoc() {
  const steps = [
    'Visit github.com/settings/personal-access-tokens and choose “Fine-grained” token.',
    'Give the token a recognizable name such as “Octocopy (laptop)” and set an expiration (30 days keeps risks low).',
    'Scope the token to the organization or repositories Octocopy should copy from. Select “Repository access → Only selected repositories” whenever possible.',
    'When you reach “Repository permissions”, enable only the options listed below so the PAT stays least-privilege.',
    'Create the token and copy it once. Store it in your secret manager and paste it into the Octocopy client when prompted.',
  ]

  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/70">
          Personal Access Token
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Create a PAT for Octocopy
        </h1>
        <p className="text-sm text-slate-300 sm:text-base">
          PATs are ideal for quick trials or when you cannot install the full
          Octocopy GitHub App. Follow these steps to generate a least-privilege
          token that still lets Octocopy orchestrate copy jobs.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <ol className="space-y-4 text-slate-200">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/60 text-sm font-semibold text-cyan-200">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed sm:text-base">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Permissions required</h2>
        <p className="mt-2 text-sm text-slate-300">
          Octocopy needs read access so it can inspect repositories and summarize copy work. Keep
          everything else disabled.
        </p>
        <ul className="mt-4 space-y-3 text-sm text-slate-200">
          <li className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">
            <span className="font-semibold text-white">Contents</span>
            <span className="text-cyan-200">Read only</span>
          </li>
          <li className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">
            <span className="font-semibold text-white">Pull requests</span>
            <span className="text-cyan-200">Read only</span>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100">
        <h2 className="text-lg font-semibold">Security notes</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-50/80 sm:text-base">
          <li>Rotate tokens as part of your onboarding/offboarding checklist.</li>
          <li>Store the PAT in 1Password, Secrets Manager, or another encrypted vault.</li>
          <li>Prefer the Octocopy GitHub App for automation; tokens are best for single operators.</li>
        </ul>
      </section>
    </article>
  )
}

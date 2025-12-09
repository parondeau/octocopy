import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/install-github-app')({
  component: InstallGithubAppDoc,
})

function InstallGithubAppDoc() {
  const steps = [
    'Open the Octocopy GitHub App page and click “Install”. If you are already signed in, GitHub will ask whether to continue with your user account or switch to an organization.',
    'Pick the organization or user account that should authorize Octocopy. You will need admin permissions for that account.',
    'Choose which repositories Octocopy may access. Select “Only select repositories” to keep the app scoped to the repos you intend to copy.',
    'Review the permissions summary and confirm the installation. GitHub will provision an installation ID that Octocopy uses to request short-lived tokens.',
  ]

  const accessTips = [
    'Create a dedicated “template” repository that Octocopy can read from if you do not want to expose production repos.',
    'Grant access to both the source and destination repositories when Octocopy needs to copy labels, milestones, or issues between them.',
  ]

  const postInstall = [
    'Share the installation ID with teammates running the Octocopy CLI or extension (you can find it at Settings → GitHub Apps → Octocopy → About).',
    'Rotate access periodically or uninstall the app when the project wraps up; you can always reinstall later.',
  ]

  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/70">
          GitHub App
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Install the Octocopy GitHub App
        </h1>
        <p className="text-sm text-slate-300 sm:text-base">
          Installing the GitHub App is the fastest way to let Octocopy issue its
          own tokens. Follow these steps if you administer an organization or
          need the app on a personal account.
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

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-slate-200">
        <h2 className="text-lg font-semibold text-white">
          Repository access tips
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm sm:text-base">
          {accessTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-50">
        <h2 className="text-lg font-semibold">After installation</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm sm:text-base">
          {postInstall.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </article>
  )
}

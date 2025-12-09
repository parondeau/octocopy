import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/ui-mode')({
  component: UiModeDoc,
})

function UiModeDoc() {
  const quickSteps = [
    'Open the Octocopy popup from any GitHub or Graphite pull request and leave the mode toggle on “UI-only” (it is selected by default).',
    'Confirm the popup lists the detected site and that at least one platform toggle (GitHub or Graphite) stays enabled.',
    'Click the injected “Copy PR” button on the pull request page. Octocopy will parse the DOM, build the summary, and push it directly to your clipboard.',
  ]

  const visibleData = [
    'Pull request title text, trimmed so Graphite’s “#123” prefix or trailing breadcrumbs do not leak into the payload.',
    'Addition and deletion counts taken from the diffstat badge. When the stats are collapsed, expand them so the numbers are visible.',
    'The canonical GitHub URL composed from the owner, repo, and number detected in the page URL—even when you are browsing via Graphite.',
  ]

  const bestFits = [
    'Security-conscious orgs that do not grant PATs or GitHub App installs but still allow read access to PR pages.',
    'Quick copy jobs on public repositories where the DOM already exposes everything you need.',
  ]

  const limitations = [
    'Only data rendered in the UI is available—no hidden reviewers, labels, or files outside the visible diff summary.',
    'Custom themes or heavily modified layouts can move the selectors Octocopy targets. When that happens the extension surfaces a prompt to refresh the page or switch modes.',
    'Changes to GitHub frontend can break Octocopy’s parsers until we issue an update.',
  ]

  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/70">
          UI-only Mode
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Keep Octocopy local with UI-only mode
        </h1>
        <p className="text-sm text-slate-300 sm:text-base">
          UI-only mode skips tokens entirely. The extension scrapes the current
          PR page for its title and diff stats, assembles the standard Octocopy
          snippet, and writes it to your clipboard without contacting the
          Octocopy backend.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Use it in seconds</h2>
        <ol className="mt-4 space-y-4 text-slate-200">
          {quickSteps.map((step, index) => (
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
          What Octocopy reads
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Everything stays within the browser tab. Octocopy only inspects the
          DOM nodes that GitHub or Graphite already rendered.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm sm:text-base">
          {visibleData.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-50">
        <h2 className="text-lg font-semibold">Best for</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm sm:text-base">
          {bestFits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-emerald-50/80">
          The popup shows a “Detected site” badge so you always know which host
          UI-only mode is targeting, and it prevents disabling both GitHub and
          Graphite toggles at the same time.
        </p>
      </section>

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-50">
        <h2 className="text-lg font-semibold">Know the limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm sm:text-base">
          {limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-amber-50/80">
          Need richer metadata, private repo access, or guaranteed parsing?
          Switch to the{' '}
          <Link
            to="/docs/personal-access-token"
            className="text-cyan-200 underline decoration-dotted hover:text-cyan-50"
          >
            Personal Access Token
          </Link>{' '}
          or{' '}
          <Link
            to="/docs/install-github-app"
            className="text-cyan-200 underline decoration-dotted hover:text-cyan-50"
          >
            GitHub App
          </Link>{' '}
          guides when your security team allows it.
        </p>
      </section>
    </article>
  )
}

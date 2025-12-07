import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  const highlights = [
    {
      title: 'Secure GitHub Auth',
      description:
        'Use GitHub Apps or PATs to mint scoped tokens without exposing long-lived credentials.',
    },
    {
      title: 'Copy Operations',
      description:
        'Mirror repositories, labels, milestones, and other project data with a single command.',
    },
    {
      title: 'Workflow Ready',
      description:
        'Bring Octocopy into onboarding or migration playbooks and keep every team in sync.',
    },
  ]

  return (
    <section className="flex flex-col gap-12">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-10 shadow-2xl shadow-cyan-900/20">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/60">
          Octocopy
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
          A focused toolkit for copying GitHub resources with confidence.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          Whether you are spinning up sandboxes, cloning organization defaults,
          or migrating repositories, Octocopy gives you curated commands and
          safeguards so every copy stays fast, traceable, and compliant.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/docs/personal-access-token"
            className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Read the token guide
          </Link>
          <Link
            to="/docs"
            className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-400 hover:text-cyan-200"
          >
            Browse docs
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {highlights.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
          >
            <h2 className="text-lg font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

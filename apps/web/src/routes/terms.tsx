import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/terms')({ component: TermsPage })

function TermsPage() {
  const commitments = [
    {
      title: 'Acceptable use',
      body: 'Use Octocopy for lawful operations on repositories you are authorized to access. We may suspend accounts that abuse the service or bypass security measures.',
    },
    {
      title: 'Service changes',
      body: 'Features evolve frequently. We will announce impactful changes ahead of time and document migration paths when APIs or workflows are deprecated.',
    },
    {
      title: 'Liability',
      body: 'Octocopy is provided “as is.” You are responsible for reviewing copy operations before running them in production environments.',
    },
  ]

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/60">
          Terms of Service
        </p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Guidelines for using Octocopy
        </h1>
        <p className="text-base text-slate-300">
          These terms summarize the expectations we have for customers who rely
          on Octocopy for repository migrations and automation.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {commitments.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
          >
            <h2 className="text-lg font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{item.body}</p>
          </article>
        ))}
      </div>

      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold text-white">Support</h2>
        <p className="mt-2 text-sm text-slate-300">
          Need a tailored agreement? Reach us at{' '}
          <a className="text-cyan-300" href="mailto:hello@octocopy.app">
            hello@octocopy.app
          </a>{' '}
          and we will coordinate a review.
        </p>
      </article>
    </section>
  )
}

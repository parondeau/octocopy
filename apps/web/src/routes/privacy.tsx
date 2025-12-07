import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicyPage,
})

function PrivacyPolicyPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/60">
          Privacy Policy
        </p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          How Octocopy handles data
        </h1>
        <p className="text-base text-slate-300">
          Octocopy is designed to minimize the information it collects. We only
          gather what we need to run the service and keep it secure.
        </p>
      </header>

      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold text-white">
          Information we process
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          We store authentication tokens and account context. Repository or pull
          request contents are cached temporarily in-memory while actions run
          and are never logged to disk.
        </p>
      </article>

      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold text-white">
          Sharing and retention
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Octocopy does not sell customer data. Access credentials stay
          encrypted and are deleted on request. Operational metrics are
          aggregated and anonymous so we can monitor reliability without
          profiling individual users.
        </p>
      </article>

      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold text-white">Contact</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Questions or deletion requests? Email{' '}
          <a className="text-cyan-300" href="mailto:hello@octocopy.app">
            hello@octocopy.app
          </a>
          and we will reply within two business days.
        </p>
      </article>
    </section>
  )
}

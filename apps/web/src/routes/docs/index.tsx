import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

function DocsIndex() {
  const docs = [
    {
      title: 'Install the GitHub App',
      description:
        'Authorize the Octocopy GitHub App for your org or user account and choose which repositories it can manage.',
      href: '/docs/install-github-app',
    },
    {
      title: 'Personal Access Token',
      description:
        'Generate a fine-grained PAT for Octocopy and scope it for repository copy workflows.',
      href: '/docs/personal-access-token',
    },
    {
      title: 'UI-only Mode',
      description:
        'Keep the extension fully local by letting it read PR titles and diff stats straight from the page.',
      href: '/docs/ui-mode',
    },
  ]

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/70">
          Docs
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Octocopy guides
        </h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          Each note keeps the focus on one task so you can reference it quickly
          while working in GitHub.
        </p>
      </div>

      <div className="space-y-4">
        {docs.map((doc) => (
          <Link
            key={doc.href}
            to={doc.href}
            className="block rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-cyan-400/70 hover:text-white"
          >
            <h2 className="text-xl font-semibold">{doc.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{doc.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

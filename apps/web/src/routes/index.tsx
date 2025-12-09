import { Link, createFileRoute } from '@tanstack/react-router'
import demoVideo from './demo.mp4'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  const highlights = [
    {
      title: 'Secure GitHub Auth',
      description:
        'Use GitHub Apps or PATs to mint scoped tokens without exposing long-lived credentials.',
    },
    {
      title: 'Local-only Mode',
      description:
        'Intelligently scrape the DOM to gather PR metadata without leaving your browser session.',
    },
    {
      title: 'Fully Open Source',
      description:
        'Audit the codebase, run it locally, and tailor it to your team without closed-box surprises.',
    },
  ]

  return (
    <section className="flex flex-col gap-12">
      <div className="rounded-3xl border border-slate-800 bg-linear-to-br from-slate-900 to-slate-950 p-10 shadow-2xl shadow-cyan-900/20">
        <p className="text-lg uppercase tracking-[0.35em] text-cyan-300/60">
          Octocopy
        </p>
        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          A simple way to copy GitHub PR messages with helpful metadata.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/docs"
            className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        <video
          className="w-full rounded-lg"
          src={demoVideo}
          autoPlay
          loop
          muted
          playsInline
          controls
        />
      </div>
    </section>
  )
}

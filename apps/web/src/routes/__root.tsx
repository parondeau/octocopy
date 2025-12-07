import { HeadContent, Link, Scripts, createRootRouteWithContext } from '@tanstack/react-router'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

export interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Octocopy',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased">
        <SiteHeader />
        <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12">
          {children}
        </main>
        <Scripts />
      </body>
    </html>
  )
}

function SiteHeader() {
  return (
    <header className="border-b border-slate-900/70 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight text-white hover:text-cyan-300"
        >
          Octocopy
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            to="/docs"
            className="text-slate-300 transition-colors hover:text-white"
            activeProps={{
              className: 'text-white underline underline-offset-4',
            }}
          >
            Docs
          </Link>
        </nav>
      </div>
    </header>
  )
}

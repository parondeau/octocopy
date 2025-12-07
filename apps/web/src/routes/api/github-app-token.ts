import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type,x-octocopy-key',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Max-Age': '600',
}

const requiredEnv = {
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
}

const extensionKey = process.env.OCTOCOPY_EXTENSION_API_KEY

type TokenResponse =
  | { token: string; expiresAt?: string; installationId: number }
  | { error: string }

type Body = {
  owner?: string
  repo?: string
}

export const Route = createFileRoute('/api/github-app-token')({
  server: {
    handlers: {
      OPTIONS: () =>
        new Response(null, {
          status: 204,
          headers: corsHeaders,
        }),
      POST: async ({ request }) => {
        console.log('Received request for GitHub App token')
        const missing = Object.entries(requiredEnv)
          .filter(([, value]) => !value)
          .map(([key]) => key)

        if (missing.length) {
          return json(
            { error: `Server missing configuration: ${missing.join(', ')}` },
            {
              status: 500,
              headers: corsHeaders,
            },
          )
        }

        if (
          extensionKey &&
          request.headers.get('x-octocopy-key') !== extensionKey
        ) {
          return json(
            { error: 'Unauthorized' },
            {
              status: 401,
              headers: corsHeaders,
            },
          )
        }

        const body = (await safeJson<Body>(request)) ?? {}

        if (!body.owner || !body.repo) {
          return json(
            {
              error: 'Missing owner/repo.',
            } satisfies TokenResponse,
            { status: 400, headers: corsHeaders },
          )
        }

        try {
          const auth = createAppAuth({
            appId: requiredEnv.appId!,
            privateKey: normalizePrivateKey(requiredEnv.privateKey!),
          })

          const installationId = await findInstallationId(
            auth,
            body.owner,
            body.repo,
          )

          if (!installationId) {
            return json(
              {
                error: 'No installation found for repository.',
              } satisfies TokenResponse,
              { status: 404, headers: corsHeaders },
            )
          }

          const { token, expiresAt } = await auth({
            type: 'installation',
            installationId,
          })

          return json(
            { token, expiresAt, installationId } satisfies TokenResponse,
            {
              status: 200,
              headers: corsHeaders,
            },
          )
        } catch (error) {
          console.error('Failed to mint GitHub App token', error)
          return json(
            { error: 'Failed to mint token' } satisfies TokenResponse,
            {
              status: 500,
              headers: corsHeaders,
            },
          )
        }
      },
    },
  },
})

function normalizePrivateKey(raw: string) {
  return raw.replace(/\\n/g, '\n')
}

async function findInstallationId(
  auth: ReturnType<typeof createAppAuth>,
  owner: string,
  repo: string,
) {
  const appAuth = await auth({ type: 'app' })
  const octokit = new Octokit({
    auth: appAuth.token,
    userAgent: 'Octocopy-App',
  })

  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/installation',
    { owner, repo },
  )

  return response.data.id
}

async function safeJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

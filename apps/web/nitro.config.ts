import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  // Emit Vercel build output API format so deployment works without extra adapters
  preset: 'vercel',
})

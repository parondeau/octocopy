import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Octocopy',
    description: 'Copy GitHub PR details into your clipboard.',
    permissions: ['clipboardWrite'],
    host_permissions: [
      'https://github.com/*',
      'https://api.github.com/*',
      'http://localhost:3000/*',
    ],
  },
});

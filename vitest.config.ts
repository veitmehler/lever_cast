import { defineConfig } from 'vitest/config'

// Root orchestrator: runs each app's test project.
// Per-app configs live in apps/*/vitest.config.ts.
export default defineConfig({
  test: {
    projects: [
      'packages/shared/vitest.config.ts',
      'apps/api/vitest.config.ts',
      'apps/web/vitest.config.ts',
    ],
  },
})

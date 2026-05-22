import { defineConfig, devices } from '@playwright/test'

// Port can be overridden via PLAYWRIGHT_DEV_PORT for parallel worktrees that
// can't all bind 5175 (see CLAUDE.md "Parallel sessions: use git worktrees").
const DEV_PORT = parseInt(process.env.PLAYWRIGHT_DEV_PORT ?? '5175', 10)
const BASE_URL = `http://localhost:${DEV_PORT}`

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
    baseURL: BASE_URL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${DEV_PORT} --strictPort`,
    port: DEV_PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})

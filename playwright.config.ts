// SPDX-License-Identifier: GPL-3.0-only
import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  // Exclude one-off debug/inspection scripts — not real CI tests
  testIgnore: [
    // One-off debug/inspection scripts — not real CI tests
    '**/debug-*.spec.ts',
    '**/inspect-*.spec.ts',
    '**/tls-raw-config-debug.spec.ts',
    // External-service tests — hit live prod or government sites; not testing local build
    // Run manually via: npx playwright test e2e/production.spec.ts e2e/compliance-sources.spec.ts
    '**/production.spec.ts',
    '**/compliance-sources.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  // Increase test timeout for WASM operations
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    // Suppress the WhatsNew toast for all E2E tests by pre-seeding a high version
    storageState: 'e2e/fixtures/suppress-whats-new.json',
  },
  // Default timeout for expect assertions - increased for WASM operations
  expect: {
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    // In CI the build is already done — use the fast preview server (static dist/).
    // Locally, reuse the dev server if already running.
    command: isCI ? 'npm run preview -- --port 5175' : 'npm run dev -- --port 5175',
    url: 'http://localhost:5175',
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
})

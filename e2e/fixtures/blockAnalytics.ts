// SPDX-License-Identifier: GPL-3.0-only
import { test as base, expect, type BrowserContext } from '@playwright/test'
import { BLOCKED_ANALYTICS_HOSTS, isBlockedAnalyticsUrl } from './analyticsHosts'

/**
 * Context-level analytics block that works in EVERY Playwright browser engine.
 *
 * Why this exists: the Chromium `--host-resolver-rules` launch flag in
 * playwright.config.ts is ignored by WebKit, so the `mobile-smoke` project
 * (`devices['iPhone 14']`, WebKit) could still send Google Analytics beacons
 * when the build has VITE_GA_MEASUREMENT_ID set. `context.route` is engine
 * independent: the matching request is aborted inside Playwright and never
 * leaves the browser.
 *
 * Usage: import `test` / `expect` from './fixtures/blockAnalytics' instead of
 * '@playwright/test'. The `analyticsBlock` fixture is `auto`, so it runs for
 * every test without being requested and is installed on the context before
 * `page` is created, i.e. before any navigation.
 *
 * Limitation: `context.route` does not see requests issued from inside a
 * Service Worker. The app's PWA worker does not call analytics hosts (the
 * script is loaded by the page), and Chromium projects also have the resolver
 * flag as a second layer.
 */
export async function installAnalyticsBlock(
  context: BrowserContext,
  hosts: readonly string[] = BLOCKED_ANALYTICS_HOSTS
): Promise<void> {
  await context.route(
    (url) => isBlockedAnalyticsUrl(url.href, hosts),
    (route) => route.abort('blockedbyclient')
  )
}

type AnalyticsBlockFixtures = {
  /** Hosts to block. Override with `test.use({ analyticsBlockedHosts })` (tests of the block itself only). */
  analyticsBlockedHosts: readonly string[]
  analyticsBlock: void
}

export const test = base.extend<AnalyticsBlockFixtures>({
  analyticsBlockedHosts: [BLOCKED_ANALYTICS_HOSTS, { option: true }],
  analyticsBlock: [
    async ({ context, analyticsBlockedHosts }, use) => {
      await installAnalyticsBlock(context, analyticsBlockedHosts)
      await use()
    },
    { auto: true },
  ],
})

export { expect }

// SPDX-License-Identifier: GPL-3.0-only
/**
 * Chromium launch args for build/audit scripts that open app pages through the
 * `playwright` package directly (prerender, role-board audit, mobile-UX DOM
 * golden). They target localhost, but a build that carries
 * `VITE_GA_MEASUREMENT_ID` would otherwise let the page beacon to Google
 * Analytics. The flag makes every host in BLOCKED_ANALYTICS_HOSTS unresolvable
 * in the browser, the same rule the Playwright test projects use
 * (see playwright.config.ts and e2e/fixtures/analyticsHosts.ts).
 *
 * Imports ONLY the pure analyticsHosts module (no @playwright/test) so it is
 * safe inside `npm run build` (prerender runs via tsx).
 */
import { chromiumHostResolverRules } from '../../e2e/fixtures/analyticsHosts'

/** `--host-resolver-rules=...` flag blocking the analytics hosts. */
export function analyticsBlockArg(): string {
  return `--host-resolver-rules=${chromiumHostResolverRules()}`
}

/** Launch args = the analytics block plus any caller-specific args (never clobbered). */
export function chromiumLaunchArgs(extra: readonly string[] = []): string[] {
  return [analyticsBlockArg(), ...extra]
}

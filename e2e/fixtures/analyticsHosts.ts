// SPDX-License-Identifier: GPL-3.0-only
/**
 * Single source of truth for the analytics hosts automated browsers must never
 * contact. Pure module: no Playwright import, so `playwright.config.ts` (which
 * cannot register routes) and the vitest unit test can both load it cheaply.
 *
 * Two enforcement layers consume this list:
 *   - Chromium projects: `--host-resolver-rules=MAP <host> ~NOTFOUND`
 *     (built in playwright.config.ts). Chromium-only launch flag.
 *   - Every browser engine, WebKit included: the context-level route installed
 *     by `e2e/fixtures/blockAnalytics.ts` (`isBlockedAnalyticsUrl` below).
 */
export const BLOCKED_ANALYTICS_HOSTS: readonly string[] = [
  'www.google-analytics.com',
  'ssl.google-analytics.com',
  'region1.google-analytics.com',
  'analytics.google.com',
  'www.googletagmanager.com',
]

/**
 * True when `url` targets one of `hosts` (default: BLOCKED_ANALYTICS_HOSTS).
 *
 * Match is on the parsed hostname only, never on the raw string, and is exact
 * or a true subdomain (`x.www.google-analytics.com`). Consequently these do NOT
 * match: lookalikes such as `notgoogle-analytics.com`, a blocked host used as a
 * registrable-domain suffix of someone else's domain
 * (`www.google-analytics.com.evil.test`), a blocked host appearing only in the
 * path/query/userinfo, and the bare apex `google-analytics.com` (not in the
 * list; the Chromium resolver rule is exact-host as well, so both layers agree).
 * Unparseable URLs return false (nothing to block; Playwright only hands us
 * absolute request URLs anyway).
 */
export function isBlockedAnalyticsUrl(
  url: string,
  hosts: readonly string[] = BLOCKED_ANALYTICS_HOSTS
): boolean {
  let hostname: string
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    return false
  }
  // `host.` (FQDN trailing dot) resolves to the same host.
  if (hostname.endsWith('.')) hostname = hostname.slice(0, -1)
  return hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`))
}

/** Chromium `--host-resolver-rules` value that makes each host unresolvable. */
export function chromiumHostResolverRules(hosts: readonly string[] = BLOCKED_ANALYTICS_HOSTS) {
  return hosts.map((h) => `MAP ${h} ~NOTFOUND`).join(', ')
}

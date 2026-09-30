// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  BLOCKED_ANALYTICS_HOSTS,
  chromiumHostResolverRules,
  isBlockedAnalyticsUrl,
} from '../../e2e/fixtures/analyticsHosts'

// Pure string/URL predicate tests: no browser and NO network access. The
// predicate is what the WebKit-capable context route in
// e2e/fixtures/blockAnalytics.ts uses to abort analytics beacons.
describe('isBlockedAnalyticsUrl', () => {
  it('lists exactly the five analytics hosts the Chromium flag blocks', () => {
    expect([...BLOCKED_ANALYTICS_HOSTS]).toEqual([
      'www.google-analytics.com',
      'ssl.google-analytics.com',
      'region1.google-analytics.com',
      'analytics.google.com',
      'www.googletagmanager.com',
    ])
  })

  it.each(BLOCKED_ANALYTICS_HOSTS)('matches %s (https, path, query)', (host) => {
    expect(isBlockedAnalyticsUrl(`https://${host}/g/collect?v=2&tid=G-XXXX`)).toBe(true)
    expect(isBlockedAnalyticsUrl(`http://${host}/gtag/js?id=G-XXXX`)).toBe(true)
    expect(isBlockedAnalyticsUrl(`https://${host}`)).toBe(true)
    expect(isBlockedAnalyticsUrl(`wss://${host}:8443/x`)).toBe(true)
  })

  it('matches true subdomains, case-insensitively, and a trailing-dot FQDN', () => {
    expect(isBlockedAnalyticsUrl('https://a.b.region1.google-analytics.com/g/collect')).toBe(true)
    expect(isBlockedAnalyticsUrl('https://WWW.Google-Analytics.COM/collect')).toBe(true)
    expect(isBlockedAnalyticsUrl('https://www.googletagmanager.com./gtm.js')).toBe(true)
  })

  it.each([
    'https://www.pqctoday.com/',
    'https://pqctoday.com/?ref=www.google-analytics.com',
    'https://pqctoday.com/www.googletagmanager.com/gtm.js',
    'http://localhost:4173/playground',
    'http://127.0.0.1:4173/',
    'https://notgoogle-analytics.com/collect',
    'https://notwww.google-analytics.com/collect',
    'https://www.google-analytics.com.evil.test/collect', // someone else's domain
    'https://analytics.google.com.evil.test/',
    'https://evil.test/@www.google-analytics.com/',
    'https://www.google-analytics.com@evil.test/', // userinfo trick: real host is evil.test
    'https://google-analytics.com/collect', // bare apex is not in the list (same as the Chromium rule)
    'https://www.google.com/',
    'https://fonts.googleapis.com/css',
    'https://analytics.example.com/',
  ])('does not match %s', (url) => {
    expect(isBlockedAnalyticsUrl(url)).toBe(false)
  })

  it('returns false for unparseable input instead of throwing', () => {
    expect(isBlockedAnalyticsUrl('')).toBe(false)
    expect(isBlockedAnalyticsUrl('not a url')).toBe(false)
    expect(isBlockedAnalyticsUrl('www.google-analytics.com/collect')).toBe(false) // no scheme
  })

  it('honours a custom host list (used by the fake-host integration check)', () => {
    const hosts = [...BLOCKED_ANALYTICS_HOSTS, 'ga-test.invalid']
    expect(isBlockedAnalyticsUrl('https://ga-test.invalid/g/collect', hosts)).toBe(true)
    expect(isBlockedAnalyticsUrl('https://ga-test.invalid/g/collect')).toBe(false)
  })
})

describe('chromiumHostResolverRules', () => {
  it('derives the Chromium flag value from the same host list', () => {
    const rules = chromiumHostResolverRules()
    expect(rules.split(', ')).toEqual(BLOCKED_ANALYTICS_HOSTS.map((h) => `MAP ${h} ~NOTFOUND`))
  })
})

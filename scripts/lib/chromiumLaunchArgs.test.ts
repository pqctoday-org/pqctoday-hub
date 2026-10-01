// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { BLOCKED_ANALYTICS_HOSTS } from '../../e2e/fixtures/analyticsHosts'
import { analyticsBlockArg, chromiumLaunchArgs } from './chromiumLaunchArgs'

// Pure string tests: no browser, no network.
describe('chromiumLaunchArgs', () => {
  it('is a single --host-resolver-rules flag mapping all five hosts to ~NOTFOUND', () => {
    const arg = analyticsBlockArg()
    expect(arg.startsWith('--host-resolver-rules=')).toBe(true)
    const rules = arg.slice('--host-resolver-rules='.length).split(', ')
    expect(BLOCKED_ANALYTICS_HOSTS).toHaveLength(5)
    expect(rules).toEqual(BLOCKED_ANALYTICS_HOSTS.map((h) => `MAP ${h} ~NOTFOUND`))
  })

  it('keeps caller args after the block (merge, not clobber)', () => {
    expect(chromiumLaunchArgs()).toEqual([analyticsBlockArg()])
    expect(chromiumLaunchArgs(['--no-sandbox'])).toEqual([analyticsBlockArg(), '--no-sandbox'])
  })
})

// Guard against a future script (or a refactor) dropping the block: each script
// that launches Chromium against app pages must pass chromiumLaunchArgs().
describe.each([
  'scripts/prerender.ts',
  'scripts/audit-role-board-content.ts',
  'scripts/mobile-ux/dom-golden.ts',
])('%s', (file) => {
  const src = readFileSync(resolve(__dirname, '../..', file), 'utf8')
  it('launches Chromium with chromiumLaunchArgs()', () => {
    const launches = src.match(/chromium\.launch\([^)]*\)/g) ?? []
    expect(launches.length).toBeGreaterThan(0)
    for (const l of launches) expect(l).toContain('args: chromiumLaunchArgs()')
  })
  it('imports the shared helper, not the Playwright-coupled fixture', () => {
    expect(src).toMatch(/from '(\.\/|\.\.\/)lib\/chromiumLaunchArgs'/)
    expect(src).not.toContain('blockAnalytics')
  })
})

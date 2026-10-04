// SPDX-License-Identifier: GPL-3.0-only
/**
 * `/playground/interactive?tab=` opens the tab it names, and the PQC Assistant
 * names these ids in its links (promptBuilder.ts reads INTERACTIVE_TAB_IDS). The
 * ids must be the tabs the lab actually has: an id with no tab would be accepted
 * and silently show nothing, and a tab missing from the list could not be linked.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_INTERACTIVE_TAB, INTERACTIVE_TAB_IDS } from './interactiveTabs'

const here = dirname(fileURLToPath(import.meta.url))
// eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed repo files
const read = (relative: string) => readFileSync(join(here, relative), 'utf-8')

describe('INTERACTIVE_TAB_IDS', () => {
  it('are the seven tabs a link can open', () => {
    expect([...INTERACTIVE_TAB_IDS]).toEqual([
      'data',
      'kem_ops',
      'sign_verify',
      'keystore',
      'logs',
      'symmetric',
      'hashing',
    ])
  })

  it('are exactly the tabs the interactive lab renders', () => {
    const rendered = [...read('../InteractivePlayground.tsx').matchAll(/id="tab-([a-z_]+)"/g)].map(
      (m) => m[1]
    )
    expect(new Set(rendered)).toEqual(new Set(INTERACTIVE_TAB_IDS))
    expect(new Set(rendered).size).toBe(rendered.length)
  })

  it('include the default tab, which the lab leaves out of the URL', () => {
    expect(INTERACTIVE_TAB_IDS).toContain(DEFAULT_INTERACTIVE_TAB)
    expect(DEFAULT_INTERACTIVE_TAB).toBe('keystore')
    expect(read('../InteractivePlayground.tsx')).toContain("activeTab !== 'keystore'")
  })

  it('are what the lab checks ?tab= against, not a second copy of the list', () => {
    const settings = read('./SettingsProvider.tsx')
    expect(settings).toContain('INTERACTIVE_TAB_IDS')
    expect(settings).not.toMatch(/const valid = \[/)
  })
})

// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

// index.html is static, so it cannot derive a count at runtime the way the
// About and Landing pages do. The one count in its JSON-LD featureList is
// guarded here instead: a new or removed module that is not reflected in
// index.html fails this test rather than drifting silently.
describe('index.html static counts', () => {
  it('"<n> Hands-on Learning Modules" matches the module catalog', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8')
    const match = html.match(/"(\d+) Hands-on Learning Modules"/)
    expect(
      match,
      'index.html featureList has no "<n> Hands-on Learning Modules" entry'
    ).not.toBeNull()
    // Excludes the synthetic 'quiz' entry — same rule the About and Landing pages use.
    const catalogCount = Object.keys(MODULE_CATALOG).filter((k) => k !== 'quiz').length
    expect(Number(match?.[1])).toBe(catalogCount)
  })
})

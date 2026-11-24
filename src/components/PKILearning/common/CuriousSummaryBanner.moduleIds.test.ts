// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { curiousSummaryModuleIds } from './CuriousSummaryBanner'

describe('curious summaries are keyed by real module ids', () => {
  it('every curious-summary.md maps to a module id (else its Visual tab is empty)', () => {
    const known = new Set(MANIFESTS.map((m) => m.id))
    const orphaned = curiousSummaryModuleIds().filter((id) => !known.has(id))
    expect(orphaned).toEqual([])
  })
})

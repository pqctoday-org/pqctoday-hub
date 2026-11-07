// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { KPI_CATALOG } from './kpiCatalog'

const hybrid = KPI_CATALOG.find((kpi) => kpi.id === 'hybrid-deployment')!

// Only these two fields are read by this specific auto-score function.
function selection(statuses: (string | undefined)[], totalProducts: number): ExecutiveModuleData {
  return {
    myProducts: statuses.map((pqcSupport, index) => ({
      softwareName: `Sample ${index}`,
      pqcSupport,
    })),
    totalProducts,
  } as unknown as ExecutiveModuleData
}

describe('selected catalogue hybrid-mention scope', () => {
  it('uses the selected entries for both numerator and denominator', () => {
    expect(hybrid.autoScore!(selection(['Hybrid X25519 + ML-KEM', 'HYBRID example'], 250))).toBe(
      100
    )
    expect(hybrid.autoScore!(selection(['Hybrid example', 'None', 'None', 'None'], 250))).toBe(25)
  })

  it('does not change when the unrelated catalogue population changes', () => {
    const statuses = ['Hybrid example', 'None']
    expect(hybrid.autoScore!(selection(statuses, 250))).toBe(50)
    expect(hybrid.autoScore!(selection(statuses, 2000))).toBe(50)
    expect(hybrid.autoScore!(selection(statuses, 0))).toBe(50)
  })

  it('keeps an empty selection unknown and a selection without mentions at zero', () => {
    expect(hybrid.autoScore!(selection([], 250))).toBeNull()
    expect(hybrid.autoScore!(selection(['Yes (ML-KEM)', undefined], 250))).toBe(0)
  })

  it('labels the retained keyword rule without turning a planned mention into deployment evidence', () => {
    expect(hybrid.autoScore!(selection(['Planned hybrid support'], 250))).toBe(100)
    expect(hybrid.label).toContain('Selected Catalogue Entries')
    expect(hybrid.description).toContain('text contains “hybrid”')
    expect(hybrid.description).toContain('does not establish availability, deployment coverage')
    expect(hybrid.disabledReason).toContain('Select sample catalogue products')
  })
})

// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { HSM_VENDORS } from './hsmVendors'
import { isInCatalog } from '@/data/catalogStatus'

describe('HSM_VENDORS catalog integrity', () => {
  it('every catalogName resolves to an active product in the central catalog', () => {
    const linked = HSM_VENDORS.filter((v) => v.catalogName)
    const missing = linked.filter((v) => !isInCatalog(v.catalogName!))
    expect(
      missing.map((v) => v.catalogName),
      'These catalogNames are not in the active catalog — add the product or fix the name'
    ).toHaveLength(0)
  })

  it('records without catalogName must have an explicit posture (EOL/deprecated path)', () => {
    const unlinked = HSM_VENDORS.filter((v) => !v.catalogName)
    const noPosture = unlinked.filter((v) => !v.posture)
    expect(
      noPosture.map((v) => v.id),
      'EOL records with no catalogName must set posture explicitly'
    ).toHaveLength(0)
  })
})

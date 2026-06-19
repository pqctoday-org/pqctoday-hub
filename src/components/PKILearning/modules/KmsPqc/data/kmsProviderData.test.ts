// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { KMS_PROVIDERS, getKmsPqcStatus } from './kmsProviderData'
import { isInCatalog, getCatalogStatus } from '@/data/catalogStatus'

// Single-source guardrail: KMS providers must NOT carry their own PQC status —
// it is derived from the central product catalog via `catalogName`. These tests
// fail if a catalogName is mistyped/absent (the join would silently degrade) or
// if the derived status stops tracking the catalog.
describe('KMS providers derive PQC status from the central catalog', () => {
  it('every provider catalogName resolves in the product catalog (no typos, no drift)', () => {
    for (const p of KMS_PROVIDERS) {
      expect(isInCatalog(p.catalogName), `${p.product} → "${p.catalogName}" not in catalog`).toBe(
        true
      )
    }
  })

  it('getKmsPqcStatus reflects the catalog availability, not a stored value', () => {
    for (const p of KMS_PROVIDERS) {
      const avail = getCatalogStatus(p.catalogName)?.availability
      const status = getKmsPqcStatus(p)
      expect(['ga', 'preview', 'experimental', 'planned']).toContain(status)
      if (avail === 'available') expect(status).toBe('ga')
      if (avail === 'roadmap') expect(status).toBe('planned')
      if (avail === 'partial') expect(status).toBe('preview')
    }
  })
})

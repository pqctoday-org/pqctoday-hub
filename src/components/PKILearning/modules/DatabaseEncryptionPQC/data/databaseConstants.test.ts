// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { DATABASE_PROFILES, getProfilePqcSupport } from './databaseConstants'
import { isInCatalog, getCatalogStatus } from '@/data/catalogStatus'

// Single-source guardrail: database profiles must NOT store their own PQC support
// — it is derived from the central product catalog via `catalogName`.
describe('Database profiles derive PQC support from the central catalog', () => {
  it('every profile catalogName resolves in the product catalog (no typos, no drift)', () => {
    for (const p of DATABASE_PROFILES) {
      expect(isInCatalog(p.catalogName), `${p.dbName} → "${p.catalogName}" not in catalog`).toBe(
        true
      )
    }
  })

  it('getProfilePqcSupport tracks catalog availability', () => {
    for (const p of DATABASE_PROFILES) {
      const avail = getCatalogStatus(p.catalogName)?.availability
      const support = getProfilePqcSupport(p)
      expect(['ga', 'planned', 'none']).toContain(support)
      if (avail === 'available') expect(support).toBe('ga')
      if (avail === 'none') expect(support).toBe('none')
    }
  })
})

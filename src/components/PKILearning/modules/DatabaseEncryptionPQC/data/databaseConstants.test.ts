// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  BYOK_ARCHITECTURES,
  DATABASE_PROFILES,
  TDE_MIGRATION_STEPS,
  getProfilePqcSupport,
} from './databaseConstants'
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
      expect(support).toBe(avail ?? 'unverified')
    }
  })
})

const step = (id: string) => {
  const found = TDE_MIGRATION_STEPS.find((x) => x.id === id)
  if (!found) throw new Error(`missing migration step ${id}`)
  return found
}
const architecture = (id: string) => {
  const found = BYOK_ARCHITECTURES.find((x) => x.id === id)
  if (!found) throw new Error(`missing architecture ${id}`)
  return found
}

describe('FIPS statements name a scope instead of a product-wide yes', () => {
  it('gives every profile a module, certificate and configuration scope or an explicit unverified note', () => {
    for (const p of DATABASE_PROFILES) {
      expect(p, p.dbName).not.toHaveProperty('fipsValidated')
      expect(p.fipsScope.length, p.dbName).toBeGreaterThan(40)
      expect(p.fipsScope, p.dbName).toMatch(/not verified here|Unverified here/)
      expect(p.fipsScope, p.dbName).toMatch(/certificate/i)
      expect(p.fipsScope, p.dbName).toMatch(/configuration/i)
    }
  })

  it('keeps MongoDB scope to what its documentation covers', () => {
    const mongo = DATABASE_PROFILES.find((p) => p.id === 'mongodb')
    expect(mongo?.fipsScope).toMatch(/only in MongoDB Enterprise/)
    expect(mongo?.fipsScope).toMatch(/TLS\/SSL, SCRAM and X\.509/)
  })
})

describe('key-custody patterns separate custody, plaintext DEK exposure and revocation', () => {
  it('states all three questions for every pattern', () => {
    for (const a of BYOK_ARCHITECTURES) {
      expect(a.description, a.id).toMatch(/Master-key custody/)
      expect(a.description, a.id).toMatch(/Plaintext DEK exposure/)
      expect(a.description, a.id).toMatch(/Access revocation/)
    }
  })

  it('does not say the provider only ever sees encrypted DEKs when the diagram returns the plaintext DEK', () => {
    const hyok = architecture('hyok')
    expect(hyok.diagram.join(' ')).toMatch(/returns plaintext DEK/)
    expect(hyok.description).not.toMatch(/only ever sees encrypted DEKs/i)
    expect(hyok.description).toMatch(/holds the plaintext DEK while it is unwrapped/)
    expect(JSON.stringify(hyok)).not.toMatch(/Strongest (security )?posture/i)
    expect(hyok.pros.join(' ')).not.toMatch(/never leaves customer infrastructure/i)
  })

  it('carries no invented readiness percentage and does not call HYOK ready outright', () => {
    for (const a of BYOK_ARCHITECTURES) {
      expect(a, a.id).not.toHaveProperty('pqcReadinessScore')
      expect(a.pqcUpgrade, a.id).not.toMatch(/\d+%/)
    }
    expect(architecture('hyok').pqcUpgrade).not.toMatch(/already PQC-ready/i)
  })

  it('does not say a BYOK import copy is only temporary in the cloud KMS', () => {
    const byok = architecture('byok')
    expect(byok.cons.join(' ')).not.toMatch(/temporarily holds/i)
    expect(byok.pros.join(' ')).not.toMatch(/Cloud cannot access plaintext CMK/i)
    expect(byok.cons.join(' ')).toMatch(/usable copy of the imported key material/)
  })
})

describe('migration steps separate protector rotation, DEK rotation and bulk rewrite', () => {
  it('shows protector rotation as a re-wrap that does not rewrite data files', () => {
    const rotation = step('master-key-rotation')
    expect(rotation.description).toMatch(/re-wraps the existing DEKs/)
    expect(rotation.description).toMatch(/not rewritten/)
    expect(rotation.pqcApproach).toMatch(/Design target, not a documented engine command/)
  })

  it('keeps DEK rotation and bulk rewrite as a separate, optional step', () => {
    const rewrite = step('online-reencryption')
    expect(rewrite.title).toMatch(/Only When the DEK Changes/)
    expect(rewrite.description).toMatch(/Re-wrapping does not change the DEK/)
    expect(rewrite.classicalApproach).toMatch(/exclusive lock/)
    expect(rewrite.pqcApproach).not.toMatch(/Same online migration commands/)
  })

  it('only lists commands that exist in the cited documentation', () => {
    const everything = JSON.stringify([TDE_MIGRATION_STEPS, DATABASE_PROFILES])
    for (const invented of [
      'ALTER SYSTEM REKEY',
      'pg_tde REKEY',
      'pg_tde verify',
      'okvutil rekey',
      'ALTER MASTER KEY REGENERATE',
      'ALTER TABLESPACE REKEY',
    ]) {
      expect(everything, invented).not.toContain(invented)
    }
    expect(step('master-key-rotation').classicalApproach).toMatch(
      /ADMINISTER KEY MANAGEMENT SET KEY/
    )
    expect(step('master-key-rotation').classicalApproach).toMatch(/rewrapManyDataKey/)
  })

  it('labels downtime and time figures as sample assumptions to measure on a representative copy', () => {
    expect(step('master-key-rotation').downtime).toMatch(/Sample assumption/)
    expect(step('online-reencryption').downtime).toMatch(/Sample assumption/)
    expect(step('online-reencryption').downtime).toMatch(/representative copy/)
  })
})

describe('key destruction depends on dependencies and retention, not a fixed window', () => {
  it('requires a backup, archive and replica inventory, restore tests and retention checks before destruction', () => {
    const decommission = step('decommission')
    const text = JSON.stringify(decommission)
    expect(text).not.toMatch(/90-day/)
    expect(text).not.toMatch(/1-year/)
    expect(decommission.description).toMatch(/inventoried every backup, archive and replica/)
    expect(decommission.description).toMatch(/restores work/)
    expect(decommission.description).toMatch(/legal and contractual retention/)
    expect(decommission.pqcApproach).toMatch(
      /only after the dependency inventory, restore tests and retention checks pass/
    )
  })

  it('labels the example hold fictional in both columns and keeps one figure', () => {
    const decommission = step('decommission')
    expect(decommission.classicalApproach).toMatch(/fictional 12-month hold/)
    expect(decommission.pqcApproach).toMatch(
      /12-month hold in the classical column is a fictional example/
    )
    expect(JSON.stringify(decommission).match(/\d+-month/g)).toEqual(['12-month', '12-month'])
  })
})

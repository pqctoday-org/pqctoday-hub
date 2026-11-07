// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { HSM_VENDORS, HSM_PKCS11_OPERATIONS, getVendorPqcSupportStatus } from './hsmVendorData'
import { isInCatalog, getCatalogStatus } from '@/data/catalogStatus'

// Single-source guardrail: HSM vendor rows must NOT store their own headline PQC
// support status — it is derived from the central product catalog via `catalogName`.
describe('HSM vendor rows derive PQC support status from the central catalog', () => {
  it('every catalogName resolves in the product catalog (no typos, no drift)', () => {
    for (const v of HSM_VENDORS) {
      expect(isInCatalog(v.catalogName), `${v.name} → "${v.catalogName}" not in catalog`).toBe(true)
    }
  })

  it('getVendorPqcSupportStatus tracks catalog availability', () => {
    for (const v of HSM_VENDORS) {
      const avail = getCatalogStatus(v.catalogName)?.availability
      const status = getVendorPqcSupportStatus(v)
      expect(['production', 'beta', 'limited', 'roadmap']).toContain(status)
      if (avail === 'available') expect(status).toBe('production')
      if (avail === 'partial') expect(status).toBe('limited')
      if (avail === 'roadmap' || avail === 'none') expect(status).toBe('roadmap')
    }
  })

  it('no vendor row reintroduces a hard-coded pqcSupportStatus literal', () => {
    for (const v of HSM_VENDORS) {
      expect(v).not.toHaveProperty('pqcSupportStatus')
    }
  })
})

describe('HSM key-pair step for a classical plus PQC pairing', () => {
  const step = HSM_PKCS11_OPERATIONS.find((o) => o.id === 'hybrid-keygen')
  const text = [step?.name, step?.description, step?.detail, step?.command, step?.output].join(' ')

  it('presents a shared CKA_ID as a grouping convention that the token does not enforce', () => {
    expect(step).toBeDefined()
    expect(text).toMatch(/grouping convention/)
    expect(text).toMatch(/Cryptoki does not enforce/)
    expect(text).toMatch(/two independent C_GenerateKeyPair calls/)
    // not a requirement, and not a security property
    expect(text).not.toMatch(/Hybrid keys require/)
    expect(text).not.toMatch(/to link them logically/)
    expect(text).not.toMatch(/Linked by CKA_ID/)
    expect(text).toMatch(/neither combines them nor adds security/)
  })

  it('points to the standard that defines the combiner, context and authentication', () => {
    expect(text).toMatch(/combiner, context and authentication/)
    expect(text).toMatch(/no composite or hybrid PQC key type/)
    expect(text).toMatch(/draft-ietf-lamps-pq-composite-sigs/)
    // the old draft name is only kept as the predecessor, not as the thing that "may standardize this"
    expect(text).not.toMatch(/may standardize this/)
  })

  it('does not assert vendor or cloud support for hybrid objects without a source', () => {
    const notes = JSON.stringify(step?.vendorNotes)
    expect(notes).not.toMatch(/native composite cert enrollment/)
    expect(notes).not.toMatch(/No cloud HSM supports/)
    expect(notes).toMatch(/not verified here/i)
  })
})

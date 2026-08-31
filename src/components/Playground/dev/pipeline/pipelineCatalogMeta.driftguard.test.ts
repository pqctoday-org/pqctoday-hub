// SPDX-License-Identifier: GPL-3.0-only
//
// Driftguard for the PKCS#11 pipeline builder's palette metadata contract:
// pipelineCatalogMeta.ts's own header promises "every id here must exist
// [in PRIMITIVES]" — this is that promise, checked (dev-tabs-pkcs11-kmip
// plan G6; the file referenced this test by name since it was written and
// it never existed until now).
import { describe, expect, it } from 'vitest'
import { PRIMITIVES } from './pipelinePrimitives'
import { PALETTE_META, PALETTE_ENTRIES } from './pipelineCatalogMeta'

describe('pipelineCatalogMeta driftguard', () => {
  it('every PRIMITIVES id has a PALETTE_META entry', () => {
    const missing = Object.keys(PRIMITIVES).filter((id) => !(id in PALETTE_META))
    expect(missing).toEqual([])
  })

  it('every PALETTE_META id exists in PRIMITIVES (no orphaned display metadata)', () => {
    const orphaned = Object.keys(PALETTE_META).filter((id) => !(id in PRIMITIVES))
    expect(orphaned).toEqual([])
  })

  it('PALETTE_ENTRIES has exactly one row per PRIMITIVES id, in registry order', () => {
    expect(PALETTE_ENTRIES.map((e) => e.id)).toEqual(Object.keys(PRIMITIVES))
  })

  it('every entry carries a non-empty label and hex string', () => {
    for (const entry of PALETTE_ENTRIES) {
      expect(entry.name.length, `${entry.id}: empty name`).toBeGreaterThan(0)
      expect(entry.hex, `${entry.id}: hex missing`).toMatch(/^0x[0-9a-f]+$/)
    }
  })

  it('pq flag is only ever true, false, or undefined — never a truthy non-boolean', () => {
    for (const entry of PALETTE_ENTRIES) {
      expect(entry.pq === true || entry.pq === false || entry.pq === undefined).toBe(true)
    }
  })
})

// Same class of check, one level deeper: not "does every primitive have a
// palette entry" but "does every op a primitive DECLARES actually have real
// codegen support" — pipelineCodegen.ts's emitOp 'import' case guards to
// ml-kem/ml-dsa keygen kinds only; a primitive offering import without one
// of those would show a working-looking tile that always crashes at
// runtime (the exact bug this test pins, found via the 2026-08-30 palette
// audit — RSA/ECDSA/Ed25519/SLH-DSA/HSS-LMS all had this before signOps()'s
// import became opt-in).
describe('PRIMITIVES op/keygen consistency', () => {
  it('every primitive offering import has keygen support emitOp actually implements', () => {
    const badImports = Object.entries(PRIMITIVES)
      .filter(([, spec]) => spec.ops.import)
      .filter(([, spec]) => spec.keygen?.kind !== 'ml-kem' && spec.keygen?.kind !== 'ml-dsa')
      .map(([id]) => id)
    expect(badImports).toEqual([])
  })
})

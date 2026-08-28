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

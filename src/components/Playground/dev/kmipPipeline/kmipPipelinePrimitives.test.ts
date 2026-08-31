// SPDX-License-Identifier: GPL-3.0-only
//
// Pins the exact bug the 2026-08-30 palette audit found: the KMIP
// Developer tab's Dry-run op picker used to be a hand-maintained
// PascalCase string[] independent of KMIP_PRIMITIVES, and it silently
// missed 'Get' — a fully real, universally-declared op. ALL_KMIP_WIRE_OPS
// replaces that hand list with one derived from the same registry
// opsFor()/KMIP_PRIM_IDS already use, so this test is really guarding the
// derivation itself, not a second hand-maintained list.
import { describe, expect, it } from 'vitest'
import {
  ALL_KMIP_WIRE_OPS,
  toWireOpName,
  KMIP_PRIMITIVES,
  type KmipOp,
} from './kmipPipelinePrimitives'

describe('ALL_KMIP_WIRE_OPS', () => {
  it('includes every wire op every primitive declares, deduped', () => {
    expect(ALL_KMIP_WIRE_OPS).toContain('Get')
    expect(new Set(ALL_KMIP_WIRE_OPS).size).toBe(ALL_KMIP_WIRE_OPS.length)
  })

  it('covers every op any KMIP_PRIMITIVES entry declares', () => {
    const declared = new Set(
      Object.values(KMIP_PRIMITIVES).flatMap((p) =>
        (Object.keys(p.ops) as KmipOp[]).map(toWireOpName)
      )
    )
    for (const op of declared) {
      expect(ALL_KMIP_WIRE_OPS, `missing ${op}`).toContain(op)
    }
  })
})

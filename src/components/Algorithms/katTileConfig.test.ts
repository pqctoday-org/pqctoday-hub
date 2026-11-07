// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { KDF_TILES } from './katTileConfig'

// A key-derivation tile carries a hash-level badge number. The strength of a
// key that a KDF derives depends on the secret fed into it, so each tile has
// to say what that condition is instead of letting the badge stand alone.
describe('key-derivation tiles state their input-strength conditions', () => {
  const byId = (id: string) => KDF_TILES.find((t) => t.id === id)

  it('covers both key-derivation tiles', () => {
    expect(KDF_TILES.map((t) => t.id).sort()).toEqual(['hkdf', 'pbkdf2'])
  })

  it('gives every tile a note that separates the badge from the derived-key strength', () => {
    for (const tile of KDF_TILES) {
      expect(tile.strengthNote, tile.id).toBeTruthy()
      expect(tile.strengthNote, tile.id).toMatch(/not the strength of (a )?derived key/)
      expect(tile.strengthNote, tile.id).toMatch(/Table 3/)
    }
  })

  it('makes the password, salt-and-cost condition explicit for PBKDF2', () => {
    const tile = byId('pbkdf2')
    expect(tile?.strengthNote).toMatch(/password/)
    expect(tile?.strengthNote).toMatch(/iteration count/)
    expect(tile?.strengthNote).toMatch(/output length does not add/)
    expect(tile?.operations.join(' ')).toMatch(/password and the iteration count/)
  })

  it('makes the input-entropy condition explicit for HKDF', () => {
    const tile = byId('hkdf')
    expect(tile?.strengthNote).toMatch(/cannot amplify/)
    expect(tile?.strengthNote).toMatch(/input keying material/)
    expect(tile?.operations.join(' ')).toMatch(/input keying material/)
  })

  it('does not present the fixed badge number as a derived-key security claim', () => {
    for (const tile of KDF_TILES) {
      const text = `${tile.operations.join(' ')} ${tile.strengthNote ?? ''}`
      expect(text, tile.id).not.toMatch(/provides? 128|128-bit security|derives? 128/i)
    }
  })
})

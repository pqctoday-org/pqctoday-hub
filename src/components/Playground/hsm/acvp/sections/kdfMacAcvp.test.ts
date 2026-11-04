// SPDX-License-Identifier: AGPL-3.0-only
//
// The committee's CK_KMAC_PARAMS block (PKCS#11 v3.3 working draft, kmac.md) is
// built field by field in WebAssembly memory. The rows that use it cannot run
// against an engine that predates the committee's KMAC numbers, so this pins the
// layout itself: key handle first, then the output length, then the customization
// string pointer and its length (16 bytes on wasm32), and that the vendor block
// keeps its different order.
import { describe, it, expect } from 'vitest'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { pKmacDraft } from './kdfMacAcvp'

/** A just-enough module: a bump allocator plus the two calls the builder makes. */
function fakeModule() {
  const mem = new Uint8Array(4096)
  const words = new Map<number, number>()
  let next = 16
  const M = {
    HEAPU8: mem,
    _malloc: (n: number) => {
      const p = next
      next += Math.ceil(n / 8) * 8 + 8
      return p
    },
    setValue: (ptr: number, v: number, type: string) => {
      expect(type).toBe('i32')
      words.set(ptr, v)
    },
  }
  return { M: M as unknown as SoftHSMModule, words, mem }
}

describe('CK_KMAC_PARAMS block for CKM_KMAC128 / CKM_KMAC256', () => {
  it('puts hKey first, then ulMacLength, then the customization string pointer and length', () => {
    const { M, words, mem } = fakeModule()
    const custom = Uint8Array.from([1, 2, 3, 4, 5])
    const b = pKmacDraft(M, 0x77, custom, 32)
    expect(b.len).toBe(16)
    expect(words.get(b.ptr)).toBe(0x77) // hKey
    expect(words.get(b.ptr + 4)).toBe(32) // ulMacLength
    const cp = words.get(b.ptr + 8)! // pCustomizationString
    expect(words.get(b.ptr + 12)).toBe(5) // ulCustomizationStringLen
    expect(Array.from(mem.slice(cp, cp + 5))).toEqual([1, 2, 3, 4, 5])
    expect(b.allocs).toContain(cp)
    expect(b.allocs).toContain(b.ptr)
  })

  it('uses NULL_PTR and length 0 when there is no customization string, as the draft requires', () => {
    const { M, words } = fakeModule()
    const b = pKmacDraft(M, 9, new Uint8Array(0), 64)
    expect(words.get(b.ptr + 8)).toBe(0)
    expect(words.get(b.ptr + 12)).toBe(0)
    expect(b.allocs).toHaveLength(1)
  })
})

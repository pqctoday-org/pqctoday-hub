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
import { pKmacDraft, runKmacAcvpSection } from './kdfMacAcvp'

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

describe('KMAC section on an engine without the draft number', () => {
  const ctxFor = (eName: string) => {
    const logs: string[] = []
    const rows: { id: string; status: string }[] = []
    const ctx = {
      M: {} as SoftHSMModule,
      hSession: 1,
      eName,
      slot: 0,
      // A non-empty list that lacks both KMAC numbers (an empty list means the probe
      // failed, and the suite then runs everything).
      mechs: new Set<number>([0x1050]),
      referenceUrl: '',
      pushResult: async (r: { id: string; status: string }) => {
        rows.push({ id: r.id, status: r.status })
      },
      addLog: (m: string) => {
        logs.push(m)
      },
    }
    return { ctx, logs, rows }
  }

  it('C++: no draft rows, and one log line says why', async () => {
    const { ctx, logs, rows } = ctxFor('C++')
    await runKmacAcvpSection(ctx as unknown as Parameters<typeof runKmacAcvpSection>[0])
    expect(rows.some((r) => r.id.includes('-draft-'))).toBe(false)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.status === 'skip')).toBe(true) // the vendor rows, skipped here
    const line = logs.filter((l) => l.includes('no draft rows'))
    expect(line).toHaveLength(1)
    expect(line[0]).toContain('The C++ engine does not carry the draft')
  })

  it('Rust build without the numbers: no draft rows, and the line names the build, not the engine', async () => {
    const { ctx, logs, rows } = ctxFor('Rust')
    await runKmacAcvpSection(ctx as unknown as Parameters<typeof runKmacAcvpSection>[0])
    expect(rows.some((r) => r.id.includes('-draft-'))).toBe(false)
    const line = logs.filter((l) => l.includes('no draft rows'))
    expect(line).toHaveLength(1)
    expect(line[0]).toContain('This engine build does not advertise it yet')
    expect(line[0]).not.toContain('C++ engine does not carry')
  })
})

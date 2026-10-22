// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { logByteComparison } from './comparisonLog'

describe('public ACVP comparison log', () => {
  it('shows full expected and computed bytes, preserving leading zeros', () => {
    const logs: string[] = []
    const bytes = new Uint8Array(100).fill(0xab)
    bytes[0] = 0
    const hex = '00' + 'ab'.repeat(99)
    expect(
      logByteComparison((l) => logs.push(l), 'case 42', bytes, hex.toUpperCase(), 'digest')
    ).toBe(true)
    expect(logs[0]).toContain(`Expected digest (100 bytes): ${hex}`)
    expect(logs[0]).toContain(`Computed digest (100 bytes): ${hex}`)
    expect(logs[0]).toContain('case 42')
    expect(logs[0]).toContain('MATCH — byte for byte')
  })

  it('prints different actual bytes on mismatch rather than echoing the expectation', () => {
    const logs: string[] = []
    expect(logByteComparison((l) => logs.push(l), 'case', new Uint8Array([0, 2]), '0001')).toBe(
      false
    )
    expect(logs[0]).toContain('Expected output (2 bytes): 0001')
    expect(logs[0]).toContain('Computed output (2 bytes): 0002')
    expect(logs[0]).toContain('MISMATCH')
  })

  it('distinguishes absent output from a valid zero-length output', () => {
    const logs: string[] = []
    expect(logByteComparison((l) => logs.push(l), 'case', null, '')).toBe(false)
    expect(logs[0]).toContain('NOT COMPARED')
    expect(logByteComparison((l) => logs.push(l), 'case', new Uint8Array(), '')).toBe(true)
  })
})

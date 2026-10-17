// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { parseHexBytes } from './hexInput'

describe('parseHexBytes', () => {
  it('preserves zero-valued bytes', () => {
    const result = parseHexBytes('00ff0100')
    expect(result.ok).toBe(true)
    if (result.ok) expect([...result.bytes]).toEqual([0x00, 0xff, 0x01, 0x00])
  })

  it('accepts whitespace, commas, and 0x prefixes', () => {
    const result = parseHexBytes('0x00, 0x10 ff')
    expect(result.ok).toBe(true)
    if (result.ok) expect([...result.bytes]).toEqual([0x00, 0x10, 0xff])
  })

  it('rejects an incomplete final byte', () => {
    expect(parseHexBytes('abc')).toEqual({
      ok: false,
      error: 'Odd number of hex digits — each byte requires 2 digits.',
    })
  })

  it('rejects non-hexadecimal characters', () => {
    expect(parseHexBytes('00xz')).toEqual({
      ok: false,
      error: 'Invalid characters — enter hexadecimal digits only (0–9, a–f).',
    })
  })
})

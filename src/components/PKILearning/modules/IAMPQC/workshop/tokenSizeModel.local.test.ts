// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { estimateCompactTokenSize } from './tokenSizeModel'

const independentCompactLength = (header: string, payload: string, signatureBytes: number) =>
  [Buffer.from(header, 'utf8'), Buffer.from(payload, 'utf8'), Buffer.alloc(signatureBytes)]
    .map((bytes) => bytes.toString('base64url'))
    .join('.').length

describe('Compact-token length accounting only', () => {
  it.each([
    [0, 0],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 6],
  ])('counts %i signature bytes as %i unpadded characters', (bytes, encoded) => {
    const result = estimateCompactTokenSize('', '', bytes)!
    expect(result.encodedSignatureBytes).toBe(encoded)
    expect(result.total).toBe(independentCompactLength('', '', bytes))
  })
  it('counts the actual 70/243/3309 sample as 4832 bytes, not the old 3747 estimate', () => {
    const result = estimateCompactTokenSize('h'.repeat(70), 'p'.repeat(243), 3309)!
    expect(result).toMatchObject({
      encodedHeaderBytes: 94,
      encodedPayloadBytes: 324,
      encodedSignatureBytes: 4412,
      separatorBytes: 2,
      total: 4832,
    })
    expect(result.total).toBe(independentCompactLength('h'.repeat(70), 'p'.repeat(243), 3309))
  })
  it('counts UTF8 bytes, preserving the supplied textual whitespace without claiming signer compatibility', () => {
    const header = '{"name":"Zoë"}'
    const payload = '{"note":"🔐"}\n'
    const result = estimateCompactTokenSize(header, payload, 2)!
    expect(result.headerBytes).toBe(Buffer.byteLength(header))
    expect(result.payloadBytes).toBe(Buffer.byteLength(payload))
    expect(result.headerBytes).toBeGreaterThan(header.length)
    expect(result.payloadBytes).toBeGreaterThan(payload.length)
    expect(result.total).toBe(independentCompactLength(header, payload, 2))
  })
  it.each([undefined, null, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])(
    'keeps missing/invalid count %s unassessed, distinct from a zero-byte sizing fixture',
    (value) => {
      expect(estimateCompactTokenSize('{}', '{}', value)).toBeNull()
      expect(estimateCompactTokenSize('{}', '{}', 0)).not.toBeNull()
    }
  )
})

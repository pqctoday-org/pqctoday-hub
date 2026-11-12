// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { SAMPLE_JWT_PAYLOAD } from '../APISecurityJWT/constants'
import { createJWTHeader, createJWTPayload } from '../APISecurityJWT/jwtUtils'
import { DEV_GUIDE_DATA } from './data'

const example = DEV_GUIDE_DATA.threatImpacts.find((impact) => impact.id === 'key-size-impact')!

function sizeSample(alg: string, signatureBytes: number, payload: Record<string, unknown>) {
  const header = createJWTHeader(alg)
  const claims = createJWTPayload(payload)
  // Size-only bytes: this does not construct a valid cryptographic signature.
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  const compact = [header, claims, signature].join('.')
  return {
    header: header.length,
    payload: claims.length,
    signature: signature.length,
    compact: compact.length,
    authorizationLine: new TextEncoder().encode(`Authorization: Bearer ${compact}\r\n`).length,
  }
}

describe('developer guide complete token sizing example', () => {
  it('accounts for the exact displayed header, claims, signatures and separators', () => {
    const classical = sizeSample('ES256', 64, SAMPLE_JWT_PAYLOAD)
    const pqc = sizeSample('ML-DSA-65', 3309, SAMPLE_JWT_PAYLOAD)

    expect(classical).toEqual({
      header: 36,
      payload: 231,
      signature: 86,
      compact: 355,
      authorizationLine: 379,
    })
    expect(pqc).toEqual({
      header: 42,
      payload: 231,
      signature: 4412,
      compact: 4687,
      authorizationLine: 4711,
    })
    expect(example.exampleScenario).toContain(JSON.stringify({ alg: 'ML-DSA-65', typ: 'JWT' }))
    expect(example.exampleScenario).toContain(
      JSON.stringify(SAMPLE_JWT_PAYLOAD).replaceAll(',', ', ')
    )
    expect(example.exampleScenario).toContain('36 + 231 + 86 + 2 = 355')
    expect(example.exampleScenario).toContain('42 + 231 + 4,412 + 2 = 4,687')
    expect(example.exampleScenario).toContain('4,711 bytes')
    expect(pqc.authorizationLine).toBeLessThan(8 * 1024)
  })

  it('shows that a larger complete payload crosses the same sample budget', () => {
    const larger = sizeSample('ML-DSA-65', 3309, {
      ...SAMPLE_JWT_PAYLOAD,
      notes: 'x'.repeat(3000),
    })
    expect(larger.payload).toBe(4246)
    expect(larger.authorizationLine).toBe(8726)
    expect(larger.authorizationLine).toBeGreaterThan(8 * 1024)
    expect(example.exampleScenario).toContain('3,000 ASCII x characters')
    expect(example.exampleScenario).toContain('8,726 bytes')
  })

  it('counts encoded UTF-8 claims and keeps sizing separate from verification and server limits', () => {
    const ascii = sizeSample('ML-DSA-65', 3309, { ...SAMPLE_JWT_PAYLOAD, notes: 'x' })
    const unicode = sizeSample('ML-DSA-65', 3309, { ...SAMPLE_JWT_PAYLOAD, notes: '🔐' })
    expect(unicode.payload).toBeGreaterThan(ascii.payload)
    expect(unicode.authorizationLine - ascii.authorizationLine).toBe(
      unicode.payload - ascii.payload
    )
    expect(example.exampleScenario).toContain('size placeholders, not signed or verified tokens')
    expect(example.exampleScenario).toContain('other headers and cookies')
    expect(example.exampleScenario).toContain('configured gateway')
  })
})

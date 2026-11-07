// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { formatDriver } from './driverLabels'

describe('sensitivity driver display scope', () => {
  it('describes an unknown answer without inventing the assumption used by a particular caller', () => {
    expect(formatDriver('dataSensitivity:unknown')).toBe('Data sensitivity not assessed')
    expect(formatDriver('dataSensitivity:unknown')).not.toMatch(/classified|high|critical/)
  })
  it.each(['low', 'medium', 'high', 'critical'])('keeps the known%s display unchanged', (level) => {
    expect(formatDriver(`dataSensitivity:${level}`)).toBe(`Data classified as ${level}`)
  })
  it('keeps other existing driver callers and canonical range labels unchanged', () => {
    expect(formatDriver('dataRetention:10-25y')).toBe(
      'Data must remain trustworthy for 10–25 years'
    )
    expect(formatDriver('dataRetention:unknown')).toBe(
      'Data must remain trustworthy for unknown (industry default applied)'
    )
    expect(formatDriver('credentialLifetime:25-plus')).toBe('Credentials live for 25+ years')
    expect(formatDriver('currentCrypto:signing')).toBe(
      'Signing algorithms in use (RSA / ECDSA / Ed25519)'
    )
  })
})

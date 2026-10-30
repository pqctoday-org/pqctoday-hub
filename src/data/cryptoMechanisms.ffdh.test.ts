// SPDX-License-Identifier: AGPL-3.0-only
/** The finite-field Diffie-Hellman family (FFDH): its place in the vocabulary and its sizes. */
import { describe, expect, it } from 'vitest'
import {
  getMechanismFamily,
  isKnownMechanism,
  mechanismGroup,
  pqcReplacementsFor,
} from './cryptoMechanisms'
import { ALGORITHM_REGISTRY } from './algorithmProperties'

describe('FFDH mechanism family', () => {
  const ffdh = getMechanismFamily('FFDH')

  it('is a known classical key-exchange family with its own CycloneDX name', () => {
    expect(isKnownMechanism('FFDH')).toBe(true)
    expect(ffdh?.classical).toBe(true)
    expect(ffdh?.kinds).toEqual(['key-exchange'])
    expect(ffdh?.cycloneDxFamilies).toEqual(['FFDH'])
    expect(mechanismGroup('FFDH')).toBe('key-exchange')
  })

  it('is kept apart from ECDH: no shared members', () => {
    const ecdh = getMechanismFamily('ECDH')
    const shared = (ffdh?.registryMembers ?? []).filter((m) => ecdh?.registryMembers.includes(m))
    expect(shared).toEqual([])
  })

  it('is paired with ML-KEM as its successor', () => {
    expect(pqcReplacementsFor('FFDH').map((f) => f.family)).toContain('ML-KEM')
  })

  it('sizes each MODP member from its modulus (RFC 3526): public value and shared secret are one modulus long', () => {
    for (const member of ffdh?.registryMembers ?? []) {
      const bits = Number(/MODP-(\d+)/.exec(member)?.[1])
      const entry = ALGORITHM_REGISTRY[member]
      expect(bits).toBeGreaterThan(0)
      expect(entry.publicKeyBytes).toBe(bits / 8)
      expect(entry.sharedSecretBytes).toBe(bits / 8)
      expect(entry.securityLevel).toBeNull()
    }
    expect(ffdh?.registryMembers).toHaveLength(3)
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
// The pure ML-KEM entries and the SHAKE256 KDF id added for draft-ietf-hpke-pq-05.
import { describe, it, expect } from 'vitest'
import { HPKE_KDF, HPKE_KDF_SHAKE256, HPKE_KEM, kdfInfo, kemInfo } from './hpkeService'

describe('pure ML-KEM KEM table (draft-ietf-hpke-pq-05, FIPS 203 sizes)', () => {
  it.each([
    [HPKE_KEM.MLKEM512, 0x0040, 512, 768, 800],
    [HPKE_KEM.MLKEM768, 0x0041, 768, 1088, 1184],
    [HPKE_KEM.MLKEM1024, 0x0042, 1024, 1568, 1568],
  ])('kem_id 0x%s has the registered id and the FIPS 203 sizes', (id, wire, variant, nenc, npk) => {
    expect(id).toBe(wire)
    const info = kemInfo(id)
    expect(info.kind).toBe('pq')
    expect(info).toMatchObject({
      pqVariant: variant,
      Nsecret: 32,
      Nenc: nenc,
      Npk: npk,
      auth: false,
    })
  })
})

describe('SHAKE256 key derivation (kdf_id 0x0011)', () => {
  it('has the registered id and is kept out of the KDFs the standard pieces can build', () => {
    expect(HPKE_KDF_SHAKE256).toBe(0x0011)
    expect(Object.values(HPKE_KDF)).not.toContain(HPKE_KDF_SHAKE256)
    expect(() => kdfInfo(HPKE_KDF_SHAKE256)).toThrow(/Unknown HPKE kdf_id/)
  })
})

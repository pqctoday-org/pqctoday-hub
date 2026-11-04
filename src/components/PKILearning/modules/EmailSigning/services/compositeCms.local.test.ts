// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { compositeProfileByOid, verifyClassical } from './compositeCms'
import { DRAFT_RAW_VECTORS, DRAFT_VECTOR_MESSAGE } from '../../HybridCrypto/data/externalVectors'
import { buildCompositeMessageRepresentative } from '../../HybridCrypto/services/certBuilder'

// Existing official raw vectors, rechecked against lamps-wg/draft-composite-sigs
// b9e2674c0072df66ea09abeabc1c1be5ef9baf29, src/testvectors.json.
// Byte equality and source hash are recorded with the remediation evidence.
const decode = (b64: string) => new Uint8Array(Buffer.from(b64, 'base64'))
const cases = [
  { oid: '1.3.6.1.5.5.7.6.45', pkBytes: 1952, sigBytes: 3309 },
  { oid: '1.3.6.1.5.5.7.6.49', pkBytes: 2592, sigBytes: 4627 },
]
describe('email composite traditional hash against official raw vectors', () => {
  it.each(cases)(
    '$oid verifies the official classical signature and rejects the composite prehash as its ECDSA hash',
    async ({ oid, pkBytes, sigBytes }) => {
      const vector = DRAFT_RAW_VECTORS.find((v) => v.oid === oid)!
      const profile = compositeProfileByOid(oid)!
      const mPrime = await buildCompositeMessageRepresentative(
        profile,
        new TextEncoder().encode(DRAFT_VECTOR_MESSAGE),
        new Uint8Array()
      )
      const pk = decode(vector.pkBase64).subarray(pkBytes)
      const sig = decode(vector.sigBase64).subarray(sigBytes)
      expect(await verifyClassical(profile, pk, sig, mPrime)).toBe(true)
      if (profile.classical.kind !== 'ecdsa') throw new Error('test profile must use ECDSA')
      const wrong = {
        ...profile,
        classical: { ...profile.classical, tradHash: 'SHA-512' as const },
      }
      expect(await verifyClassical(wrong, pk, sig, mPrime)).toBe(false)
      const changed = mPrime.slice()
      changed[0] ^= 1
      expect(await verifyClassical(profile, pk, sig, changed)).toBe(false)
    }
  )
})

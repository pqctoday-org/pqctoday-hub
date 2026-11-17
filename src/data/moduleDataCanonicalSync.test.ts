// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { FIPS_OBJECT_SIZES } from './verification/fipsObjectSizes'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { ml_kem512, ml_kem768, ml_kem1024 } from '@noble/post-quantum/ml-kem.js'
const suites = {
  'ML-DSA-44': ml_dsa44,
  'ML-DSA-65': ml_dsa65,
  'ML-DSA-87': ml_dsa87,
  'ML-KEM-512': ml_kem512,
  'ML-KEM-768': ml_kem768,
  'ML-KEM-1024': ml_kem1024,
}
describe('independently sourced FIPS raw-object claims', () => {
  for (const [name, expected] of Object.entries(FIPS_OBJECT_SIZES)) {
    it(`${name}: registry agrees with the independently transcribed specification`, () => {
      expect(ALGORITHM_REGISTRY[name]).toMatchObject(expected)
    })
    it(`${name}: actual engine output has the specified raw lengths`, () => {
      const suite = suites[name as keyof typeof suites]
      const { publicKey, secretKey } = suite.keygen()
      expect(publicKey.length).toBe(expected.publicKeyBytes)
      expect(secretKey.length).toBe(expected.privateKeyBytes)
      const message = new TextEncoder().encode('Fictional raw-object length check')
      const output =
        'sign' in suite ? suite.sign(message, secretKey) : suite.encapsulate(publicKey).cipherText
      expect(output.length).toBe(expected.signatureOrCiphertextBytes)
    })
  }
})

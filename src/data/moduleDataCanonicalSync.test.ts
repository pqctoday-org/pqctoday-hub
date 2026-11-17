// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { FIPS_OBJECT_SIZES } from './verification/fipsObjectSizes'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { ml_kem512, ml_kem768, ml_kem1024 } from '@noble/post-quantum/ml-kem.js'
import {
  slh_dsa_sha2_128s,
  slh_dsa_sha2_128f,
  slh_dsa_sha2_192s,
  slh_dsa_sha2_192f,
  slh_dsa_sha2_256s,
  slh_dsa_sha2_256f,
  slh_dsa_shake_128s,
  slh_dsa_shake_128f,
  slh_dsa_shake_192s,
  slh_dsa_shake_192f,
  slh_dsa_shake_256s,
  slh_dsa_shake_256f,
} from '@noble/post-quantum/slh-dsa.js'
const slhSuites = {
  'SLH-DSA-SHA2-128s': slh_dsa_sha2_128s,
  'SLH-DSA-SHA2-128f': slh_dsa_sha2_128f,
  'SLH-DSA-SHA2-192s': slh_dsa_sha2_192s,
  'SLH-DSA-SHA2-192f': slh_dsa_sha2_192f,
  'SLH-DSA-SHA2-256s': slh_dsa_sha2_256s,
  'SLH-DSA-SHA2-256f': slh_dsa_sha2_256f,
  'SLH-DSA-SHAKE-128s': slh_dsa_shake_128s,
  'SLH-DSA-SHAKE-128f': slh_dsa_shake_128f,
  'SLH-DSA-SHAKE-192s': slh_dsa_shake_192s,
  'SLH-DSA-SHAKE-192f': slh_dsa_shake_192f,
  'SLH-DSA-SHAKE-256s': slh_dsa_shake_256s,
  'SLH-DSA-SHAKE-256f': slh_dsa_shake_256f,
}
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
    if (name in slhSuites) {
      it(`${name}: declared engine lengths agree with FIPS (metadata, not an execution claim)`, () => {
        const suite = slhSuites[name as keyof typeof slhSuites]
        expect(suite.lengths.publicKey).toBe(expected.publicKeyBytes)
        expect(suite.lengths.secretKey).toBe(expected.privateKeyBytes)
        expect(suite.lengths.signature).toBe(expected.signatureOrCiphertextBytes)
      })
      continue
    }
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

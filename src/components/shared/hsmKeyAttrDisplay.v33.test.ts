// SPDX-License-Identifier: AGPL-3.0-only
//
// The key inspector's display of PKCS#11 v3.3 working-draft composite keys:
// the parameter-set name and the two halves' sizes, and the composite key
// types' names and families in object discovery (an unknown key type used
// to fall through to the 'aes' family default).
import { describe, it, expect } from 'vitest'
import { compositeHalves, CKK_NAMES } from './hsmKeyAttrDisplay'
import { CKK_TO_FAMILY } from '@/components/Playground/keystore/discoverHsmObjects'
import { describeParameterSetByKeyType } from '@/wasm/pkcs11Inspect'
import { makeHsmKeyLabel } from '@/components/Playground/hsm/shared'

describe('composite key display (v3.3 working draft)', () => {
  it('names the composite key types and files them under their own families', () => {
    expect(CKK_NAMES[0x4c]).toBe('CKK_COMP_KEM')
    expect(CKK_NAMES[0x4d]).toBe('CKK_COMP_SIG')
    expect(CKK_TO_FAMILY[0x4c]).toBe('composite-kem')
    expect(CKK_TO_FAMILY[0x4d]).toBe('composite-sig')
    expect(makeHsmKeyLabel('composite-kem', 'public')).toBe(
      'Composite ML-KEM (CKK_COMP_KEM) Public Key'
    )
  })

  it('resolves CKA_PARAMETER_SET by key type', () => {
    expect(describeParameterSetByKeyType(0x4c, 0x04)?.name).toBe('CKP_COMP_KEM_MLKEM768_X25519')
    expect(describeParameterSetByKeyType(0x4d, 0x09)?.name).toBe(
      'CKP_COMP_SIG_MLDSA65_ECDSA_P256_SHA512'
    )
    // Same value, other key type: an ML-DSA set, not a composite one.
    expect(describeParameterSetByKeyType(0x4a, 0x02)?.name).toBe('CKP_ML_DSA_65')
  })

  it('shows the two halves with their sizes', () => {
    expect(compositeHalves(0x4c, 0x04)).toBe(
      'ML-KEM-768 public key 1184 B ‖ X25519 public key 32 B (id-MLKEM768-X25519-SHA3-256, OID 1.3.6.1.5.5.7.6.58)'
    )
    expect(compositeHalves(0x4d, 0x09)).toMatch(
      /^ML-DSA-65 public key 1952 B ‖ ECDSA-P256 public key 65 B/
    )
    expect(compositeHalves(0x4d, 0x01)).toMatch(/RSA2048-PSS public key ≤270 B/)
    expect(compositeHalves(0x4a, 0x02)).toBeNull()
    expect(compositeHalves(0x4c, null)).toBeNull()
    expect(compositeHalves(0x4c, 0x99)).toBeNull()
  })
})

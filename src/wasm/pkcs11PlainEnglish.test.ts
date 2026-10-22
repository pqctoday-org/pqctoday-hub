// SPDX-License-Identifier: AGPL-3.0-only
//
// Beginner-mode phrases for the PKCS#11 v3.3 working-draft calls. The log
// panel passes the decoded mechanism name along with the raw arguments, so
// a composite call reads as composite, not as plain ML-KEM / ML-DSA.
import { describe, it, expect } from 'vitest'
import { pkcs11PlainEnglish } from './pkcs11PlainEnglish'

describe('pkcs11PlainEnglish — v3.3 working-draft calls', () => {
  it('composite key generation, encapsulation and decapsulation', () => {
    expect(pkcs11PlainEnglish('C_GenerateKeyPair', 'CKM_COMP_KEM_KEY_PAIR_GEN')).toMatch(
      /composite ML-KEM keypair/
    )
    expect(pkcs11PlainEnglish('C_GenerateKeyPair', 'CKM_COMP_SIG_KEY_PAIR_GEN')).toMatch(
      /composite ML-DSA keypair/
    )
    expect(pkcs11PlainEnglish('C_EncapsulateKey', 'hSession=0x1 CKM_COMP_KEM')).toMatch(
      /composite encapsulate/
    )
    expect(pkcs11PlainEnglish('C_DecapsulateKey', 'CKM_COMP_KEM')).toMatch(/composite decapsulate/)
  })

  it('composite and external-µ signing', () => {
    expect(pkcs11PlainEnglish('C_SignInit', 'CKM_COMP_SIG')).toMatch(/composite ML-DSA signature/)
    expect(pkcs11PlainEnglish('C_SignInit', 'CKM_COMP_SIG_EXTERNAL_HASH')).toMatch(/pre-hash/)
    expect(pkcs11PlainEnglish('C_SignInit', 'CKM_ML_DSA_EXTERNAL_MU')).toMatch(/external µ/)
    expect(pkcs11PlainEnglish('C_VerifyInit', 'CKM_COMP_SIG')).toMatch(/both halves/)
    expect(pkcs11PlainEnglish('C_DigestInit', 'CKM_ML_DSA_EXTERNAL_MU_GEN')).toMatch(/ML-DSA µ/)
  })

  it('existing phrases are unchanged', () => {
    expect(pkcs11PlainEnglish('C_EncapsulateKey', '')).toMatch(/^ML-KEM encapsulate/)
    expect(pkcs11PlainEnglish('C_VerifyInit', '')).toBe('prepare signature verification')
    expect(pkcs11PlainEnglish('C_SignInit', 'CKM_ML_DSA')).toMatch(/ML-DSA signature \(PQC\)/)
  })
})

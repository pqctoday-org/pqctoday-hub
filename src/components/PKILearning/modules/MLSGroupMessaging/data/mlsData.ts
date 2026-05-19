// SPDX-License-Identifier: GPL-3.0-only

export interface MLSCiphersuite {
  id: string
  label: string
  status: 'baseline' | 'draft-pq' | 'draft-hybrid'
  kem: string
  kdf: string
  aead: string
  signature: string
  referenceId: string
}

/**
 * MLS ciphersuite catalogue surfaced in the Learn + Workshop tabs.
 * Keep in sync with library_*.csv entries referenced by `referenceId`.
 */
export const MLS_CIPHERSUITES: MLSCiphersuite[] = [
  {
    id: 'mls_128_dhkemx25519_aes128gcm_sha256_ed25519',
    label: 'MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519',
    status: 'baseline',
    kem: 'DHKEM(X25519, HKDF-SHA256)',
    kdf: 'HKDF-SHA256',
    aead: 'AES-128-GCM',
    signature: 'Ed25519',
    referenceId: 'RFC 9420',
  },
  {
    id: 'mls_128_dhkemp256_aes128gcm_sha256_p256',
    label: 'MLS_128_DHKEMP256_AES128GCM_SHA256_P256',
    status: 'baseline',
    kem: 'DHKEM(P-256, HKDF-SHA256)',
    kdf: 'HKDF-SHA256',
    aead: 'AES-128-GCM',
    signature: 'ECDSA P-256',
    referenceId: 'RFC 9420',
  },
  {
    id: 'mls_pq_mlkem768_aes128gcm_sha256_mldsa65',
    label: 'MLS_PQ — ML-KEM-768 + ML-DSA-65 (draft)',
    status: 'draft-pq',
    kem: 'DHKEM-replacement via ML-KEM-768',
    kdf: 'HKDF-SHA256',
    aead: 'AES-128-GCM',
    signature: 'ML-DSA-65',
    referenceId: 'draft-ietf-mls-pq-ciphersuites-04',
  },
  {
    id: 'mls_hybrid_x25519_mlkem768',
    label: 'MLS Hybrid Combiner — X25519 + ML-KEM-768',
    status: 'draft-hybrid',
    kem: 'X25519 ‖ ML-KEM-768 (combiner)',
    kdf: 'HKDF-SHA256',
    aead: 'AES-128-GCM',
    signature: 'Ed25519 + ML-DSA-65',
    referenceId: 'draft-ietf-mls-combiner-02',
  },
]

export const MLS_LIBRARY_REFS = [
  'RFC 9420',
  'RFC 9180',
  'draft-ietf-mls-pq-ciphersuites-04',
  'draft-ietf-mls-combiner-02',
  'draft-ietf-mls-extensions-09',
]

/**
 * Where each `OpenMlsCrypto` operation runs in the
 * `openmls_pqctoday_crypto` provider (Phase 2 status, 2026-05-16).
 */
export interface CryptoRouting {
  op: string
  pkcs11Mechanism: string
  hsmResident: boolean
  notes: string
}

export const CRYPTO_ROUTING: CryptoRouting[] = [
  {
    op: 'hash',
    pkcs11Mechanism: 'CKM_SHA256 / SHA384 / SHA512',
    hsmResident: true,
    notes: 'C_DigestInit + C_Digest',
  },
  {
    op: 'hmac',
    pkcs11Mechanism: 'CKM_SHA256_HMAC',
    hsmResident: true,
    notes: 'Session-only generic-secret key, destroyed after each MAC',
  },
  {
    op: 'hkdf_extract / hkdf_expand',
    pkcs11Mechanism: 'CKM_*_HMAC (RFC 5869 over HSM HMAC)',
    hsmResident: true,
    notes: 'Every HMAC round executes in the token',
  },
  {
    op: 'aead_encrypt / aead_decrypt',
    pkcs11Mechanism: 'CKM_AES_GCM',
    hsmResident: true,
    notes: 'Session-only AES key for each operation',
  },
  {
    op: 'signature_key_gen',
    pkcs11Mechanism: 'CKM_EC_EDWARDS_KEY_PAIR_GEN / CKM_EC_KEY_PAIR_GEN',
    hsmResident: true,
    notes: 'Token object with CKA_SENSITIVE=TRUE, CKA_EXTRACTABLE=FALSE',
  },
  {
    op: 'sign / verify_signature',
    pkcs11Mechanism: 'CKM_EDDSA / CKM_ECDSA_SHA*',
    hsmResident: true,
    notes: 'Provider returns an opaque HsmKeyHandle, not key material',
  },
  {
    op: 'HPKE (DhKem25519 + SHA-256 + AES-128-GCM)',
    pkcs11Mechanism: 'CKM_ECDH1_DERIVE + CKM_SHA256_HMAC + CKM_AES_GCM',
    hsmResident: true,
    notes: 'RFC 9180 reimplementation over PKCS#11 primitives',
  },
  {
    op: 'HPKE (other suites)',
    pkcs11Mechanism: 'hpke-rs-rust-crypto (fallback)',
    hsmResident: false,
    notes: 'Phase 2.1 — generalise PKCS#11 path to P-256/P-384/P-521/ChaCha20',
  },
]

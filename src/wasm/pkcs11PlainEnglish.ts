// SPDX-License-Identifier: GPL-3.0-only
// Short plain-English translations for PKCS#11 function calls, used by
// Pkcs11LogPanel's Beginner mode. Keep each phrase to 4–8 words; never
// replace or hide the raw fn / args / rv fields.

type Translator = (args: string) => string

const byFn: Record<string, Translator> = {
  C_Initialize: () => 'initialize PKCS#11 library',
  C_Finalize: () => 'shut down PKCS#11 library',
  C_OpenSession: () => 'open a session with the token',
  C_CloseSession: () => 'close the session',
  C_Login: () => 'authenticate to the token',
  C_Logout: () => 'log out of the token',

  C_GenerateKeyPair: (args) => {
    if (/ML[-_]KEM/i.test(args)) return 'generate ML-KEM keypair (PQC)'
    if (/ML[-_]DSA/i.test(args)) return 'generate ML-DSA signing keypair (PQC)'
    if (/MONTGOMERY|X25519/i.test(args)) return 'generate X25519 keypair'
    if (/P[-_]?256|SECP256/i.test(args)) return 'generate P-256 keypair'
    if (/ED25519/i.test(args)) return 'generate Ed25519 signing keypair'
    if (/RSA/i.test(args)) return 'generate RSA keypair'
    return 'generate a new keypair'
  },

  C_GenerateKey: (args) => {
    if (/AES/i.test(args)) return 'generate a symmetric AES key'
    if (/HMAC|SHA/i.test(args)) return 'generate an HMAC key'
    return 'generate a symmetric key'
  },

  C_DeriveKey: (args) => {
    if (/ECDH1_DERIVE/i.test(args)) return 'derive shared secret via ECDH'
    if (/HKDF/i.test(args)) return 'derive key via HKDF'
    return 'derive a key from another key'
  },

  C_WrapKey: () => 'wrap (export) a key under another key',
  C_UnwrapKey: () => 'unwrap (import) a wrapped key',

  C_EncryptInit: (args) => {
    if (/AES[-_]?CTR/i.test(args)) return 'prepare AES-CTR encryption'
    if (/AES[-_]?GCM/i.test(args)) return 'prepare AES-GCM encryption'
    if (/AES/i.test(args)) return 'prepare AES encryption'
    return 'prepare encryption'
  },
  C_Encrypt: () => 'encrypt the buffer in one shot',
  C_EncryptUpdate: () => 'encrypt more data (streaming)',
  C_EncryptFinal: () => 'finalize encryption',

  C_DecryptInit: (args) => {
    if (/AES[-_]?CTR/i.test(args)) return 'prepare AES-CTR decryption'
    if (/AES[-_]?GCM/i.test(args)) return 'prepare AES-GCM decryption'
    if (/AES/i.test(args)) return 'prepare AES decryption'
    return 'prepare decryption'
  },
  C_Decrypt: () => 'decrypt the buffer in one shot',
  C_DecryptUpdate: () => 'decrypt more data (streaming)',
  C_DecryptFinal: () => 'finalize decryption',

  C_SignInit: (args) => {
    if (/HMAC/i.test(args)) return 'prepare HMAC computation'
    if (/ML[-_]DSA/i.test(args)) return 'prepare ML-DSA signature (PQC)'
    if (/ECDSA/i.test(args)) return 'prepare ECDSA signature'
    if (/ED25519/i.test(args)) return 'prepare Ed25519 signature'
    return 'prepare signing'
  },
  C_Sign: (args) => {
    if (/HMAC/i.test(args)) return 'compute HMAC tag'
    return 'produce a signature'
  },
  C_SignUpdate: () => 'hash more data to sign',
  C_SignFinal: () => 'finalize the signature',

  C_VerifyInit: () => 'prepare signature verification',
  C_Verify: () => 'verify a signature',
  C_VerifyUpdate: () => 'hash more data to verify',
  C_VerifyFinal: () => 'finalize verification',

  C_DigestInit: (args) => {
    if (/SHA3[-_]?256/i.test(args)) return 'prepare SHA3-256 digest'
    if (/SHA[-_]?256/i.test(args)) return 'prepare SHA-256 digest'
    if (/SHA/i.test(args)) return 'prepare hash digest'
    return 'prepare hashing'
  },
  C_Digest: () => 'hash the buffer in one shot',
  C_DigestUpdate: () => 'hash more data (streaming)',
  C_DigestFinal: () => 'finalize the hash',

  C_EncapsulateKey: () => 'ML-KEM encapsulate (produce PQC ciphertext + secret)',
  C_DecapsulateKey: () => 'ML-KEM decapsulate (recover secret from ciphertext)',

  C_FindObjectsInit: () => 'start an object search',
  C_FindObjects: () => 'list matching objects',
  C_FindObjectsFinal: () => 'end the object search',
  C_GetAttributeValue: () => 'read attributes of an object',
  C_SetAttributeValue: () => 'update attributes of an object',
  C_DestroyObject: () => 'delete an object from the token',
  C_CreateObject: () => 'import an object into the token',
  C_GenerateRandom: () => 'ask the HSM for random bytes',
  C_SeedRandom: () => 'add entropy to the HSM RNG',
}

export function pkcs11PlainEnglish(fn: string, args: string = ''): string {
  const translator = Object.prototype.hasOwnProperty.call(byFn, fn) ? byFn[fn] : undefined
  return translator ? translator(args) : ''
}

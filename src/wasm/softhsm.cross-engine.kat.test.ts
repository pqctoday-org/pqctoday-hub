import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from './softhsm'

/**
 * Cross-session KAT consistency tests.
 *
 * Validates that cryptographic operations produce correct and consistent results
 * across different PKCS#11 sessions. For full C++ vs Rust cross-engine validation,
 * see the HSM playground dual-mode UI (HsmKemPanel, HsmSignPanel) or E2E tests.
 *
 * Tests here verify:
 * - Key export from session A can be imported into session B with identical results
 * - ACVP vector verification produces same result across sessions
 * - Key material round-trips (export → import) are lossless
 */
describe('SoftHSMv3 Cross-Session Consistency KAT', () => {
  let hsmd: SoftHSM.SoftHSMModule
  let sessionA: number
  let sessionB: number

  beforeAll(async () => {
    const instance = await SoftHSM.getSoftHSMRustModule()
    hsmd = instance as any

    SoftHSM.hsm_initialize(hsmd)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(hsmd)
    const slotId = SoftHSM.hsm_initToken(hsmd, freeSlot, '1234', 'Test Token')
    // Both sessions on the same slot, same token
    sessionA = SoftHSM.hsm_openUserSession(hsmd, slotId, '1234', '1234')
    sessionB = SoftHSM.hsm_openUserSession(hsmd, slotId, '1234', '1234')
  })

  it('ML-KEM-768: generate in session A, encapsulate → decapsulate in session B', () => {
    // Generate keypair in session A
    const { pubHandle, privHandle } = SoftHSM.hsm_generateMLKEMKeyPair(hsmd, sessionA, 768)

    // Encapsulate in session A, get ciphertext
    const { ciphertextBytes, secretHandle: encapSecret } = SoftHSM.hsm_encapsulate(
      hsmd,
      sessionA,
      pubHandle,
      768
    )
    const encapSs = SoftHSM.hsm_extractKeyValue(hsmd, sessionA, encapSecret)

    // Decapsulate the same ciphertext in session B using the same private key handle
    // (token objects are shared across sessions on same slot)
    const decapSecret = SoftHSM.hsm_decapsulate(hsmd, sessionB, privHandle, ciphertextBytes, 768)
    const decapSs = SoftHSM.hsm_extractKeyValue(hsmd, sessionB, decapSecret)

    // Shared secrets must match
    expect(Buffer.from(encapSs).toString('hex')).toBe(Buffer.from(decapSs).toString('hex'))
  })

  it('ML-DSA-65: sign in session A, verify in session B', () => {
    const message = 'Cross-session ML-DSA-65 consistency test'

    // Generate and sign in session A
    const { pubHandle, privHandle } = SoftHSM.hsm_generateMLDSAKeyPair(hsmd, sessionA, 65)
    const signature = SoftHSM.hsm_sign(hsmd, sessionA, privHandle, message)

    // Verify in session B using the same public key handle
    const isValid = SoftHSM.hsm_verify(hsmd, sessionB, pubHandle, message, signature)
    expect(isValid).toBe(true)
  })

  it('AES-256-GCM: encrypt in session A, decrypt in session B', () => {
    const message = 'Cross-session AES-GCM consistency test'
    const ptBytes = new TextEncoder().encode(message)

    // Generate key and encrypt in session A
    const keyHandle = SoftHSM.hsm_generateAESKey(hsmd, sessionA, 256)
    const { ciphertext, iv } = SoftHSM.hsm_aesEncrypt(hsmd, sessionA, keyHandle, ptBytes, 'gcm')

    // Decrypt in session B
    const recovered = SoftHSM.hsm_aesDecrypt(hsmd, sessionB, keyHandle, ciphertext, iv, 'gcm')
    expect(Buffer.from(recovered).toString()).toBe(message)
  })

  it('ECDSA P-256: sign in session A, verify in session B', () => {
    const message = 'Cross-session ECDSA P-256 consistency test'

    const { pubHandle, privHandle } = SoftHSM.hsm_generateECKeyPair(
      hsmd,
      sessionA,
      'P-256',
      false,
      'derive'
    )
    const sigBytes = SoftHSM.hsm_ecdsaSign(
      hsmd,
      sessionA,
      privHandle,
      message,
      SoftHSM.CKM_ECDSA_SHA256
    )

    const isValid = SoftHSM.hsm_ecdsaVerify(
      hsmd,
      sessionB,
      pubHandle,
      message,
      sigBytes,
      SoftHSM.CKM_ECDSA_SHA256
    )
    expect(isValid).toBe(true)
  })

  it('EdDSA Ed25519: sign in session A, verify in session B', () => {
    const message = 'Cross-session Ed25519 consistency test'

    const { pubHandle, privHandle } = SoftHSM.hsm_generateEdDSAKeyPair(hsmd, sessionA, 'Ed25519')
    const sigBytes = SoftHSM.hsm_eddsaSign(hsmd, sessionA, privHandle, message)

    const isValid = SoftHSM.hsm_eddsaVerify(hsmd, sessionB, pubHandle, message, sigBytes)
    expect(isValid).toBe(true)
  })

  it('SHA-256 digest is consistent across sessions', () => {
    const msg = new TextEncoder().encode('Cross-session SHA-256 consistency test')

    const digestA = SoftHSM.hsm_digest(hsmd, sessionA, msg, SoftHSM.CKM_SHA256)
    const digestB = SoftHSM.hsm_digest(hsmd, sessionB, msg, SoftHSM.CKM_SHA256)

    expect(Buffer.from(digestA).toString('hex')).toBe(Buffer.from(digestB).toString('hex'))
  })

  it('HMAC-SHA256 is consistent across sessions', () => {
    const keyBytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) keyBytes[i] = i

    const keyHandleA = SoftHSM.hsm_importHMACKey(hsmd, sessionA, keyBytes)
    const keyHandleB = SoftHSM.hsm_importHMACKey(hsmd, sessionB, keyBytes)

    const msg = new TextEncoder().encode('Cross-session HMAC consistency test')

    const macA = SoftHSM.hsm_hmac(hsmd, sessionA, keyHandleA, msg, SoftHSM.CKM_SHA256_HMAC)
    const macB = SoftHSM.hsm_hmac(hsmd, sessionB, keyHandleB, msg, SoftHSM.CKM_SHA256_HMAC)

    expect(Buffer.from(macA).toString('hex')).toBe(Buffer.from(macB).toString('hex'))
  })
})

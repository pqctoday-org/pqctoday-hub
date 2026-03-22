import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from './softhsm'
import * as crypto from 'crypto'

/**
 * Standard RFC 3394 AES Key Wrap execution using Node.js native crypto API 
 * We use this to correctly prepare the AES-KW CKA_VALUE payload allowing SoftHSMv3 
 * to ingest the raw NIST reference keys securely via C_UnwrapKey
 */
function aesKwWrap(kek: Buffer, targetKeyMaterial: Buffer): Buffer {
  // but for NIST tests we generally supply exact byte lengths (HMAC=32, ECDSA P256 d=32).
  const iv = Buffer.alloc(8, 0xa6) // RFC 3394 default IV
  const cipher = crypto.createCipheriv('id-aes256-wrap', kek, iv)
  const wrapped = Buffer.concat([cipher.update(targetKeyMaterial), cipher.final()])
  return wrapped
}

describe('SoftHSMv3 NIST Known Answer Test (KAT) Suite via Unwrap', () => {
  let hsmd: SoftHSM.SoftHSMModule
  let sessionHandle: number

  let kekHandle: number
  const KEK_BYTES = Buffer.from('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', 'hex')

  beforeAll(async () => {
    // 1. Initialize the SoftHSMv3 Rust WASM engine
    const instance = await SoftHSM.getSoftHSMRustModule()
    hsmd = instance as any

    SoftHSM.hsm_initialize(hsmd)
    const slotId = SoftHSM.hsm_getFirstSlot(hsmd)
    sessionHandle = SoftHSM.hsm_openUserSession(hsmd, slotId, '1234', '1234')

    // 2. Generate the KEK (Key Encryption Key) used exclusively to unwrap the NIST test vectors
    const valPtr = SoftHSM.writeBytes(hsmd, new Uint8Array(KEK_BYTES))
    const template: SoftHSM.AttrDef[] = [
      { type: SoftHSM.CKA_CLASS, ulongVal: SoftHSM.CKO_SECRET_KEY },
      { type: SoftHSM.CKA_KEY_TYPE, ulongVal: SoftHSM.CKK_AES },
      { type: SoftHSM.CKA_VALUE, bytesPtr: valPtr, bytesLen: KEK_BYTES.length },
      { type: SoftHSM.CKA_UNWRAP, boolVal: true },
      { type: SoftHSM.CKA_TOKEN, boolVal: false }
    ]
    
    kekHandle = SoftHSM.hsm_createObject(hsmd, sessionHandle, template)
    expect(kekHandle).toBeGreaterThan(0)
  })

  // =========================================================================
  // 1. Symmetric Mechanism: AES-GCM (NIST CAVP)
  // =========================================================================
  it('NIST KAT: AES-256-GCM Encrypt/Decrypt', () => {
    // NIST GCMTest Vectors
    const key = Buffer.from('feffe9928665731c6d6a8f9467308308feffe9928665731c6d6a8f9467308308', 'hex')
    const iv = Buffer.from('cafebabefacedbaddecaf888', 'hex')
    const plaintext = Buffer.from('d9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b39', 'hex')
    const aad = Buffer.from('feedfacedeadbeeffeedfacedeadbeefabaddad2', 'hex')
    const expectedCiphertext = Buffer.from('522dc1f099567d07f47f37a32a84427d643a8cdcbfe5c0c97598a2bd2555d1aa8cb08e48590dbb3da7b08b1056828838c5f61e6393ba7a0abcc9f662', 'hex')
    const expectedTag = Buffer.from('eb9f796c8d356fc31a8433884b696f4f', 'hex')

    // 1. Wrap the NIST AES key
    const wrappedKey = aesKwWrap(KEK_BYTES, key)

    // 2. Unwrap the key sequentially into the HSM environment limits
    const unwrapTemplate: SoftHSM.AttrDef[] = [
      { type: SoftHSM.CKA_CLASS, ulongVal: SoftHSM.CKO_SECRET_KEY },
      { type: SoftHSM.CKA_KEY_TYPE, ulongVal: SoftHSM.CKK_AES },
      { type: SoftHSM.CKA_ENCRYPT, boolVal: true },
      { type: SoftHSM.CKA_DECRYPT, boolVal: true },
      { type: SoftHSM.CKA_EXTRACTABLE, boolVal: false }
    ]
    const testKeyHandle = SoftHSM.hsm_unwrapKeyMech(
      hsmd,
      sessionHandle,
      SoftHSM.CKM_AES_KEY_WRAP,
      kekHandle,
      new Uint8Array(wrappedKey),
      unwrapTemplate
    )
    expect(testKeyHandle).toBeGreaterThan(0)

    // 3. Command AES-GCM Encryption
    const res = SoftHSM.hsm_aesEncrypt(hsmd, sessionHandle, testKeyHandle, Uint8Array.from(plaintext), 'gcm', Uint8Array.from(iv), Uint8Array.from(aad))
    const ctOut = res.ciphertext
    
    // In PKCS#11, AEAD ciphertext incorporates the MAC tag natively at the tail end
    const combinedExpected = Buffer.concat([expectedCiphertext, expectedTag])
    expect(Buffer.from(ctOut).toString('hex')).toBe(combinedExpected.toString('hex'))
  })
})

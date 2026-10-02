import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as SoftHSM from './softhsm'
import {
  hsm_generateECKeyPair,
  hsm_ecdsaSign,
  hsm_ecdsaVerify,
  ecCurveOID,
} from './softhsm/classical'
import { EC_OID_SECP256K1 } from './softhsm/constants'

describe('SoftHSMv3 secp256k1 Known Answer Tests', () => {
  let M: SoftHSM.SoftHSMModule
  let hSession: number

  beforeAll(async () => {
    // Load module and open test session
    const instance = await SoftHSM.getSoftHSMRustModule()
    M = instance as any

    // A logged-in user session: the key pair's private half is private
    // (CKA_PRIVATE=TRUE), and PKCS#11 v3.2 Usage Guide Table 3 only lets a
    // user session create — or see — private objects. The previous raw
    // C_OpenSession on slot 0 without a token or login made the private key
    // invisible to its own session (C_SignInit -> CKR_KEY_HANDLE_INVALID).
    SoftHSM.hsm_initialize(M)
    const slot = SoftHSM.hsm_getFirstSlot(M)
    const initializedSlot = SoftHSM.hsm_initToken(M, slot, '12345678', 'secp256k1KAT')
    hSession = SoftHSM.hsm_openUserSession(M, initializedSlot, '12345678', 'user1234')
  })

  afterAll(() => {
    if (M && hSession) {
      M._C_CloseSession(hSession)
      M._C_Finalize(0)
    }
  })

  it('Maps secp256k1 to the correct DER OID', () => {
    const oid = ecCurveOID('secp256k1')
    expect(oid).toEqual(EC_OID_SECP256K1)
    expect(Array.from(oid)).toEqual([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x0a])
  })

  it('Generates a secp256k1 keypair via softhsm Rust engine', () => {
    const keys = hsm_generateECKeyPair(M, hSession, 'secp256k1', false, 'sign')
    expect(keys.pubHandle).toBeGreaterThan(0)
    expect(keys.privHandle).toBeGreaterThan(0)
  })

  // Was it.todo: C_SignInit returned CKR_KEY_HANDLE_INVALID. The cause was
  // this suite's session, not the sign path — the private key (CKA_PRIVATE=
  // TRUE) was created in an unauthenticated session, which then could not see
  // it. With the user session above, sign + verify work (2026-10-02).
  it('Signs and verifies ECDSA-SHA256 with secp256k1', () => {
    const keys = hsm_generateECKeyPair(M, hSession, 'secp256k1', false, 'sign')
    const msg = 'Bitcoin Transaction Data Hash Placeholder'

    const signature = hsm_ecdsaSign(M, hSession, keys.privHandle, msg)
    expect(signature.length).toBeGreaterThan(60) // secp256k1 raw sig ≈ 64 bytes

    const verified = hsm_ecdsaVerify(M, hSession, keys.pubHandle, msg, signature)
    expect(verified).toBe(true)
  })
})

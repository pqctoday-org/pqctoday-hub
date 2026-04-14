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

    const hSessionPtr = M._malloc(4)
    M._C_Initialize(0)

    // Default slot 0
    M._C_OpenSession(0, 0x0002 | 0x0004, 0, 0, hSessionPtr)
    hSession = new Uint32Array(M.HEAPU8.buffer, hSessionPtr, 1)[0]
    M._free(hSessionPtr)
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

  it('Signs and verifies ECDSA-SHA256 with secp256k1', () => {
    const keys = hsm_generateECKeyPair(M, hSession, 'secp256k1', false, 'sign')
    const msg = 'Bitcoin Transaction Data Hash Placeholder'

    const signature = hsm_ecdsaSign(M, hSession, keys.privHandle, msg)
    expect(signature.length).toBeGreaterThan(60) // secp256k1 raw sig ≈ 64 bytes

    const verified = hsm_ecdsaVerify(M, hSession, keys.pubHandle, msg, signature)
    expect(verified).toBe(true)
  })
})

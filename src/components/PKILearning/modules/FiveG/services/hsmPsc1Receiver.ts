// SPDX-License-Identifier: AGPL-3.0-only
import {
  CKM_SHA256,
  CKM_SHA3_256,
  CKM_SHA3_256_HMAC,
  hsm_aesDecrypt,
  hsm_digest,
  hsm_ecdhDerive,
  hsm_extractKeyValue,
  hsm_hmac,
  hsm_importAESKey,
  hsm_importHMACKey,
  hsm_pqcDecap,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import type { Psc1ReceiverPrimitives } from './pscEnvelope'

/**
 * Profile C receiver primitives backed by a SoftHSM engine. The home network's private keys are
 * the two handles; nothing else from the sender's side is passed in.
 */
export function hsmPsc1Receiver(
  M: SoftHSMModule,
  hSession: number,
  keys: { mlKemPrivHandle: number; x25519PrivHandle?: number },
  onSecret?: (handle: number, label: string) => void
): Psc1ReceiverPrimitives {
  return {
    mlKem768Decapsulate: (ciphertext) => {
      const handle = hsm_pqcDecap(M, hSession, keys.mlKemPrivHandle, ciphertext, 'ML-KEM-768')
      onSecret?.(handle, 'Z_kem (Decapsulated)')
      return hsm_extractKeyValue(M, hSession, handle)
    },
    x25519Derive: (peer) => {
      if (keys.x25519PrivHandle === undefined)
        throw new Error('Home-network X25519 private key handle is not available')
      const handle = hsm_ecdhDerive(
        M,
        hSession,
        keys.x25519PrivHandle,
        peer,
        undefined,
        undefined,
        {
          keyLen: 32,
          derive: true,
          extractable: true,
        }
      )
      return hsm_extractKeyValue(M, hSession, handle)
    },
    sha256: (data) => hsm_digest(M, hSession, data, CKM_SHA256),
    sha3_256: (data) => hsm_digest(M, hSession, data, CKM_SHA3_256),
    hmacSha3_256: (key, data) =>
      hsm_hmac(M, hSession, hsm_importHMACKey(M, hSession, key), data, CKM_SHA3_256_HMAC),
    aes256CtrZeroIv: (key, data) =>
      hsm_aesDecrypt(
        M,
        hSession,
        hsm_importAESKey(M, hSession, key),
        data,
        new Uint8Array(16),
        'ctr'
      ),
  }
}

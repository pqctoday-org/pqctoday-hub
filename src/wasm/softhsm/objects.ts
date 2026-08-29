import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { CKA_PUBLIC_KEY_INFO } from './constants'
import { buildTemplate, checkRV, freeTemplate, readUlong } from './helpers'

// ── SPKI public key extraction (PKCS#11 v3.2) ───────────────────────────────

/**
 * Extract SPKI-encoded public key via C_GetAttributeValue(CKA_PUBLIC_KEY_INFO).
 * Returns the DER-encoded SubjectPublicKeyInfo bytes.
 */
export const hsm_getPublicKeyInfo = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number
): Uint8Array => {
  const lenTpl = buildTemplate(M, [{ type: CKA_PUBLIC_KEY_INFO }])
  checkRV(
    M._C_GetAttributeValue(hSession, pubHandle, lenTpl.ptr, 1),
    'C_GetAttributeValue(PUBLIC_KEY_INFO,len)'
  )
  const len = readUlong(M, lenTpl.ptr + 8)
  freeTemplate(M, lenTpl, 1)

  const valPtr = M._malloc(len)
  const valTpl = buildTemplate(M, [{ type: CKA_PUBLIC_KEY_INFO, bytesPtr: valPtr, bytesLen: len }])
  try {
    checkRV(
      M._C_GetAttributeValue(hSession, pubHandle, valTpl.ptr, 1),
      'C_GetAttributeValue(PUBLIC_KEY_INFO)'
    )
    return M.HEAPU8.slice(valPtr, valPtr + len)
  } finally {
    freeTemplate(M, valTpl, 1)
    M._free(valPtr)
  }
}

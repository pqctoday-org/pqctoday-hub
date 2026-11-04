// SPDX-License-Identifier: AGPL-3.0-only
import { Pkcs11Error } from '@/wasm/softhsm'
import { CKR_ATTRIBUTE_SENSITIVE } from '@/wasm/softhsm/constants'
/**
 * Bounded observation of the existing wrapper's C_GetAttributeValue call.
 * A failed session or a different refusal is not evidence of key sensitivity.
 * Keep the wrapper/engine API unchanged; checkRV supplies the operation and RV.
 */
export function requireProtectedKeyReadRefusal(readValue: () => Uint8Array): string {
  try {
    readValue()
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    if (
      error instanceof Pkcs11Error &&
      error.rv === CKR_ATTRIBUTE_SENSITIVE &&
      (error.fn === 'C_GetAttributeValue(len)' || error.fn === 'C_GetAttributeValue')
    ) {
      return 'Sample plaintext-read refusal observed: C_GetAttributeValue returned CKR_ATTRIBUTE_SENSITIVE (0x00000011). This check does not establish the wrapping/export policy.'
    }
    throw new Error(`Protected-key read check incomplete: ${detail}`)
  }
  throw new Error(
    'Protected-key read check failed: reading CKA_VALUE unexpectedly succeeded. The expected protection refusal was not observed.'
  )
}

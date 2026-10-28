// ONE log-entry type for the whole app — the canonical definition lives in
// ../softhsm.ts (it carries `isStepHeader` and `origin`, which the copy that
// used to sit here silently lacked). Type-only import, so the softhsm.ts ↔
// softhsm/logging.ts reference is erased at runtime and cannot cycle.
import type { Pkcs11LogEntry } from '../softhsm'

export type { Pkcs11LogEntry }

// ── PKCS#11 return-value names ──────────────────────────────────────────────
// The call logger itself (createLoggingProxy) lives in ../softhsm.ts — one
// copy. The second one that used to sit here silently skipped
// C_GetAttributeValue, so the one workshop importing it showed a different
// log from every other surface.

const RV_NAMES: Record<number, string> = {
  0x00000000: 'CKR_OK',
  0x00000001: 'CKR_CANCEL',
  0x00000002: 'CKR_HOST_MEMORY',
  0x00000003: 'CKR_SLOT_ID_INVALID',
  0x00000005: 'CKR_GENERAL_ERROR',
  0x00000006: 'CKR_FUNCTION_FAILED',
  0x00000007: 'CKR_ARGUMENTS_BAD',
  0x00000011: 'CKR_ATTRIBUTE_SENSITIVE',
  0x00000012: 'CKR_ATTRIBUTE_TYPE_INVALID',
  0x00000013: 'CKR_ATTRIBUTE_VALUE_INVALID',
  0x00000020: 'CKR_DATA_INVALID',
  0x00000021: 'CKR_DATA_LEN_RANGE',
  0x00000030: 'CKR_DEVICE_ERROR',
  0x00000042: 'CKR_AEAD_DECRYPT_FAILED',
  0x00000054: 'CKR_FUNCTION_NOT_SUPPORTED',
  0x00000060: 'CKR_KEY_HANDLE_INVALID',
  0x00000062: 'CKR_KEY_SIZE_RANGE',
  0x00000063: 'CKR_KEY_TYPE_INCONSISTENT',
  0x00000068: 'CKR_KEY_FUNCTION_NOT_PERMITTED',
  0x00000070: 'CKR_MECHANISM_INVALID',
  0x00000071: 'CKR_MECHANISM_PARAM_INVALID',
  0x00000082: 'CKR_OBJECT_HANDLE_INVALID',
  0x00000090: 'CKR_OPERATION_ACTIVE',
  0x00000091: 'CKR_OPERATION_NOT_INITIALIZED',
  0x000000a0: 'CKR_PIN_INCORRECT',
  0x000000a4: 'CKR_PIN_LOCKED',
  0x000000b0: 'CKR_SESSION_CLOSED',
  0x000000b3: 'CKR_SESSION_HANDLE_INVALID',
  0x000000b5: 'CKR_SESSION_READ_ONLY',
  0x000000b6: 'CKR_SESSION_EXISTS',
  0x000000c0: 'CKR_SIGNATURE_INVALID',
  0x000000c1: 'CKR_SIGNATURE_LEN_RANGE',
  0x000000d0: 'CKR_TEMPLATE_INCOMPLETE',
  0x000000d1: 'CKR_TEMPLATE_INCONSISTENT',
  0x000000e0: 'CKR_TOKEN_NOT_PRESENT',
  0x000000e2: 'CKR_TOKEN_WRITE_PROTECTED',
  0x000000f0: 'CKR_UNWRAPPING_KEY_HANDLE_INVALID',
  0x00000100: 'CKR_USER_ALREADY_LOGGED_IN',
  0x00000101: 'CKR_USER_NOT_LOGGED_IN',
  0x00000102: 'CKR_USER_PIN_NOT_INITIALIZED',
  0x00000103: 'CKR_USER_TYPE_INVALID',
  0x00000104: 'CKR_USER_ANOTHER_ALREADY_LOGGED_IN',
  0x00000110: 'CKR_WRAPPED_KEY_INVALID',
  0x00000112: 'CKR_WRAPPED_KEY_LEN_RANGE',
  0x00000113: 'CKR_WRAPPING_KEY_HANDLE_INVALID',
  0x00000130: 'CKR_DOMAIN_PARAMS_INVALID',
  0x00000140: 'CKR_CURVE_NOT_SUPPORTED',
  0x00000150: 'CKR_BUFFER_TOO_SMALL',
  0x00000190: 'CKR_CRYPTOKI_NOT_INITIALIZED',
  0x00000191: 'CKR_CRYPTOKI_ALREADY_INITIALIZED',
  0x000001b9: 'CKR_PUBLIC_KEY_INVALID',
  0x00000200: 'CKR_FUNCTION_REJECTED',
  0x00000201: 'CKR_TOKEN_RESOURCE_EXCEEDED',
  0x00000203: 'CKR_KEY_EXHAUSTED',
  0x00000209: 'CKR_PARAMETER_SET_NOT_SUPPORTED',
}

export const rvName = (rv: number): string =>
  RV_NAMES[rv] ?? `0x${rv.toString(16).padStart(8, '0')}`

export const fmtTime = (): string => {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

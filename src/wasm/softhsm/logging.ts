import type { type SoftHSMModule } from '@pqctoday/softhsm-wasm'

// ── PKCS#11 call log ─────────────────────────────────────────────────────────

export interface Pkcs11LogEntry {
  id: number
  timestamp: string // HH:MM:SS
  fn: string
  args: string
  rvHex: string
  rvName: string
  ms: number
  ok: boolean
  engineName?: string
  inspect?: import('./pkcs11Inspect').Pkcs11LogInspect
}

let _logId = 0

const RV_NAMES: Record<number, string> = {
  0x00000000: 'CKR_OK',
  0x00000001: 'CKR_CANCEL',
  0x00000002: 'CKR_HOST_MEMORY',
  0x00000003: 'CKR_SLOT_ID_INVALID',
  0x00000005: 'CKR_GENERAL_ERROR',
  0x00000006: 'CKR_FUNCTION_FAILED',
  0x00000007: 'CKR_ARGUMENTS_BAD',
  0x00000020: 'CKR_DATA_INVALID',
  0x00000030: 'CKR_DEVICE_ERROR',
  0x00000042: 'CKR_AEAD_DECRYPT_FAILED',
  0x00000054: 'CKR_FUNCTION_NOT_SUPPORTED',
  0x00000060: 'CKR_KEY_HANDLE_INVALID',
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
  0x00000113: 'CKR_WRAPPING_KEY_HANDLE_INVALID',
  0x00000130: 'CKR_DOMAIN_PARAMS_INVALID',
  0x00000140: 'CKR_CURVE_NOT_SUPPORTED',
  0x00000150: 'CKR_BUFFER_TOO_SMALL',
  0x00000190: 'CKR_CRYPTOKI_NOT_INITIALIZED',
  0x00000191: 'CKR_CRYPTOKI_ALREADY_INITIALIZED',
  0x00000200: 'CKR_FUNCTION_REJECTED',
  0x00000201: 'CKR_TOKEN_RESOURCE_EXCEEDED',
}

export const rvName = (rv: number): string =>
  RV_NAMES[rv] ?? `0x${rv.toString(16).padStart(8, '0')}`

export const fmtTime = (): string => {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

/**
 * PKCS#11 v3.2 parameter names per function (positional, first N params shown).
 * Sources: PKCS#11 v3.2 CSD01 §5, §6; FIPS 203/204 mechanism appendices.
 */
const PKCS11_PARAMS: Record<string, string[]> = {
  // Session management
  C_Initialize: ['pInitArgs'],
  C_Finalize: ['pReserved'],
  C_GetInfo: ['pInfo'],
  C_GetSlotList: ['tokenPresent', 'pSlotList', 'pulCount'],
  C_GetSlotInfo: ['slotID', 'pInfo'],
  C_GetTokenInfo: ['slotID', 'pInfo'],
  C_GetMechanismList: ['slotID', 'pMechanismList', 'pulCount'],
  C_GetMechanismInfo: ['slotID', 'type', 'pInfo'],
  C_InitToken: ['slotID', 'pPin', 'ulPinLen', 'pLabel'],
  C_InitPIN: ['hSession', 'pPin', 'ulPinLen'],
  C_SetPIN: ['hSession', 'pOldPin', 'ulOldLen', 'pNewPin'],
  C_OpenSession: ['slotID', 'flags', 'pApp', 'Notify', 'phSession'],
  C_CloseSession: ['hSession'],
  C_CloseAllSessions: ['slotID'],
  C_GetSessionInfo: ['hSession', 'pInfo'],
  C_Login: ['hSession', 'userType', 'pPin', 'ulPinLen'],
  C_Logout: ['hSession'],
  // Object management
  C_CreateObject: ['hSession', 'pTemplate', 'ulCount', 'phObject'],
  C_DestroyObject: ['hSession', 'hObject'],
  C_GetObjectSize: ['hSession', 'hObject', 'pulSize'],
  C_GetAttributeValue: ['hSession', 'hObject', 'pTemplate', 'ulCount'],
  C_SetAttributeValue: ['hSession', 'hObject', 'pTemplate', 'ulCount'],
  C_FindObjectsInit: ['hSession', 'pTemplate', 'ulCount'],
  C_FindObjects: ['hSession', 'phObject', 'ulMax', 'pulCount'],
  C_FindObjectsFinal: ['hSession'],
  // Key generation
  C_GenerateKey: ['hSession', 'pMechanism', 'pTemplate', 'ulCount'],
  C_GenerateKeyPair: ['hSession', 'pMechanism', 'pPubTemplate', 'ulPubCount'],
  C_WrapKey: ['hSession', 'pMechanism', 'hWrappingKey', 'hKey'],
  C_UnwrapKey: ['hSession', 'pMechanism', 'hUnwrappingKey', 'pWrapped'],
  C_DeriveKey: ['hSession', 'pMechanism', 'hBaseKey', 'pTemplate'],
  // Encryption
  C_EncryptInit: ['hSession', 'pMechanism', 'hKey'],
  C_Encrypt: ['hSession', 'pData', 'ulDataLen', 'pOut'],
  C_EncryptUpdate: ['hSession', 'pPart', 'ulPartLen', 'pOut'],
  C_EncryptFinal: ['hSession', 'pOut', 'pulOutLen'],
  C_DecryptInit: ['hSession', 'pMechanism', 'hKey'],
  C_Decrypt: ['hSession', 'pEncData', 'ulEncDataLen', 'pOut'],
  C_DecryptUpdate: ['hSession', 'pEncPart', 'ulEncPartLen', 'pOut'],
  C_DecryptFinal: ['hSession', 'pOut', 'pulOutLen'],
  // Digest
  C_DigestInit: ['hSession', 'pMechanism'],
  C_Digest: ['hSession', 'pData', 'ulDataLen', 'pDigest'],
  C_DigestUpdate: ['hSession', 'pPart', 'ulPartLen'],
  C_DigestFinal: ['hSession', 'pDigest', 'pulDigestLen'],
  // Sign / Verify
  C_SignInit: ['hSession', 'pMechanism', 'hKey'],
  C_Sign: ['hSession', 'pData', 'ulDataLen', 'pSignature'],
  C_SignUpdate: ['hSession', 'pPart', 'ulPartLen'],
  C_SignFinal: ['hSession', 'pSignature', 'pulSignatureLen'],
  C_VerifyInit: ['hSession', 'pMechanism', 'hKey'],
  C_Verify: ['hSession', 'pData', 'ulDataLen', 'pSignature'],
  C_VerifyUpdate: ['hSession', 'pPart', 'ulPartLen'],
  C_VerifyFinal: ['hSession', 'pSignature', 'ulSignatureLen'],
  // PKCS#11 v3.2 — PQC KEM (FIPS 203)
  C_EncapsulateKey: [
    'hSession',
    'pMechanism',
    'hPublicKey',
    'pTemplate',
    'ulAttributeCount',
    'pCiphertext',
    'pulCiphertextLen',
    'phKey',
  ],
  C_DecapsulateKey: [
    'hSession',
    'pMechanism',
    'hPrivateKey',
    'pTemplate',
    'ulAttributeCount',
    'pCiphertext',
    'ulCiphertextLen',
    'phKey',
  ],
  // PKCS#11 v3.0 — One-shot message signing (ML-DSA, SLH-DSA)
  C_MessageSignInit: ['hSession', 'pMechanism', 'hKey'],
  C_SignMessage: ['hSession', 'pParameter', 'ulParameterLen', 'pData'],
  C_MessageSignFinal: ['hSession'],
  C_MessageVerifyInit: ['hSession', 'pMechanism', 'hKey'],
  C_VerifyMessage: ['hSession', 'pParameter', 'ulParameterLen', 'pData'],
  C_MessageVerifyFinal: ['hSession'],
  // PKCS#11 v3.2 — Async / session ops
  C_SessionCancel: ['hSession', 'flags'],
  C_GetInterfaceList: ['pInterfacesList', 'pulCount'],
  C_GetInterface: ['pInterfaceName', 'pVersion', 'ppInterface', 'flags'],
  C_GetSessionValidationFlags: ['hSession', 'flags', 'pulFlags'],
  // PKCS#11 v3.2 — Session & admin
  C_LoginUser: ['hSession', 'pPin', 'ulPinLen', 'pUsername'],
  C_CopyObject: ['hSession', 'hObject', 'pTemplate', 'ulCount'],
  C_GenerateRandom: ['hSession', 'pRandomData', 'ulRandomLen'],
  C_SeedRandom: ['hSession', 'pSeed', 'ulSeedLen'],
  C_GetFunctionList: ['ppFunctionList'],
  C_GetFunctionStatus: ['hSession'],
  C_CancelFunction: ['hSession'],
  C_WaitForSlotEvent: ['flags', 'pSlot', 'pReserved'],
  C_GetOperationState: ['hSession', 'pOperationState', 'pulOperationStateLen'],
  C_SetOperationState: ['hSession', 'pOperationState', 'ulOperationStateLen', 'hEncryptionKey'],
  // PKCS#11 v3.0 — G2: one-shot message signing begin/next
  C_SignMessageBegin: ['hSession', 'pMechanism', 'hKey'],
  C_SignMessageNext: ['hSession', 'pParameter', 'ulParameterLen', 'pData'],
  C_VerifyMessageBegin: ['hSession', 'pMechanism', 'hKey'],
  C_VerifyMessageNext: ['hSession', 'pParameter', 'ulParameterLen', 'pData'],
  // PKCS#11 v3.0 — G3: AES-GCM message-based encrypt/decrypt
  C_MessageEncryptInit: ['hSession', 'pMechanism', 'hKey'],
  C_EncryptMessage: ['hSession', 'pParameter', 'ulParameterLen', 'pAssociatedData'],
  C_EncryptMessageBegin: ['hSession', 'pParameter', 'ulParameterLen', 'pAssociatedData'],
  C_EncryptMessageNext: ['hSession', 'pParameter', 'ulParameterLen', 'pPlaintextPart'],
  C_MessageEncryptFinal: ['hSession'],
  C_MessageDecryptInit: ['hSession', 'pMechanism', 'hKey'],
  C_DecryptMessage: ['hSession', 'pParameter', 'ulParameterLen', 'pAssociatedData'],
  C_DecryptMessageBegin: ['hSession', 'pParameter', 'ulParameterLen', 'pAssociatedData'],
  C_DecryptMessageNext: ['hSession', 'pParameter', 'ulParameterLen', 'pCiphertextPart'],
  C_MessageDecryptFinal: ['hSession'],
  // PKCS#11 v3.2 — G4: single-shot signature verify
  C_VerifySignatureInit: ['hSession', 'pMechanism', 'hKey'],
  C_VerifySignature: ['hSession', 'pData', 'ulDataLen', 'pSignature'],
  C_VerifySignatureUpdate: ['hSession', 'pPart', 'ulPartLen'],
  C_VerifySignatureFinal: ['hSession', 'pSignature', 'ulSignatureLen'],
  // PKCS#11 v3.2 — G5: authenticated key wrap/unwrap (AES-GCM)
  C_WrapKeyAuthenticated: ['hSession', 'pMechanism', 'hWrappingKey', 'hKey'],
  C_UnwrapKeyAuthenticated: ['hSession', 'pMechanism', 'hUnwrappingKey', 'pWrappedKey'],
  // Recover & compound operations
  C_SignRecover: ['hSession', 'pData', 'ulDataLen', 'pSignature'],
  C_SignRecoverInit: ['hSession', 'pMechanism', 'hKey'],
  C_VerifyRecover: ['hSession', 'pSignature', 'ulSignatureLen', 'pData'],
  C_VerifyRecoverInit: ['hSession', 'pMechanism', 'hKey'],
  C_DigestKey: ['hSession', 'hKey'],
  C_DigestEncryptUpdate: ['hSession', 'pPart', 'ulPartLen', 'pEncryptedPart'],
  C_DecryptDigestUpdate: ['hSession', 'pEncryptedPart', 'ulEncryptedPartLen', 'pPart'],
  C_SignEncryptUpdate: ['hSession', 'pPart', 'ulPartLen', 'pEncryptedPart'],
  C_DecryptVerifyUpdate: ['hSession', 'pEncryptedPart', 'ulEncryptedPartLen', 'pPart'],
  // PKCS#11 v3.2 — Async operations
  C_AsyncComplete: ['hSession', 'pOperation', 'pResult'],
  C_AsyncGetID: ['hSession', 'pulID'],
  C_AsyncJoin: ['hSession', 'pOperation'],
}

export const fmtArg = (v: unknown): string =>
  typeof v === 'number'
    ? v === 0
      ? '0'
      : v < 0x10000
        ? `0x${v.toString(16)}`
        : `0x${(v >>> 0).toString(16)}`
    : String(v)

export const fmtArgs = (fnName: string, args: unknown[]): string => {
  const names = PKCS11_PARAMS[fnName]
  if (!names) return args.slice(0, 4).map(fmtArg).join(', ')
  // Show up to 4 named params for readability; append '…' if more
  const shown = Math.min(4, args.length)
  const parts = Array.from(
    { length: shown },
    (_, i) => `${names[i] ?? `arg${i}`}=${fmtArg(args[i])}`
  )
  if (args.length > 4) parts.push('…')
  return parts.join(', ')
}

/**
 * Wraps a SoftHSMModule with a Proxy that intercepts all `_C_*` method calls,
 * logs them with PKCS#11 v3.2-spec parameter names, and returns the result unchanged.
 */
export const createLoggingProxy = (
  M: SoftHSMModule,
  onLog: (entry: Pkcs11LogEntry) => void,
  engineName?: string
): SoftHSMModule => {
  return new Proxy(M, {
    get(target, prop: string | symbol) {
      const val = (target as unknown as Record<string | symbol, unknown>)[prop]
      if (typeof prop === 'string' && prop.startsWith('_C_') && typeof val === 'function') {
        // Strip leading '_' to match the PKCS#11 v3.2 spec function name
        const specName = prop.slice(1) // e.g. 'C_EncapsulateKey'
        return (...args: unknown[]) => {
          const t0 = performance.now()
          try {
            const rv = (val as (...a: unknown[]) => number).apply(target, args)
            const ms = Math.round((performance.now() - t0) * 10) / 10
            const rvUnsigned = rv >>> 0
            const ok = rvUnsigned === 0 || rvUnsigned === 0x150 // CKR_OK or CKR_BUFFER_TOO_SMALL (size query)
            const inspect = buildInspect(target, specName, args as number[], rvUnsigned)
            onLog({
              id: ++_logId,
              timestamp: fmtTime(),
              fn: specName,
              args: fmtArgs(specName, args),
              rvHex: `0x${rvUnsigned.toString(16).padStart(8, '0')}`,
              rvName: rvName(rvUnsigned),
              ms,
              ok,
              engineName,
              inspect,
            })
            return rv
          } catch (err) {
            const ms = Math.round((performance.now() - t0) * 10) / 10
            onLog({
              id: ++_logId,
              timestamp: fmtTime(),
              fn: specName,
              args: fmtArgs(specName, args),
              rvHex: 'TRAP',
              rvName: err instanceof Error ? err.message : 'RuntimeError',
              ms,
              ok: false,
              engineName,
            })
            throw err
          }
        }
      }
      return val
    },
  })
}

import type { type SoftHSMModule } from '@pqctoday/softhsm-wasm'
import type { _WASM_VERSION } from '../pkcs11Inspect'

// ── Singleton loaders ────────────────────────────────────────────────────────
// Injected by Vite at build time — ensures WASM URLs are cache-busted on each release
declare const __WASM_HASH__: string | undefined
const _WASM_VERSION = typeof __WASM_HASH__ !== 'undefined' ? __WASM_HASH__ : Date.now().toString()

let cppModulePromise: Promise<SoftHSMModule> | null = null
let rustModulePromise: Promise<SoftHSMModule> | null = null

/**
 * Returns the SoftHSMv3 (C++) WASM module singleton.
 * On first call, injects a <script> tag to load /wasm/softhsm.js, then
 * calls window.createSoftHSMModule({ locateFile }) to instantiate the Emscripten WASM.
 */
export const getSoftHSMCppModule = async (): Promise<SoftHSMModule> => {
  if (!cppModulePromise) {
    cppModulePromise = (async () => {
      if (!document.querySelector('script[data-softhsm-cpp]')) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = `/wasm/softhsm.js?v=${_WASM_VERSION}`
          s.dataset.softhsmCpp = '1'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load /wasm/softhsm.js (C++)'))
          document.head.appendChild(s)
        })
      }
      const createFn = (globalThis as Record<string, unknown>)['createSoftHSMModule'] as
        | ((arg?: Record<string, unknown>) => Promise<SoftHSMModule>)
        | undefined
      if (!createFn) throw new Error('createSoftHSMModule not available after script load')
      return createFn({
        locateFile: (path: string) =>
          path.endsWith('.wasm') ? `/wasm/softhsm.wasm?v=${_WASM_VERSION}` : path,
      })
    })().catch((e) => {
      cppModulePromise = null
      throw e
    })
  }
  return cppModulePromise
}

/**
 * Returns the SoftHSMv3 (Rust) WASM module singleton.
 * Dynamically imports the `softhsmrustv3.js` wasm-bindgen shim and wraps its
 * InitOutput into the identical SoftHSMModule ABI interface.
 */
export const getSoftHSMRustModule = async (): Promise<SoftHSMModule> => {
  if (!rustModulePromise) {
    rustModulePromise = (async () => {
      const rustShim = await import('../softhsmrustv3.js')
      const isNode =
        typeof process !== 'undefined' && process.versions != null && process.versions.node != null
      let wasmInput: any = '/wasm/rust/softhsmrustv3_bg.wasm'
      if (isNode) {
        const fs = await import('fs')
        const path = await import('path')
        wasmInput = fs.readFileSync(
          path.resolve(process.cwd(), 'public/wasm/rust/softhsmrustv3_bg.wasm')
        )
      }
      const wasmExports = await rustShim.default(wasmInput)

      // Rust lib.rs uses #[wasm_bindgen(js_name = _C_*)] — exports match
      // the PKCS#11 v3.2 C ABI names directly on the InitOutput object.
      //
      // CKR_MECHANISM_INVALID (0x70) is returned by graceful stubs for
      // operations not yet implemented in the Rust binary.
      const CKR_NOT_IMPL = 0x70

      return {
        // ── Session management ────────────────────────────────────────────
        _C_Initialize: wasmExports._C_Initialize,
        _C_Finalize: wasmExports._C_Finalize,
        _C_GetInfo: () => 0,
        _C_GetFunctionList: () => 0,
        _C_GetSlotList: wasmExports._C_GetSlotList,
        _C_GetSlotInfo: () => 0,
        _C_GetTokenInfo: wasmExports._C_GetTokenInfo,
        _C_GetMechanismList: wasmExports._C_GetMechanismList,
        _C_GetMechanismInfo: wasmExports._C_GetMechanismInfo,
        _C_InitToken: wasmExports._C_InitToken,
        _C_InitPIN: wasmExports._C_InitPIN,
        _C_SetPIN: () => 0,
        _C_OpenSession: wasmExports._C_OpenSession,
        _C_CloseSession: wasmExports._C_CloseSession,
        _C_CloseAllSessions: () => 0,
        _C_GetSessionInfo: wasmExports._C_GetSessionInfo,
        _C_GetOperationState: () => CKR_NOT_IMPL,
        _C_SetOperationState: () => CKR_NOT_IMPL,
        _C_Login: wasmExports._C_Login,
        _C_Logout: wasmExports._C_Logout,
        _C_LoginUser: () => 0,
        _C_SessionCancel: () => 0,

        // ── Object management ─────────────────────────────────────────────
        _C_CreateObject: wasmExports._C_CreateObject,
        _C_CopyObject: () => CKR_NOT_IMPL,
        _C_DestroyObject: wasmExports._C_DestroyObject,
        _C_GetObjectSize: () => CKR_NOT_IMPL,
        _C_GetAttributeValue: wasmExports._C_GetAttributeValue,
        _C_SetAttributeValue: () => CKR_NOT_IMPL,
        _C_FindObjectsInit: wasmExports._C_FindObjectsInit,
        _C_FindObjects: wasmExports._C_FindObjects,
        _C_FindObjectsFinal: wasmExports._C_FindObjectsFinal,

        // ── Key generation ────────────────────────────────────────────────
        _C_GenerateKey: wasmExports._C_GenerateKey,
        _C_GenerateKeyPair: wasmExports._C_GenerateKeyPair,

        // ── ML-KEM encapsulate/decapsulate ────────────────────────────────
        _C_EncapsulateKey: wasmExports._C_EncapsulateKey,
        _C_DecapsulateKey: wasmExports._C_DecapsulateKey,

        // ── Encrypt/decrypt (AES, RSA OAEP) ──────────────────────────────
        _C_EncryptInit: wasmExports._C_EncryptInit,
        _C_Encrypt: wasmExports._C_Encrypt,
        _C_EncryptUpdate: () => CKR_NOT_IMPL,
        _C_EncryptFinal: () => CKR_NOT_IMPL,
        _C_DecryptInit: wasmExports._C_DecryptInit,
        _C_Decrypt: wasmExports._C_Decrypt,
        _C_DecryptUpdate: () => CKR_NOT_IMPL,
        _C_DecryptFinal: () => CKR_NOT_IMPL,

        // ── Sign/verify (ML-DSA, SLH-DSA, RSA, ECDSA, EdDSA, HMAC) ─────
        _C_SignInit: wasmExports._C_SignInit,
        _C_Sign: wasmExports._C_Sign,
        _C_SignUpdate: () => CKR_NOT_IMPL,
        _C_SignFinal: () => CKR_NOT_IMPL,
        _C_SignRecoverInit: () => CKR_NOT_IMPL,
        _C_SignRecover: () => CKR_NOT_IMPL,
        _C_VerifyInit: wasmExports._C_VerifyInit,
        _C_Verify: wasmExports._C_Verify,
        _C_VerifyUpdate: () => CKR_NOT_IMPL,
        _C_VerifyFinal: () => CKR_NOT_IMPL,
        _C_VerifyRecoverInit: () => CKR_NOT_IMPL,
        _C_VerifyRecover: () => CKR_NOT_IMPL,

        // ── Message-based sign/verify (PKCS#11 v3.2) ─────────────────────
        _C_MessageSignInit: wasmExports._C_MessageSignInit,
        _C_SignMessage: wasmExports._C_SignMessage,
        _C_SignMessageBegin: () => CKR_NOT_IMPL,
        _C_SignMessageNext: () => CKR_NOT_IMPL,
        _C_MessageSignFinal: wasmExports._C_MessageSignFinal,
        _C_MessageVerifyInit: wasmExports._C_MessageVerifyInit,
        _C_VerifyMessage: wasmExports._C_VerifyMessage,
        _C_VerifyMessageBegin: () => CKR_NOT_IMPL,
        _C_VerifyMessageNext: () => CKR_NOT_IMPL,
        _C_MessageVerifyFinal: wasmExports._C_MessageVerifyFinal,

        // ── Message-based encrypt/decrypt (stubs) ─────────────────────────
        _C_MessageEncryptInit: () => CKR_NOT_IMPL,
        _C_EncryptMessage: () => CKR_NOT_IMPL,
        _C_EncryptMessageBegin: () => CKR_NOT_IMPL,
        _C_EncryptMessageNext: () => CKR_NOT_IMPL,
        _C_MessageEncryptFinal: () => 0,
        _C_MessageDecryptInit: () => CKR_NOT_IMPL,
        _C_DecryptMessage: () => CKR_NOT_IMPL,
        _C_DecryptMessageBegin: () => CKR_NOT_IMPL,
        _C_DecryptMessageNext: () => CKR_NOT_IMPL,
        _C_MessageDecryptFinal: () => 0,

        // ── Digest ───────────────────────────────────────────────────────
        _C_DigestInit: wasmExports._C_DigestInit,
        _C_Digest: wasmExports._C_Digest,
        _C_DigestUpdate: wasmExports._C_DigestUpdate,
        _C_DigestKey: () => CKR_NOT_IMPL,
        _C_DigestFinal: wasmExports._C_DigestFinal,

        // ── Dual-function (stubs) ─────────────────────────────────────────
        _C_DigestEncryptUpdate: () => CKR_NOT_IMPL,
        _C_DecryptDigestUpdate: () => CKR_NOT_IMPL,
        _C_SignEncryptUpdate: () => CKR_NOT_IMPL,
        _C_DecryptVerifyUpdate: () => CKR_NOT_IMPL,

        // ── Key wrapping/unwrapping/derivation ───────────────────────────
        _C_WrapKey: wasmExports._C_WrapKey,
        _C_UnwrapKey: wasmExports._C_UnwrapKey,
        _C_DeriveKey: wasmExports._C_DeriveKey,
        _C_WrapKeyAuthenticated: wasmExports._C_WrapKeyAuthenticated,
        _C_UnwrapKeyAuthenticated: wasmExports._C_UnwrapKeyAuthenticated,

        // ── Random ───────────────────────────────────────────────────────
        _C_SeedRandom: () => 0,
        _C_GenerateRandom: wasmExports._C_GenerateRandom,

        // ── Misc (stubs) ──────────────────────────────────────────────────
        _C_GetFunctionStatus: () => CKR_NOT_IMPL,
        _C_CancelFunction: () => CKR_NOT_IMPL,
        _C_WaitForSlotEvent: () => CKR_NOT_IMPL,
        _C_GetInterfaceList: () => CKR_NOT_IMPL,
        _C_GetInterface: () => CKR_NOT_IMPL,
        _C_VerifySignatureInit: () => CKR_NOT_IMPL,
        _C_VerifySignature: () => CKR_NOT_IMPL,
        _C_VerifySignatureUpdate: () => CKR_NOT_IMPL,
        _C_VerifySignatureFinal: () => CKR_NOT_IMPL,
        _C_GetSessionValidationFlags: () => CKR_NOT_IMPL,
        _C_AsyncComplete: () => CKR_NOT_IMPL,
        _C_AsyncGetID: () => CKR_NOT_IMPL,
        _C_AsyncJoin: () => CKR_NOT_IMPL,

        // ── Emscripten-compat memory layer ────────────────────────────────
        _malloc: wasmExports._malloc,
        _free: (ptr: number) => wasmExports._free(ptr, 1),
        wasmMemory: { buffer: wasmExports.memory.buffer },
        HEAP32: new Int32Array(wasmExports.memory.buffer),
        FS: {
          mkdir: () => {},
          writeFile: () => {},
          readFile: () => new Uint8Array(0),
          mount: () => ({}),
          unmount: () => {},
        },
        UTF8ToString: () => '',
        stringToUTF8: () => 0,
        lengthBytesUTF8: () => 0,
        setValue: (ptr: number, val: number, type: string) => {
          const mem = new DataView(wasmExports.memory.buffer)
          if (type === 'i32') mem.setUint32(ptr, val, true)
        },
        getValue: (ptr: number, type: string) => {
          const mem = new DataView(wasmExports.memory.buffer)
          if (type === 'i32') return mem.getUint32(ptr, true)
          return 0
        },
        get HEAPU8() {
          return new Uint8Array(wasmExports.memory.buffer)
        },
      } as unknown as SoftHSMModule
    })().catch((e) => {
      rustModulePromise = null
      throw e
    })
  }
  return rustModulePromise
}

/** Reset singletons — call from PlaygroundProvider cleanup. */
export const clearSoftHSMCache = (): void => {
  cppModulePromise = null
  rustModulePromise = null
}

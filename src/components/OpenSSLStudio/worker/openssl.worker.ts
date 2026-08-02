// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable */
console.log('[Debug] OpenSSL Worker file executing...')
// import type { WorkerMessage } from './types' // REMOVED to avoid Module syntax

// Inline Types to keep this a "Script" (not a Module)
type WorkerMessage =
  | {
      type: 'COMMAND'
      command: string
      args: string[]
      files?: { name: string; data: Uint8Array }[]
      /**
       * When true, the provided `files` are treated as the COMPLETE filesystem:
       * the worker's persistent VFS is cleared before this command runs.
       * OpenSSL Studio sets this (it re-sends its whole file store on every
       * command, and its store — not the worker — is its source of truth, so a
       * file deleted in the Studio UI must not linger here as a ghost).
       * Callers that omit it get merge semantics: files persist across
       * COMMANDs, so chained calls (genpkey → pkey -in …) see each other's
       * outputs.
       */
      replaceVfs?: boolean
      requestId?: string
    }
  | { type: 'LOAD'; url: string; requestId?: string }
  | { type: 'FILE_UPLOAD'; name: string; data: Uint8Array; requestId?: string }
  | { type: 'DELETE_FILE'; name: string; requestId?: string }
  | { type: 'HSM_KEYGEN'; algorithm: string; keyId: string; requestId?: string }
  | {
      type: 'TLS_SIMULATE'
      clientConfig: string
      serverConfig: string
      files?: { name: string; data: Uint8Array }[]
      commands?: string[]
      requestId?: string
    }
  | {
      type: 'CMP_SIMULATE'
      eeKeyPath: string
      subjectDn: string
      reference: string
      secret: string
      caCertPath: string
      caKeyPath: string
      outCertPath: string
      files?: { name: string; data: Uint8Array }[]
      requestId?: string
    }
  | {
      type: 'GEN_CA_ROOT'
      algorithm: string
      subjectDn: string
      keyOutPath: string
      certOutPath: string
      days: number
      requestId?: string
    }
  | { type: 'READY'; requestId?: string }
  | { type: 'LOG'; stream: 'stdout' | 'stderr'; message: string; requestId?: string }
  | { type: 'ERROR'; error: string; requestId?: string }
  | { type: 'DONE'; requestId?: string }
  | {
      type: 'HSM_KEY_CREATED'
      keyId: string
      algorithm: string
      uri: string
      requestId?: string
    }
  | {
      type: 'SKEY_OPERATION'
      opType: 'create' | 'derive'
      params: any // Simplified for now
      requestId?: string
    }

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface EmscriptenModule {
  callMain: (args: string[]) => number
  FS: {
    writeFile: (path: string, data: Uint8Array) => void
    readFile: (path: string) => Uint8Array
    readdir: (path: string) => string[]
    unlink: (path: string) => void
    stat: (path: string) => any
    isFile: (mode: number) => boolean
    llseek: (stream: any, offset: number, whence: number) => any
    close: (stream: any) => void
    mkdir: (path: string) => void
  }
  ENV?: { [key: string]: string }
  cwrap: (ident: string, returnType: string | null, argTypes: string[]) => any
  _malloc: (size: number) => number
  _free: (ptr: number) => void
  HEAPU8: Uint8Array
}

interface ModuleConfig {
  noInitialRun: boolean
  print: (text: string) => void
  printErr: (text: string) => void
  locateFile: (path: string) => string
}

// ----------------------------------------------------------------------------
// Core Logic (Loader, Environment, Filesystem)
// ----------------------------------------------------------------------------

declare function importScripts(...urls: string[]): void
declare var createOpenSSLModule: any

var moduleFactory: any = null
var loadingPromise: Promise<void> | null = null

var loadOpenSSLScript = async (
  url: string = '/wasm/openssl.js',
  requestId?: string
): Promise<void> => {
  if (moduleFactory) return
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `[Debug] loadOpenSSLScript called with url: ${url}`,
      requestId,
    })

    try {
      // Shim module.exports to capture the factory if the script tries to use CommonJS
      const global = self as any
      // Only shim if not already defined, to avoid breaking things
      const originalModule = global.module
      const originalExports = global.exports

      if (!global.module) {
        global.module = { exports: {} }
      }
      if (!global.exports) {
        global.exports = global.module.exports
      }

      let loaded = false

      // Try importScripts (Classic Worker or Polyfilled)
      // Try dynamic import (for Module Workers)
      // Dynamic import removed to avoid Vite trying to bundle public assets
      // Falls back to importScripts or fetch+eval below

      if (!loaded && typeof importScripts === 'function') {
        try {
          importScripts(url)
          loaded = true
        } catch (e: any) {
          // In Module Workers, importScripts throws. This is expected.
          // We only warn if it's a different error.
          if (
            !e.message?.includes('Module scripts') &&
            !e.message?.includes('cannot be used if worker type is "module"')
          ) {
            console.warn('importScripts failed, falling back to fetch+eval:', e)
          } else {
            // Debug log only
            self.postMessage({
              type: 'LOG',
              stream: 'stdout',
              message: `[Debug] Skipped importScripts (Module Worker detected)`,
            })
          }
        }
      }

      // This worker is a Classic Worker (Script, not Module) — importScripts is required.
      // Do not fall back to eval: if importScripts failed or is unavailable, fail fast.
      if (!loaded) {
        throw new Error(
          'OpenSSL WASM script could not be loaded via importScripts. ' +
            'This worker must run as a Classic Worker (not a Module Worker). ' +
            'Check the worker instantiation in OpenSSLService.ts.'
        )
      }

      // Check for CommonJS export
      if (global.module.exports && typeof global.module.exports === 'function') {
        moduleFactory = global.module.exports
      } else if (global.module.exports && typeof global.module.exports.default === 'function') {
        moduleFactory = global.module.exports.default
      }
      // Check for global variable
      else if (typeof (self as any).createOpenSSLModule === 'function') {
        // @ts-ignore
        moduleFactory = self.createOpenSSLModule
      } else if (typeof createOpenSSLModule === 'function') {
        // @ts-ignore
        moduleFactory = createOpenSSLModule
      } else {
        // Restore originals if we messed them up and didn't find anything
        if (!originalModule) delete global.module
        if (!originalExports) delete global.exports
        throw new Error(
          'createOpenSSLModule not found in global scope or module.exports after load'
        )
      }

      // Cleanup shims if we created them
      if (!originalModule) delete global.module
      if (!originalExports) delete global.exports

      self.postMessage({
        type: 'LOG',
        stream: 'stdout',
        message: '[Debug] Script loaded successfully',
        requestId,
      })
    } catch (e: any) {
      self.postMessage({
        type: 'LOG',
        stream: 'stderr',
        message: `[Debug] importScripts failed: ${e.message}`,
        requestId,
      })
      // Critical error: notify main thread
      self.postMessage({
        type: 'ERROR',
        error: `Failed to load OpenSSL script: ${e.message}`,
        requestId,
      })
      throw e
    }
  })()

  try {
    await loadingPromise
  } catch (e) {
    loadingPromise = null // Allow retry on failure
    throw e
  }
}

var createOpenSSLInstance = async (requestId?: string): Promise<EmscriptenModule> => {
  if (!moduleFactory) throw new Error('Module factory not loaded. Call loadOpenSSLScript first.')
  const moduleConfig: ModuleConfig = {
    noInitialRun: true,
    print: (text: string) =>
      self.postMessage({ type: 'LOG', stream: 'stdout', message: text, requestId }),
    printErr: (text: string) =>
      self.postMessage({ type: 'LOG', stream: 'stderr', message: text, requestId }),
    locateFile: (path: string) => (path.endsWith('.wasm') ? '/wasm/openssl.wasm' : path),
  }
  return await moduleFactory(moduleConfig)
}

var injectEntropy = (module: EmscriptenModule, requestId?: string) => {
  try {
    const seedData = new Uint8Array(4096)
    self.crypto.getRandomValues(seedData)
    module.FS.writeFile('/random.seed', seedData)
    try {
      module.FS.writeFile('/dev/urandom', seedData)
    } catch (e) {}
  } catch (e) {
    self.postMessage({
      type: 'LOG',
      stream: 'stderr',
      message: 'Warning: Failed to inject entropy',
      requestId,
    })
  }
}

var configureEnvironment = (module: EmscriptenModule, _requestId?: string) => {
  try {
    try {
      module.FS.mkdir('/ssl')
    } catch (e) {}
    const minimalConfig = `
openssl_conf = openssl_init
[openssl_init]
providers = provider_sect
[provider_sect]
default = default_sect
legacy = legacy_sect
[default_sect]
activate = 1
[legacy_sect]
activate = 1
[req]
distinguished_name = req_distinguished_name
[req_distinguished_name]
`
    const cnfBytes = new TextEncoder().encode(minimalConfig)

    // Create config file at multiple locations to satisfy different OpenSSL commands
    try {
      module.FS.mkdir('/ssl')
    } catch (e) {}
    try {
      module.FS.mkdir('/usr')
    } catch (e) {}
    try {
      module.FS.mkdir('/usr/local')
    } catch (e) {}
    try {
      module.FS.mkdir('/usr/local/ssl')
    } catch (e) {}
    try {
      module.FS.mkdir('/openssl-wasm')
    } catch (e) {}

    module.FS.writeFile('/ssl/openssl.cnf', cnfBytes)
    module.FS.writeFile('/usr/local/ssl/openssl.cnf', cnfBytes)
    module.FS.writeFile('/openssl-wasm/openssl.cnf', cnfBytes)
    module.FS.writeFile('/openssl.cnf', cnfBytes) // Also at root

    // openssl.cnf is written to the WASM FS for OpenSSL to find, but NOT sent
    // to the main thread — it's an internal config, not a user-facing artifact.
    // @ts-ignore
    if (module.ENV) {
      // @ts-ignore
      module.ENV['OPENSSL_CONF'] = '/ssl/openssl.cnf'
      // @ts-ignore
      module.ENV['RANDFILE'] = '/random.seed'
    }
  } catch (e: any) {
    throw new Error('Failed to configure OpenSSL environment: ' + (e.message || String(e)))
  }
}

// ----------------------------------------------------------------------------
// PKCS#11 token lifecycle (Rust softhsmrustv3 engine, statically linked)
//
// NOTE ON PLACEMENT: this is inlined here rather than imported from a
// sibling module because this worker is `type: 'classic'` — in Vite dev
// mode a classic worker is served via importScripts() with any `import`
// statements left intact, which crashes the browser with "Cannot use
// import statement outside a module". Same constraint the CMS workshop's
// cms.worker.ts documents at its top. Keep this file dependency-free.
//
// Two things stand between "pkcs11 provider is registered" and "it works":
//
//  1. libctx isolation. pqctoday_cms_init() registers pkcs11-provider as a
//     builtin in the GLOBAL lib ctx (and OpenSSL's patched apps_startup()
//     re-runs it inside every callMain()). An explicit `-provider pkcs11`
//     CLI flag builds a SEPARATE app_libctx that does NOT inherit that
//     builtin, so OpenSSL falls back to dlopen()ing a .so absent from WASM
//     and reports "Module initialization failed!". The fix is to not pass
//     the flag — reach the provider implicitly via `pkcs11:` URIs.
//
//  2. No token. A registered provider with no initialized token fails every
//     real operation. Tokens are created below via direct C_* exports.
//
// Persistence differs from the C++ engine deliberately. That engine kept
// tokens as files under a tokendir (which is why the CMS workshop persists
// /ssl/softhsm-tokens/**). The Rust engine holds token state in memory and
// exposes an explicit snapshot API (pqctoday_hsm_state_take/_load/_free,
// added for this embedding). EXIT_RUNTIME=1 means every callMain()
// finalizes and wipes that state, so C_Finalize parks a snapshot first; we
// read it out after each command and re-load it into the next module.
// ----------------------------------------------------------------------------

var CKR_OK = 0
var CKR_CRYPTOKI_ALREADY_INITIALIZED = 0x191
var CKF_SERIAL_SESSION = 0x00000004
var CKF_RW_SESSION = 0x00000002
var CKU_SO = 0

var STUDIO_TOKEN_LABEL = 'openssl-studio'
var STUDIO_SO_PIN = '1234'
var STUDIO_USER_PIN = '1234'

/**
 * Historical note, kept because the old failure mode is widely documented
 * (including in this repo) and it is easy to "re-fix" a problem that no
 * longer exists:
 *
 *   Before 2026-07-24, `-provider pkcs11` reliably failed with "Module
 *   initialization failed!". Two things changed. (1) config.h now defines
 *   DEFAULT_PKCS11_MODULE, so the provider resolves the statically linked
 *   engine with no config file at all. (2) apps_startup() registers the
 *   provider as a builtin in the global lib ctx on every command ("Fix A").
 *   Verified against the rebuilt binary: the flag now WORKS, and a command
 *   that hits an unprovisioned token gets the honest "token was not present
 *   in its slot" instead.
 *
 * So the flag is NOT refused. What a pkcs11 command still needs is a token,
 * which ensureHsmToken() provisions below.
 */

/**
 * The token snapshot, carried across module instances.
 *
 * Deliberately NOT part of commandVfs: OpenSSL Studio sends
 * `replaceVfs: true` on every command (its file store is the source of
 * truth for USER files), which clears that map. Token state is engine
 * state, not a user file, and must survive that.
 */
var hsmSnapshot: Uint8Array | null = null

/** True when the loaded openssl.wasm exposes the Rust engine snapshot API. */
var hasSnapshotApi = (module: any): boolean =>
  typeof module._pqctoday_hsm_state_take === 'function' &&
  typeof module._pqctoday_hsm_state_load === 'function' &&
  typeof module._pqctoday_hsm_state_free === 'function'

/** Names of the PKCS#11 exports the token lifecycle needs but this build
 *  lacks (empty array = build is capable). */
var missingP11Exports = (module: any): string[] => {
  var needed = [
    '_C_Initialize',
    '_C_GetSlotList',
    '_C_GetTokenInfo',
    '_C_InitToken',
    '_C_InitPIN',
    '_C_OpenSession',
    '_C_CloseSession',
    '_C_Login',
    '_C_Logout',
    '_malloc',
    '_free',
  ]
  var missing: string[] = []
  for (var i = 0; i < needed.length; i++) {
    if (typeof module[needed[i]] !== 'function') missing.push(needed[i].replace(/^_/, ''))
  }
  if (!hasSnapshotApi(module)) missing.push('pqctoday_hsm_state_take/_load/_free')
  return missing
}

/**
 * Read the engine's token snapshot out of `module` as an owned copy, via a
 * direct exported-function pull.
 *
 * SAFE ONLY when `module` has not (yet) had `callMain` invoked on it. Do
 * NOT call this after `callMain` returns — verified directly (2026-07-24):
 * any exported wasm function call, including `_malloc`, aborts post-exit
 * with "native function `malloc` called after runtime exit" once
 * `-sEXIT_RUNTIME=1`'s teardown has run. Use `readHsmStateFile` instead for
 * the post-`callMain` case — see that function's doc comment for why a
 * file, not this pull, is the real handoff mechanism there.
 *
 * Used by the Explorer's direct-C-API keygen path (`generateKeyInToken`),
 * which never calls `callMain` on the module it operates on.
 */
var takeTokenSnapshot = (module: any): Uint8Array | null => {
  if (!hasSnapshotApi(module)) return null
  var lenP = module._malloc(4)
  try {
    module.setValue(lenP, 0, 'i32')
    var ptr = module._pqctoday_hsm_state_take(lenP)
    var len = module.getValue(lenP, 'i32')
    if (!ptr || len <= 0) return null
    // Copy before freeing — HEAPU8 is a live view into WASM memory.
    var copy = new Uint8Array(module.HEAPU8.subarray(ptr, ptr + len))
    module._pqctoday_hsm_state_free(ptr, len)
    return copy
  } catch (e) {
    return null
  } finally {
    module._free(lenP)
  }
}

/**
 * MEMFS path the Rust engine's `atexit()` hook writes to — see
 * `pqctoday_hsm_atexit_stash` in pqctoday-hsm/rust/src/state_snapshot.rs.
 * That hook is registered (once per module instance, in
 * cms_provider_init.c's `pqctoday_cms_init`, which "Fix A" calls on every
 * `callMain`) via a genuine C `atexit()` — independent of OpenSSL's own
 * provider-teardown machinery, which was found NOT to reach the engine's
 * C_Finalize during a normal CLI command (2026-07-24: `OPENSSL_cleanup()`
 * does run at the end of every `callMain`, confirmed directly, but its own
 * body never references "provider" or "libctx" — it does not unload a
 * provider loaded via an explicit `OSSL_PROVIDER_load()` call, which is
 * exactly what `pqctoday_cms_init()` does).
 */
var HSM_STATE_FILE_PATH = '/tmp/.pqctoday_hsm_state.bin'

/**
 * Read the token snapshot out of `module` via a pure FS read.
 *
 * The correct call for AFTER `callMain` has returned: `FS.readFile` is pure
 * JS (no exported wasm call), so it stays safe post-runtime-teardown — the
 * file itself was written while the runtime was still alive, during the
 * atexit hook described above. Null if the file doesn't exist (nothing was
 * ever provisioned this command).
 */
var readHsmStateFile = (module: any): Uint8Array | null => {
  try {
    var data = module.FS.readFile(HSM_STATE_FILE_PATH)
    return data && data.length > 0 ? new Uint8Array(data) : null
  } catch (e) {
    return null
  }
}

/** Install a snapshot from a previous module instance. A corrupt blob is
 *  rejected engine-side, leaving the fresh module untouched. */
var loadTokenSnapshot = (module: any, snapshot: Uint8Array): boolean => {
  if (!hasSnapshotApi(module) || snapshot.length === 0) return false
  var buf = module._malloc(snapshot.length)
  try {
    module.HEAPU8.set(snapshot, buf)
    return module._pqctoday_hsm_state_load(buf, snapshot.length) === CKR_OK
  } catch (e) {
    return false
  } finally {
    module._free(buf)
  }
}

/** First slot id from C_GetSlotList, or null. */
var firstSlot = (module: any): number | null => {
  var cntP = module._malloc(4)
  module.setValue(cntP, 0, 'i32')
  if (module._C_GetSlotList(0, 0, cntP) !== CKR_OK) {
    module._free(cntP)
    return null
  }
  var count = module.getValue(cntP, 'i32')
  module._free(cntP)
  if (count <= 0) return null

  var listP = module._malloc(count * 4)
  var cnt2P = module._malloc(4)
  module.setValue(cnt2P, count, 'i32')
  var rv = module._C_GetSlotList(0, listP, cnt2P)
  var slot = rv === CKR_OK ? module.getValue(listP, 'i32') : null
  module._free(listP)
  module._free(cnt2P)
  return slot
}

// CK_TOKEN_INFO layout, per pkcs11t.h and confirmed against the Rust
// engine's own C_GetTokenInfo (ck_abi.rs: "Engine blob (160 B): label@0..32,
// mfr@32..64, model@64..80, serial@80..96, flags(u32)@96, ..."):
//   label[32] + manufacturerID[32] + model[16] + serialNumber[16] = 96,
//   then CK_FLAGS (u32 on this ILP32 target) at offset 96.
var CK_TOKEN_INFO_SIZE = 160
var CK_TOKEN_INFO_FLAGS_OFFSET = 96
var CKF_TOKEN_INITIALIZED = 0x00000400

/**
 * Ask the token itself whether it has already been initialized — PKCS#11
 * v3.2 §5.5.7: "The CKF_TOKEN_INITIALIZED flag in the CK_TOKEN_INFO
 * structure indicates the action that will result from calling
 * C_InitToken. If set, the token will be reinitialized." This is the
 * authoritative check; JS-side bookkeeping (a restored snapshot) is a
 * useful hint but not proof, and trusting it alone risks destroying every
 * key on a real re-init (C_InitToken succeeds with the correct SO PIN even
 * on an initialized token — it does not merely refuse).
 *
 * Three-valued on purpose: `null` means "could not ask" (C_GetTokenInfo
 * itself failed), which is NOT the same as "not initialized". Collapsing
 * that into `false` would make a transient query failure indistinguishable
 * from a genuinely fresh token — and re-init a real one out from under a
 * successful snapshot restore. Callers must fall back to the JS-side
 * `restored` hint on `null`, never assume `false`.
 */
var tokenIsInitialized = (module: any, slot: number): boolean | null => {
  var infoP = module._malloc(CK_TOKEN_INFO_SIZE)
  try {
    var rv = module._C_GetTokenInfo(slot, infoP)
    if (rv !== CKR_OK) return null
    var flags = module.getValue(infoP + CK_TOKEN_INFO_FLAGS_OFFSET, 'i32')
    return (flags & CKF_TOKEN_INITIALIZED) !== 0
  } finally {
    module._free(infoP)
  }
}

/**
 * Ensure this module has an initialized token, restoring prior state first.
 *
 * The re-init guard is load-bearing: PKCS#11 v3.2 §5.5.7 specifies that
 * C_InitToken on an ALREADY-initialized token with the correct SO PIN
 * resets it and destroys every key object — it does not refuse, it
 * succeeds destructively. So this never re-inits a token that
 * tokenIsInitialized() reports as initialized, regardless of whether the
 * JS-side snapshot restore appeared to succeed.
 *
 * Returns null on success, or an error string to surface verbatim.
 */
var ensureHsmToken = (module: any, requestId?: string): string | null => {
  var missing = missingP11Exports(module)
  if (missing.length > 0) {
    return (
      'This openssl.wasm build does not export ' +
      missing.join(', ') +
      ' — PKCS#11 token support needs the build that statically links the ' +
      'Rust HSM engine (see openssl-studio-pkcs11-wiring-plan-07242026.md).'
    )
  }

  // Restore BEFORE C_Initialize so the engine builds its slot list from the
  // rehydrated token store rather than creating a fresh empty slot.
  var restored = false
  if (hsmSnapshot) {
    restored = loadTokenSnapshot(module, hsmSnapshot)
    if (!restored) {
      self.postMessage({
        type: 'LOG',
        stream: 'stderr',
        message: '[HSM] Token snapshot was rejected by the engine; re-initializing a fresh token.',
        requestId,
      })
    }
  }

  var rv0 = module._C_Initialize(0)
  if (rv0 !== CKR_OK && rv0 !== CKR_CRYPTOKI_ALREADY_INITIALIZED) {
    return 'C_Initialize failed (rv=0x' + rv0.toString(16) + ')'
  }

  var slot = firstSlot(module)
  if (slot === null) return 'C_GetSlotList returned no slots'

  // Authoritative check — see tokenIsInitialized's doc comment. `true` wins
  // outright. `null` (couldn't ask) falls back to the JS-side `restored`
  // hint rather than being treated as "not initialized" — collapsing
  // "unknown" into "false" here would re-init a real token out from under a
  // successful restore on nothing more than a transient query failure.
  // Only a confirmed `false` disagreeing with `restored` is worth logging:
  // that is the one case where our own bookkeeping was actually wrong.
  var initState = tokenIsInitialized(module, slot)
  if (initState === true) return null
  if (initState === null && restored) return null
  if (initState === false && restored) {
    self.postMessage({
      type: 'LOG',
      stream: 'stderr',
      message:
        '[HSM] Snapshot restore reported success but the token reports NOT initialized — ' +
        'trusting the token and re-provisioning rather than risk operating on inconsistent state.',
      requestId,
    })
  }

  var labelP = module._malloc(32)
  var label = new Uint8Array(32)
  label.fill(0x20)
  for (var i = 0; i < STUDIO_TOKEN_LABEL.length && i < 32; i++) {
    label[i] = STUDIO_TOKEN_LABEL.charCodeAt(i)
  }
  module.HEAPU8.set(label, labelP)
  var soPinP = module._malloc(STUDIO_SO_PIN.length + 1)
  module.stringToUTF8(STUDIO_SO_PIN, soPinP, STUDIO_SO_PIN.length + 1)
  var initRv = module._C_InitToken(slot, soPinP, STUDIO_SO_PIN.length, labelP)
  module._free(soPinP)
  module._free(labelP)
  if (initRv !== CKR_OK) {
    return 'C_InitToken failed (rv=0x' + initRv.toString(16) + ')'
  }

  // The token can move slots once initialized — re-read the list.
  var tokenSlot = firstSlot(module)
  if (tokenSlot === null) tokenSlot = slot

  var sessP = module._malloc(4)
  module.setValue(sessP, 0, 'i32')
  var openRv = module._C_OpenSession(tokenSlot, CKF_SERIAL_SESSION | CKF_RW_SESSION, 0, 0, sessP)
  if (openRv !== CKR_OK) {
    module._free(sessP)
    return 'C_OpenSession(SO) failed (rv=0x' + openRv.toString(16) + ')'
  }
  var soSess = module.getValue(sessP, 'i32')
  module._free(sessP)

  var soPinP2 = module._malloc(STUDIO_SO_PIN.length + 1)
  module.stringToUTF8(STUDIO_SO_PIN, soPinP2, STUDIO_SO_PIN.length + 1)
  var loginRv = module._C_Login(soSess, CKU_SO, soPinP2, STUDIO_SO_PIN.length)
  module._free(soPinP2)
  if (loginRv !== CKR_OK) {
    module._C_CloseSession(soSess)
    return 'C_Login(SO) failed (rv=0x' + loginRv.toString(16) + ')'
  }

  var userPinP = module._malloc(STUDIO_USER_PIN.length + 1)
  module.stringToUTF8(STUDIO_USER_PIN, userPinP, STUDIO_USER_PIN.length + 1)
  var pinRv = module._C_InitPIN(soSess, userPinP, STUDIO_USER_PIN.length)
  module._free(userPinP)
  module._C_Logout(soSess)
  module._C_CloseSession(soSess)
  if (pinRv !== CKR_OK) {
    return 'C_InitPIN failed (rv=0x' + pinRv.toString(16) + ')'
  }

  self.postMessage({
    type: 'LOG',
    stream: 'stdout',
    message:
      '[HSM] Initialized token "' + STUDIO_TOKEN_LABEL + '" (user PIN ' + STUDIO_USER_PIN + ')',
    requestId,
  })
  return null
}

// ── In-token key generation ──────────────────────────────────────────────
//
// Why this is not just `genpkey -out pkcs11:...`: that CLI form routes the
// output through a BIO, i.e. POSIX open(), and writes a PEM file into
// MEMFS. The key never reaches the token, so a later `pkcs11:object=<id>`
// reference cannot find it. Generating through C_GenerateKeyPair with
// CKA_TOKEN=TRUE is the only way to get a token-resident key. (The CMS
// workshop hit exactly this and documents it the same way.)
//
// Constant values below are from the normative PKCS#11 v3.2 header
// (pqctoday-hsm/src/lib/pkcs11/pkcs11t.h), not inferred.

var CKO_PUBLIC_KEY = 0x00000002
var CKO_PRIVATE_KEY = 0x00000003
var CKA_CLASS = 0x00000000
var CKA_TOKEN = 0x00000001
var CKA_LABEL = 0x00000003
var CKA_KEY_TYPE = 0x00000100
var CKA_ID = 0x00000102
var CKA_SENSITIVE = 0x00000103
var CKA_SIGN = 0x00000108
var CKA_VERIFY = 0x0000010a
var CKA_PARAMETER_SET = 0x0000061d
var CKA_EC_PARAMS = 0x00000180
// PKCS#11 v3.2 §6.68.2's own ML-KEM public-key template uses these, and the
// C_EncapsulateKey text is normative: "The CKA_ENCAPSULATE attribute of the
// public key, which indicates whether the key supports encapsulation, MUST
// be CK_TRUE." CKA_DERIVE (0x10c) is a key-agreement attribute and does not
// apply to KEM keys — using it here was wrong (found 2026-07-24 validating
// against the spec; ML-DSA was the only algorithm actually round-trip
// tested, so a key that couldn't encapsulate would only have surfaced one
// step later, in the Workbench).
var CKA_ENCAPSULATE = 0x00000633
var CKA_DECAPSULATE = 0x00000634
var CKU_USER = 1

var CKK_EC = 0x00000003
var CKK_ML_KEM = 0x00000049
var CKK_ML_DSA = 0x0000004a
var CKM_EC_KEY_PAIR_GEN = 0x00001040
var CKM_ML_KEM_KEY_PAIR_GEN = 0x0000000f
var CKM_ML_DSA_KEY_PAIR_GEN = 0x0000001c

/** DER-encoded OID for the NIST P-256 curve (1.2.840.10045.3.1.7), the
 *  CKA_EC_PARAMS value for an EC keypair. */
var EC_PARAMS_P256 = new Uint8Array([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07])

// CKA_PARAMETER_SET values are the CKP_* ORDINALS from pkcs11t.h (1/2/3),
// NOT the security level in the algorithm's name. Passing 65 for ML-DSA-65
// is not merely rejected — it traps the engine with "memory access out of
// bounds", so this distinction is worth being explicit about.
var CKP_ML_DSA_44 = 0x00000001
var CKP_ML_DSA_65 = 0x00000002
var CKP_ML_DSA_87 = 0x00000003
var CKP_ML_KEM_512 = 0x00000001
var CKP_ML_KEM_768 = 0x00000002
var CKP_ML_KEM_1024 = 0x00000003

/** Algorithms the Studio can generate into the token, keyed by the name
 *  shown in the UI. `paramSet` is CKA_PARAMETER_SET (ML-DSA/ML-KEM only). */
var HSM_KEYGEN_ALGS: Record<
  string,
  { mech: number; keyType: number; paramSet?: number; kind: 'sign' | 'kem' | 'ec' }
> = {
  'ML-DSA-44': {
    mech: CKM_ML_DSA_KEY_PAIR_GEN,
    keyType: CKK_ML_DSA,
    paramSet: CKP_ML_DSA_44,
    kind: 'sign',
  },
  'ML-DSA-65': {
    mech: CKM_ML_DSA_KEY_PAIR_GEN,
    keyType: CKK_ML_DSA,
    paramSet: CKP_ML_DSA_65,
    kind: 'sign',
  },
  'ML-DSA-87': {
    mech: CKM_ML_DSA_KEY_PAIR_GEN,
    keyType: CKK_ML_DSA,
    paramSet: CKP_ML_DSA_87,
    kind: 'sign',
  },
  'ML-KEM-512': {
    mech: CKM_ML_KEM_KEY_PAIR_GEN,
    keyType: CKK_ML_KEM,
    paramSet: CKP_ML_KEM_512,
    kind: 'kem',
  },
  'ML-KEM-768': {
    mech: CKM_ML_KEM_KEY_PAIR_GEN,
    keyType: CKK_ML_KEM,
    paramSet: CKP_ML_KEM_768,
    kind: 'kem',
  },
  'ML-KEM-1024': {
    mech: CKM_ML_KEM_KEY_PAIR_GEN,
    keyType: CKK_ML_KEM,
    paramSet: CKP_ML_KEM_1024,
    kind: 'kem',
  },
  'EC-P256': { mech: CKM_EC_KEY_PAIR_GEN, keyType: CKK_EC, kind: 'ec' },
}

/** Write one CK_ATTRIBUTE (12 bytes on ILP32) at base[idx]. */
var writeAttr = (
  module: any,
  base: number,
  idx: number,
  type: number,
  valPtr: number,
  valLen: number
) => {
  var off = base + idx * 12
  module.setValue(off, type, 'i32')
  module.setValue(off + 4, valPtr, 'i32')
  module.setValue(off + 8, valLen, 'i32')
}

/**
 * Generate a token-resident keypair. Returns null on success, else an error
 * string. The caller must have run ensureHsmToken() on this module first.
 */
var generateKeyInToken = (module: any, algName: string, keyId: string): string | null => {
  var spec = HSM_KEYGEN_ALGS[algName]
  if (!spec) {
    return (
      'Unsupported HSM algorithm "' +
      algName +
      '". Supported: ' +
      Object.keys(HSM_KEYGEN_ALGS).join(', ')
    )
  }
  if (typeof module._C_GenerateKeyPair !== 'function') {
    return 'This openssl.wasm build does not export C_GenerateKeyPair.'
  }

  var slot = firstSlot(module)
  if (slot === null) return 'C_GetSlotList returned no slots'

  var sessP = module._malloc(4)
  module.setValue(sessP, 0, 'i32')
  var openRv = module._C_OpenSession(slot, CKF_SERIAL_SESSION | CKF_RW_SESSION, 0, 0, sessP)
  if (openRv !== CKR_OK) {
    module._free(sessP)
    return 'C_OpenSession failed (rv=0x' + openRv.toString(16) + ')'
  }
  var session = module.getValue(sessP, 'i32')
  module._free(sessP)

  var pinP = module._malloc(STUDIO_USER_PIN.length + 1)
  module.stringToUTF8(STUDIO_USER_PIN, pinP, STUDIO_USER_PIN.length + 1)
  var loginRv = module._C_Login(session, CKU_USER, pinP, STUDIO_USER_PIN.length)
  module._free(pinP)
  // ALREADY_LOGGED_IN is fine — the session may be reused within a command.
  if (loginRv !== CKR_OK && loginRv !== 0x100) {
    module._C_CloseSession(session)
    return 'C_Login(user) failed (rv=0x' + loginRv.toString(16) + ')'
  }

  // Value buffers.
  var boolTrueP = module._malloc(1)
  module.HEAPU8[boolTrueP] = 1
  var pubClassP = module._malloc(4)
  module.setValue(pubClassP, CKO_PUBLIC_KEY, 'i32')
  var privClassP = module._malloc(4)
  module.setValue(privClassP, CKO_PRIVATE_KEY, 'i32')
  var keyTypeP = module._malloc(4)
  module.setValue(keyTypeP, spec.keyType, 'i32')

  var idBytes = new TextEncoder().encode(keyId)
  var labelP = module._malloc(idBytes.length)
  module.HEAPU8.set(idBytes, labelP)
  var idP = module._malloc(idBytes.length)
  module.HEAPU8.set(idBytes, idP)

  // CK_MECHANISM { type, pParameter, ulParameterLen } — 12 bytes on ILP32.
  var mechP = module._malloc(12)
  module.setValue(mechP, spec.mech, 'i32')
  module.setValue(mechP + 4, 0, 'i32')
  module.setValue(mechP + 8, 0, 'i32')

  // Templates. Common head: CLASS, TOKEN, LABEL, ID, KEY_TYPE.
  var pubAttrs: number[][] = [
    [CKA_CLASS, pubClassP, 4],
    [CKA_TOKEN, boolTrueP, 1],
    [CKA_LABEL, labelP, idBytes.length],
    [CKA_ID, idP, idBytes.length],
    [CKA_KEY_TYPE, keyTypeP, 4],
  ]
  var privAttrs: number[][] = [
    [CKA_CLASS, privClassP, 4],
    [CKA_TOKEN, boolTrueP, 1],
    [CKA_LABEL, labelP, idBytes.length],
    [CKA_ID, idP, idBytes.length],
    [CKA_KEY_TYPE, keyTypeP, 4],
    [CKA_SENSITIVE, boolTrueP, 1],
  ]

  var paramSetP = 0
  var ecParamsP = 0
  if (spec.paramSet !== undefined) {
    paramSetP = module._malloc(4)
    module.setValue(paramSetP, spec.paramSet, 'i32')
    pubAttrs.push([CKA_PARAMETER_SET, paramSetP, 4])
    privAttrs.push([CKA_PARAMETER_SET, paramSetP, 4])
  }
  if (spec.kind === 'ec') {
    ecParamsP = module._malloc(EC_PARAMS_P256.length)
    module.HEAPU8.set(EC_PARAMS_P256, ecParamsP)
    // CKA_EC_PARAMS must be on BOTH templates: pkcs11-provider's
    // fetch_ec_key() (objects.c) fetches it with mandatory=true for
    // CKO_PRIVATE_KEY as well as CKO_PUBLIC_KEY — it needs the curve to
    // reconstruct an EVP_PKEY from a bare private scalar. Public-only left
    // every `pkcs11:object=<ecKeyId>` PRIVATE-key lookup failing with
    // CKR_KEY_INDIGESTIBLE ("Failed to load keys from slot") on any module
    // that restored the key from a snapshot rather than the one that
    // generated it.
    pubAttrs.push([CKA_EC_PARAMS, ecParamsP, EC_PARAMS_P256.length])
    privAttrs.push([CKA_EC_PARAMS, ecParamsP, EC_PARAMS_P256.length])
  }
  if (spec.kind === 'kem') {
    // PKCS#11 v3.2 §6.68.2 / C_EncapsulateKey: ML-KEM keys encapsulate and
    // decapsulate, not derive.
    pubAttrs.push([CKA_ENCAPSULATE, boolTrueP, 1])
    privAttrs.push([CKA_DECAPSULATE, boolTrueP, 1])
  } else {
    pubAttrs.push([CKA_VERIFY, boolTrueP, 1])
    privAttrs.push([CKA_SIGN, boolTrueP, 1])
  }

  var pubTplP = module._malloc(pubAttrs.length * 12)
  for (var i = 0; i < pubAttrs.length; i++) {
    writeAttr(module, pubTplP, i, pubAttrs[i][0], pubAttrs[i][1], pubAttrs[i][2])
  }
  var privTplP = module._malloc(privAttrs.length * 12)
  for (var j = 0; j < privAttrs.length; j++) {
    writeAttr(module, privTplP, j, privAttrs[j][0], privAttrs[j][1], privAttrs[j][2])
  }

  var hPubP = module._malloc(4)
  var hPrivP = module._malloc(4)
  module.setValue(hPubP, 0, 'i32')
  module.setValue(hPrivP, 0, 'i32')

  var genRv = module._C_GenerateKeyPair(
    session,
    mechP,
    pubTplP,
    pubAttrs.length,
    privTplP,
    privAttrs.length,
    hPubP,
    hPrivP
  )

  module._free(hPubP)
  module._free(hPrivP)
  module._free(pubTplP)
  module._free(privTplP)
  module._free(mechP)
  module._free(idP)
  module._free(labelP)
  module._free(keyTypeP)
  module._free(privClassP)
  module._free(pubClassP)
  module._free(boolTrueP)
  if (paramSetP) module._free(paramSetP)
  if (ecParamsP) module._free(ecParamsP)

  module._C_Logout(session)
  module._C_CloseSession(session)

  if (genRv !== CKR_OK) {
    return 'C_GenerateKeyPair(' + algName + ') failed (rv=0x' + genRv.toString(16) + ')'
  }
  return null
}

/**
 * Snapshot the engine via the malloc-based pull. ONLY for modules that have
 * NOT had `callMain` invoked — see `takeTokenSnapshot`'s doc comment.
 * Keeps the previous snapshot if the engine had nothing to give.
 */
var saveHsmSnapshotDirectApi = (module: any) => {
  var snap = takeTokenSnapshot(module)
  if (snap) hsmSnapshot = snap
}

/**
 * Snapshot the engine via the file-based read. The correct call AFTER
 * `callMain` has returned — see `readHsmStateFile`'s doc comment. Keeps
 * the previous snapshot if the engine had nothing to give (e.g. this
 * command never touched pkcs11, so the atexit hook wrote nothing new).
 */
var saveHsmSnapshotAfterCallMain = (module: any) => {
  var snap = readHsmStateFile(module)
  if (snap) hsmSnapshot = snap
}

/** True when a command touches the token and therefore needs the lifecycle
 *  run first — either a `pkcs11:` URI anywhere in the args, or an explicit
 *  `-provider pkcs11` (which works, but still needs a provisioned token:
 *  without one it fails with "token was not present in its slot"). */
var commandUsesPkcs11 = (args: string[]): boolean => {
  for (var i = 0; i < args.length; i++) {
    if (args[i].indexOf('pkcs11:') >= 0) return true
    if (args[i] === '-provider' && args[i + 1] === 'pkcs11') return true
    if (args[i] === '-propquery' && (args[i + 1] || '').indexOf('pkcs11') >= 0) return true
  }
  return false
}

// ----------------------------------------------------------------------------
// Persistent virtual filesystem (VFS)
//
// The openssl.wasm bundle is built with -sEXIT_RUNTIME=1: every callMain()
// tears the runtime down, so each COMMAND gets a brand-new module with an
// empty MEMFS. Without this map, a file written by one COMMAND simply does
// not exist for the next one — which silently broke every tool that chained
// commands without re-sending files (the whole 5G/SUCI module fell back to
// fake output because of it). Same pattern as EmailSigning's cms.worker.ts
// `vfs` and the FiveG audit tests' WasmAdapter: snapshot root files after
// each command, rehydrate them into the next fresh module.
// ----------------------------------------------------------------------------

// Keyed by bare root filename (no leading '/'), matching FILE_CREATED /
// DELETE_FILE `name` fields.
var commandVfs: Map<string, Uint8Array> = new Map()

// Per-command internals recreated by configureEnvironment/injectEntropy —
// never worth persisting or rehydrating.
var VFS_EXCLUDED = new Set(['openssl.cnf', 'random.seed'])

var rehydrateVfs = (module: EmscriptenModule, requestId?: string) => {
  for (const [name, data] of commandVfs) {
    try {
      module.FS.writeFile('/' + name, data)
    } catch (e) {
      self.postMessage({
        type: 'LOG',
        stream: 'stderr',
        message: `[VFS] Failed to rehydrate ${name}: ${(e as Error).message}`,
        requestId,
      })
    }
  }
}

/** Snapshot every regular file at the FS root into commandVfs (overwrites). */
var snapshotVfs = (module: EmscriptenModule) => {
  try {
    const entries = module.FS.readdir('/')
    for (const name of entries) {
      if (name === '.' || name === '..') continue
      if (VFS_EXCLUDED.has(name)) continue
      try {
        const stat = module.FS.stat('/' + name)
        if (module.FS.isFile(stat.mode)) {
          commandVfs.set(name, module.FS.readFile('/' + name))
        }
      } catch {
        /* skip unreadable entries */
      }
    }
  } catch {
    /* FS may be unusable after a hard crash — keep whatever we had */
  }
}

var writeInputFiles = (
  module: EmscriptenModule,
  files: { name: string; data: Uint8Array }[],
  requestId?: string
) => {
  const writtenFiles = new Set<string>()
  for (const file of files) {
    try {
      module.FS.writeFile('/' + file.name, file.data)
      writtenFiles.add(file.name)
    } catch (e) {
      // Use postMessage instead of console.warn
      self.postMessage({
        type: 'LOG',
        stream: 'stderr',
        message: `Failed to write input file ${file.name}: ${e}`,
        requestId,
      })
    }
  }
  return writtenFiles
}

var REPORTABLE_OUTPUT_EXTENSIONS = [
  '.key',
  '.pub',
  '.csr',
  '.crt',
  '.sig',
  '.txt',
  '.bin',
  '.p12',
  '.pem',
  '.enc',
  '.der',
  '.p7b',
  '.skey',
  '.crl',
]

var bytesEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/**
 * Report every output file this command produced, and return their names.
 *
 * `inputFiles` holds names that already existed when the command started
 * (rehydrated persistent-VFS entries + caller-supplied inputs). Those are
 * skipped so a command doesn't re-announce files it merely inherited — BUT
 * only when the bytes are unchanged. Overwriting an existing name is a real
 * output: re-running `genpkey -out private.key` (which every workshop does —
 * both the classical and PQC panes of PQC-101 step 3 write that same name)
 * produces a genuinely new key, and skipping it on name alone made the second
 * run look like it silently produced nothing ("key file not produced").
 * Verified in-browser 2026-08-02: whichever pane ran second always failed,
 * regardless of algorithm.
 */
var scanOutputFiles = (
  module: EmscriptenModule,
  inputFiles: Set<string>,
  requestId?: string,
  priorContents?: Map<string, Uint8Array>
): string[] => {
  const reported: string[] = []
  try {
    const files = module.FS.readdir('/')
    for (const file of files) {
      if (
        file === '.' ||
        file === '..' ||
        file === 'tmp' ||
        file === 'dev' ||
        file === 'proc' ||
        file === 'ssl'
      )
        continue
      try {
        const stat = module.FS.stat('/' + file)
        if (!module.FS.isFile(stat.mode)) continue
        if (!REPORTABLE_OUTPUT_EXTENSIONS.some((ext) => file.endsWith(ext))) continue

        const content = module.FS.readFile('/' + file)
        if (inputFiles.has(file)) {
          // Unchanged (or un-diffable) inherited file — not this command's output.
          const prior = priorContents?.get(file)
          if (!prior || bytesEqual(prior, content)) continue
        }
        self.postMessage({ type: 'FILE_CREATED', name: file, data: content, requestId })
        reported.push(file)
      } catch (e) {
        self.postMessage({
          type: 'LOG',
          stream: 'stderr',
          message: `Failed to read output file ${file}: ${(e as Error).message}`,
          requestId,
        })
      }
    }
  } catch (e) {
    self.postMessage({
      type: 'LOG',
      stream: 'stderr',
      message: `Failed to scan output directory: ${(e as Error).message}`,
      requestId,
    })
  }
  return reported
}

// ----------------------------------------------------------------------------
// Strategies
// ----------------------------------------------------------------------------

interface CommandStrategy {
  prepare(module: EmscriptenModule, requestId?: string): void
  getArgs(command: string, args: string[]): string[]
}

var BaseStrategy = class BaseStrategy implements CommandStrategy {
  prepare(module: EmscriptenModule, requestId?: string): void {
    // Ensure environment is configured even for base commands
    configureEnvironment(module, requestId)
  }
  getArgs(command: string, args: string[]): string[] {
    return [command, ...args]
  }
}

var CryptoStrategy = class CryptoStrategy implements CommandStrategy {
  prepare(module: EmscriptenModule, requestId?: string): void {
    injectEntropy(module, requestId)
    configureEnvironment(module, requestId)
  }
  getArgs(command: string, args: string[]): string[] {
    return [command, '-rand', '/random.seed', ...args]
  }
}

var CRYPTO_COMMANDS = [
  'genpkey',
  'req',
  'rand',
  'dgst',
  'enc',
  'cms',
  'ca',
  'x509',
  'spkac',
  'pkeyutl',
  'cmp',
  // NOTE: do NOT add these here — they don't accept -rand and prepending it
  // either prints "Unknown option: -rand" (visible: verify) or silently
  // breaks the option parser (no output file: crl2pkcs7, pkcs7).
  //   - 'verify'  — pure validation, no random ops
  //   - 'crl2pkcs7' / 'pkcs7' — wrapping, no random ops
  //   - 'sign'    — not actually an openssl subcommand
]

var getStrategy = (command: string): CommandStrategy => {
  if (CRYPTO_COMMANDS.includes(command)) {
    return new CryptoStrategy()
  }
  return new BaseStrategy()
}

// ----------------------------------------------------------------------------
// Main Execution
// ----------------------------------------------------------------------------

// console.log("[Worker] Worker script loaded (Consolidated)"); // Removed console.log

var executeCommand = async (
  command: string,
  args: string[],
  inputFiles: { name: string; data: Uint8Array }[] = [],
  requestId?: string,
  replaceVfs?: boolean
) => {
  self.postMessage({
    type: 'LOG',
    stream: 'stdout',
    message: `[Debug] executeCommand started: ${command}`,
    requestId,
  })
  let openSSLModule
  // Set only when THIS command actually engaged the token (ensureHsmToken
  // ran, below). Gates the post-callMain snapshot save: the Rust engine's
  // atexit hook writes a state file on EVERY command unconditionally
  // (Fix A registers it regardless of the command), so for a command that
  // never restored/touched the token, that file is an EMPTY snapshot —
  // saving it would silently wipe out real token state built up by an
  // earlier HSM_KEYGEN, just because the user ran an unrelated command
  // (e.g. `openssl version`) afterward. Found 2026-07-24 while verifying
  // the file-based handoff end-to-end; see also readHsmStateFile.
  let commandTouchedToken = false

  try {
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Loading OpenSSL script...',
      requestId,
    })
    await loadOpenSSLScript('/wasm/openssl.js', requestId)
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Creating OpenSSL instance...',
      requestId,
    })
    openSSLModule = await createOpenSSLInstance(requestId)
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] OpenSSL instance created',
      requestId,
    })
  } catch (e: any) {
    self.postMessage({
      type: 'LOG',
      stream: 'stderr',
      message: `[Debug] Initialization failed: ${e.message}`,
      requestId,
    })
    throw new Error(`Failed to initialize OpenSSL: ${e.message}`)
  }

  try {
    // Provision/restore the token before any command that touches it.
    if (commandUsesPkcs11(args)) {
      commandTouchedToken = true
      const hsmErr = ensureHsmToken(openSSLModule, requestId)
      if (hsmErr) throw new Error(hsmErr)
    }

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Selecting strategy...',
      requestId,
    })
    const strategy = getStrategy(command)
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `[Debug] Strategy selected: ${strategy.constructor.name}`,
      requestId,
    })

    // Persistent-VFS handling: rehydrate files from prior commands into this
    // fresh module BEFORE caller-supplied inputs, so explicit inputs win.
    if (replaceVfs) commandVfs.clear()
    // Names that existed before this command ran — used below so FILE_CREATED
    // only reports files this command actually created or OVERWROTE (not
    // rehydrated ones it left untouched, which were already reported by the
    // command that created them). `priorContents` is what makes the
    // "overwrote" half decidable — see scanOutputFiles.
    const preexisting = new Set<string>(commandVfs.keys())
    const priorContents = new Map<string, Uint8Array>(commandVfs)
    rehydrateVfs(openSSLModule, requestId)

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Writing input files...',
      requestId,
    })
    const writtenFiles = writeInputFiles(openSSLModule, inputFiles, requestId)
    for (const name of writtenFiles) preexisting.add(name)
    for (const file of inputFiles) {
      if (writtenFiles.has(file.name)) priorContents.set(file.name, file.data)
    }

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Preparing strategy...',
      requestId,
    })
    strategy.prepare(openSSLModule, requestId)

    const fullArgs = strategy.getArgs(command, args)
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `[Debug] Full args: ${fullArgs.join(' ')}`,
      requestId,
    })

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `Executing: openssl ${fullArgs.join(' ')}`,
      requestId,
    })

    try {
      self.postMessage({
        type: 'LOG',
        stream: 'stdout',
        message: '[Debug] Calling callMain...',
        requestId,
      })
      // @ts-ignore
      const exitCode = openSSLModule.callMain(fullArgs)
      self.postMessage({
        type: 'LOG',
        stream: 'stdout',
        message: `[Debug] callMain returned (exit code ${exitCode})`,
        requestId,
      })
      // callMain doesn't always throw on a nonzero exit — depending on the
      // Emscripten build, a failed command (bad args, provider init
      // failure, refused algorithm, etc.) can come back as a plain nonzero
      // RETURN VALUE instead of a thrown ExitStatus. Both paths must be
      // treated as failure, or callers awaiting this command's outcome
      // (Learn tab's expect:'refusal' steps, the Algorithm Explorer's
      // provider-functional probe) see a false success. See commandParser
      // callers / algorithmListParser.ts's provider-honesty section for
      // why this distinction is load-bearing, not cosmetic.
      if (typeof exitCode === 'number' && exitCode !== 0) {
        throw new Error(`OpenSSL exited with status ${exitCode}`)
      }
    } catch (e: any) {
      if (e.name === 'ExitStatus') {
        if (e.status !== 0) {
          throw new Error(`OpenSSL exited with status ${e.status}`)
        }
      } else {
        // console.error("OpenSSL Execution Error:", e); // Removed console.error
        self.postMessage({
          type: 'LOG',
          stream: 'stderr',
          message: `OpenSSL Execution Error: ${e}`,
          requestId,
        })
        if (e.message && e.message.includes('Unreachable')) {
          throw new Error(
            `WASM Crash: The operation caused a critical error (Unreachable code). This usually indicates a build incompatibility or memory issue with this specific algorithm.`
          )
        }
        throw e
      }
    } finally {
      // Persist FS state regardless of exit status (POSIX-like: partial
      // outputs of a failed command remain on disk for the next command).
      snapshotVfs(openSSLModule)
      // Same for token state — but ONLY if this command actually restored
      // it (commandTouchedToken). The atexit hook writes a state file on
      // every command unconditionally; for a command that never called
      // ensureHsmToken, that file is an empty snapshot (nothing was ever
      // loaded into this module's token store), and saving it here would
      // silently wipe out real token state from an earlier HSM_KEYGEN.
      // Read via the file the engine's atexit hook wrote WHILE its runtime
      // was still alive — callMain has already returned by this point, so
      // nothing exported (malloc included) can be called on this module
      // instance anymore; see readHsmStateFile.
      if (commandTouchedToken) {
        saveHsmSnapshotAfterCallMain(openSSLModule)
      }
    }

    // Scan for output files — report only files this command created or rewrote
    const producedFiles = scanOutputFiles(openSSLModule, preexisting, requestId, priorContents)

    // Inform user about encap outputs
    if (command === 'pkeyutl' && args.includes('-encap')) {
      const secretIdx = args.indexOf('-secret')
      const outIdx = args.indexOf('-out')
      const ctFile = outIdx >= 0 && args[outIdx + 1] ? args[outIdx + 1] : 'ciphertext.bin'
      const secretFile = secretIdx >= 0 && args[secretIdx + 1] ? args[secretIdx + 1] : 'secret.bin'
      self.postMessage({
        type: 'LOG',
        stream: 'stdout',
        message: `\n💡 Encapsulation outputs:\n   Ciphertext: ${ctFile}  ←  use this as input to decapsulate\n   Shared secret: ${secretFile}`,
        requestId,
      })
    }

    // Inform user about public key extraction for genpkey
    if (command === 'genpkey') {
      // Same rule as FILE_CREATED: the key this run produced, whether the name
      // is new or was overwritten (re-running genpkey to the same -out path).
      const privateKeyFile = producedFiles.find((f) => f.endsWith('.key'))
      if (privateKeyFile) {
        const publicKeyFile = privateKeyFile.replace('.key', '.pub')
        self.postMessage({
          type: 'LOG',
          stream: 'stdout',
          message: `\n💡 To extract the public key, run:\n   openssl pkey -in ${privateKeyFile} -pubout -out ${publicKeyFile}`,
          requestId,
        })
      }
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message || 'Execution failed', requestId })
  } finally {
    self.postMessage({ type: 'DONE', requestId })
  }
}

var executeSimulation = async (
  clientConfig: string,
  serverConfig: string,
  files: { name: string; data: Uint8Array }[] = [],
  commands: string[] = [],
  requestId?: string
) => {
  self.postMessage({
    type: 'LOG',
    stream: 'stdout',
    message: `[Debug] executeSimulation started (PEM mode — bundled cert + key)`,
    requestId,
  })

  try {
    // 1. Load and Instantiate
    await loadOpenSSLScript('/wasm/openssl.js', requestId)
    const openSSLModule = await createOpenSSLInstance(requestId)

    // 2. Prepare Environment (Files)
    injectEntropy(openSSLModule, requestId)
    configureEnvironment(openSSLModule, requestId)
    if (files.length > 0) {
      writeInputFiles(openSSLModule, files, requestId)
    }

    // Write Config Files to FS
    const enc = new TextEncoder()
    const clientPath = '/ssl/client.cnf'
    const serverPath = '/ssl/server.cnf'
    openSSLModule.FS.writeFile(clientPath, enc.encode(clientConfig))
    openSSLModule.FS.writeFile(serverPath, enc.encode(serverConfig))

    // Write Command Script
    let scriptPath = ''
    if (commands && commands.length > 0) {
      scriptPath = '/ssl/commands.txt'
      const scriptContent = commands.join('\n')
      openSSLModule.FS.writeFile(scriptPath, enc.encode(scriptContent))
    }

    /* HSM-mode cwrap removed: the JS-side UI no longer exposes an HSM
     * toggle. The C-side `tls_simulation_set_hsm_mode` symbol still exists
     * in the linked WASM (left for a future, deliberate revival) but is
     * never called from JS, so the C global `g_hsm_mode_enabled` stays 0
     * and tls_simulation.c always takes the PEM-file branch. */

    // char* execute_tls_simulation(const char* client_conf_path, const char* server_conf_path, const char* script_path)
    const simulateC = openSSLModule.cwrap('execute_tls_simulation', 'string', [
      'string',
      'string',
      'string',
    ])

    if (!simulateC) {
      throw new Error('execute_tls_simulation function not found in WASM module')
    }

    // 4. Execute
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Running TLS Simulation (C-Wrapper)...',
      requestId,
    })

    const resultJson = simulateC(clientPath, serverPath, scriptPath)

    // 5. Return Result
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: 'SIMULATION_RESULT:' + resultJson,
      requestId,
    })
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message || 'Simulation failed', requestId })
  } finally {
    self.postMessage({ type: 'DONE', requestId })
  }
}

var executeCmpSimulation = async (
  eeKeyPath: string,
  subjectDn: string,
  reference: string,
  secret: string,
  caCertPath: string,
  caKeyPath: string,
  outCertPath: string,
  files: { name: string; data: Uint8Array }[] = [],
  requestId?: string
) => {
  try {
    await loadOpenSSLScript('/wasm/openssl.js', requestId)
    const module = await createOpenSSLInstance(requestId)
    injectEntropy(module, requestId)
    configureEnvironment(module, requestId)
    if (files.length > 0) writeInputFiles(module, files, requestId)

    const cmpC = module.cwrap('execute_cmp_simulation', 'string', [
      'string',
      'string',
      'string',
      'string',
      'string',
      'string',
      'string',
    ])
    if (!cmpC) throw new Error('execute_cmp_simulation not found in WASM module')

    const resultJson = cmpC(
      eeKeyPath,
      subjectDn,
      reference,
      secret,
      caCertPath,
      caKeyPath,
      outCertPath
    )

    // Try to slurp the issued cert from the WASM FS — only present on success.
    let certBytes: Uint8Array | null = null
    try {
      certBytes = module.FS.readFile(outCertPath)
    } catch (_e) {
      certBytes = null
    }

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: 'CMP_SIMULATION_RESULT:' + resultJson,
      requestId,
    })
    if (certBytes) {
      self.postMessage({
        type: 'FILE_CREATED',
        name: outCertPath.replace(/^\//, ''),
        data: certBytes,
        requestId,
      })
    }
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      error: error.message || 'CMP simulation failed',
      requestId,
    })
  } finally {
    self.postMessage({ type: 'DONE', requestId })
  }
}

var generateCaRoot = async (
  algorithm: string,
  subjectDn: string,
  keyOutPath: string,
  certOutPath: string,
  days: number,
  requestId?: string
) => {
  try {
    await loadOpenSSLScript('/wasm/openssl.js', requestId)
    const module = await createOpenSSLInstance(requestId)
    injectEntropy(module, requestId)
    configureEnvironment(module, requestId)

    const genCaC = module.cwrap('generate_mock_ca_root', 'string', [
      'string',
      'string',
      'string',
      'string',
      'number',
    ])
    if (!genCaC) throw new Error('generate_mock_ca_root not found in WASM module')

    const resultJson = genCaC(algorithm, subjectDn, keyOutPath, certOutPath, days)

    let keyBytes: Uint8Array | null = null
    let certBytes: Uint8Array | null = null
    try {
      keyBytes = module.FS.readFile(keyOutPath)
    } catch (_e) {
      keyBytes = null
    }
    try {
      certBytes = module.FS.readFile(certOutPath)
    } catch (_e) {
      certBytes = null
    }

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: 'CA_ROOT_RESULT:' + resultJson,
      requestId,
    })
    if (keyBytes) {
      self.postMessage({
        type: 'FILE_CREATED',
        name: keyOutPath.replace(/^\//, ''),
        data: keyBytes,
        requestId,
      })
    }
    if (certBytes) {
      self.postMessage({
        type: 'FILE_CREATED',
        name: certOutPath.replace(/^\//, ''),
        data: certBytes,
        requestId,
      })
    }
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      error: error.message || 'CA root generation failed',
      requestId,
    })
  } finally {
    self.postMessage({ type: 'DONE', requestId })
  }
}

/**
 * Generate a token-resident keypair and report the `pkcs11:` URI that now
 * addresses it. Runs the token lifecycle first, then snapshots the engine so
 * the key survives into subsequent commands.
 */
var generateHsmKey = async (algorithm: string, keyId: string, requestId?: string) => {
  try {
    await loadOpenSSLScript('/wasm/openssl.js', requestId)
    const module = await createOpenSSLInstance(requestId)
    injectEntropy(module, requestId)
    configureEnvironment(module, requestId)

    const tokenErr = ensureHsmToken(module, requestId)
    if (tokenErr) throw new Error(tokenErr)

    const genErr = generateKeyInToken(module, algorithm, keyId)
    if (genErr) throw new Error(genErr)

    // Persist immediately: unlike executeCommand there is no callMain here,
    // so nothing else will snapshot for us. The malloc-based pull is safe
    // here specifically because this module never had callMain invoked on
    // it — see takeTokenSnapshot's doc comment.
    saveHsmSnapshotDirectApi(module)

    const uri = 'pkcs11:object=' + keyId + ';type=private?pin-value=' + STUDIO_USER_PIN
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message:
        'Generated ' +
        algorithm +
        ' keypair in the token as "' +
        keyId +
        '".\n' +
        '   Private key URI: ' +
        uri +
        '\n' +
        '   The private key is token-resident — it has no file and cannot be exported.',
      requestId,
    })
    self.postMessage({ type: 'HSM_KEY_CREATED', keyId, algorithm, uri, requestId })
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      error: error.message || 'HSM key generation failed',
      requestId,
    })
  } finally {
    self.postMessage({ type: 'DONE', requestId })
  }
}

var executeSkeyOperation = async (opType: 'create' | 'derive', params: any, requestId?: string) => {
  try {
    // 1. Load/Init
    await loadOpenSSLScript('/wasm/openssl.js', requestId)
    const module = await createOpenSSLInstance(requestId)
    injectEntropy(module, requestId)

    // 2. Bind Functions
    // int create_skey_from_bytes(const unsigned char *key_bytes, size_t key_len, const char *alg_name)
    const createSkeyC = module.cwrap('create_skey_from_bytes', 'number', [
      'number',
      'number',
      'string',
    ])
    // int derive_skey(const char *kdf_name, const unsigned char *secret, size_t secret_len, const char *out_alg)
    const deriveSkeyC = module.cwrap('derive_skey', 'number', [
      'string',
      'number',
      'number',
      'string',
    ])

    // Check if functions exist (experimental check)
    if (!createSkeyC || !deriveSkeyC) {
      throw new Error('EVP_SKEY functions not found in WASM build')
    }

    let result = 0

    if (opType === 'create') {
      const { keyBytes, alg } = params
      const len = keyBytes.length
      // Allocate memory for keyBytes
      const ptr = module._malloc(len)
      module.HEAPU8.set(keyBytes, ptr)

      result = createSkeyC(ptr, len, alg)

      module._free(ptr)
    } else if (opType === 'derive') {
      const { kdf, sourceHandleId, outAlg } = params

      // Validate handle selection
      if (!sourceHandleId || sourceHandleId === 0) {
        throw new Error('Please select a source SKEY handle for derivation')
      }

      // Call new handle-based derive function
      // int derive_skey_from_handle(int source_handle_id, const char *kdf_name, const char *out_alg)
      const deriveFromHandleC = module.cwrap('derive_skey_from_handle', 'number', [
        'number',
        'string',
        'string',
      ])

      if (!deriveFromHandleC) {
        throw new Error(
          'derive_skey_from_handle function not found in WASM build. Please rebuild WASM with updated C code.'
        )
      }

      result = deriveFromHandleC(sourceHandleId, kdf, outAlg)
    }

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `SKEY OPERATION ${opType.toUpperCase()} RESULT: ${result === 1 ? 'SUCCESS' : 'FAILURE'}`,
      requestId,
    })

    if (result !== 1) {
      throw new Error('SKEY Operation returned failure code')
    }

    // 3. Scan for output files (SKEY files created by C code)
    scanOutputFiles(module, new Set<string>(), requestId)
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message || 'SKEY op failed', requestId })
  } finally {
    self.postMessage({ type: 'DONE', requestId })
  }
}

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data
  const requestId = event.data.requestId
  try {
    if (type === 'LOAD') {
      await loadOpenSSLScript(event.data.url, requestId)
      self.postMessage({ type: 'READY', requestId })
    } else if (type === 'COMMAND') {
      const { command, args, files, replaceVfs } = event.data as {
        type: 'COMMAND'
        command: string
        args: string[]
        files?: { name: string; data: Uint8Array }[]
        replaceVfs?: boolean
      }
      await executeCommand(command, args, files, requestId, replaceVfs)
    } else if (type === 'TLS_SIMULATE') {
      const { clientConfig, serverConfig, files, commands } = event.data as {
        type: 'TLS_SIMULATE'
        clientConfig: string
        serverConfig: string
        files?: { name: string; data: Uint8Array }[]
        commands?: string[]
        requestId?: string
      }
      await executeSimulation(clientConfig, serverConfig, files, commands || [], requestId)
    } else if (type === 'CMP_SIMULATE') {
      const d = event.data as {
        type: 'CMP_SIMULATE'
        eeKeyPath: string
        subjectDn: string
        reference: string
        secret: string
        caCertPath: string
        caKeyPath: string
        outCertPath: string
        files?: { name: string; data: Uint8Array }[]
        requestId?: string
      }
      await executeCmpSimulation(
        d.eeKeyPath,
        d.subjectDn,
        d.reference,
        d.secret,
        d.caCertPath,
        d.caKeyPath,
        d.outCertPath,
        d.files,
        requestId
      )
    } else if (type === 'GEN_CA_ROOT') {
      const g = event.data as {
        type: 'GEN_CA_ROOT'
        algorithm: string
        subjectDn: string
        keyOutPath: string
        certOutPath: string
        days: number
        requestId?: string
      }
      await generateCaRoot(g.algorithm, g.subjectDn, g.keyOutPath, g.certOutPath, g.days, requestId)
    } else if (type === 'DELETE_FILE') {
      const { name } = event.data as { type: 'DELETE_FILE'; name: string }
      // Files live in the persistent commandVfs between commands (each WASM
      // module instance is discarded after its command), so deletion is a
      // map removal. The old implementation created a FRESH instance and
      // unlinked from its empty FS — a complete no-op.
      const existed = commandVfs.delete(name)
      self.postMessage({
        type: 'LOG',
        stream: 'stdout',
        message: existed
          ? `[Worker] Deleted file: ${name}`
          : `[Worker] Delete skipped (not present): ${name}`,
        requestId,
      })

      self.postMessage({ type: 'DONE', requestId })
    } else if (type === 'HSM_KEYGEN') {
      const { algorithm, keyId } = event.data as {
        type: 'HSM_KEYGEN'
        algorithm: string
        keyId: string
      }
      await generateHsmKey(algorithm, keyId, requestId)
    } else if (type === 'SKEY_OPERATION') {
      const { opType, params } = event.data as any
      await executeSkeyOperation(opType, params, requestId)
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message, requestId })
  }
})

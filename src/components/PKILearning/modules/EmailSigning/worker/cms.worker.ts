// SPDX-License-Identifier: GPL-3.0-only
/**
 * cms.worker.ts — Web Worker that hosts the OpenSSL WASM module with the
 * pkcs11-provider statically linked, registers the provider at boot via
 * the exported `_pqctoday_cms_init` symbol, then exposes a postMessage
 * API for CMS / S/MIME operations.
 *
 * Message types:
 *   - LOAD_AND_INIT  → load WASM, call pqctoday_cms_init, report status
 *   - PING           → liveness check
 *   - CMS_GENKEY     → openssl genpkey -algorithm <alg>
 *   - CMS_MKCERT     → openssl req -new -x509 (self-signed)
 *   - CMS_SIGN       → openssl cms -sign
 *   - CMS_VERIFY     → openssl cms -verify
 *
 * Symbol-availability fallback: if `_pqctoday_cms_init` isn't in the
 * loaded openssl.js (i.e. the user is running on an old WASM bundle that
 * wasn't rebuilt with the Phase 1.A wiring), the init step reports
 * `provider_missing` instead of throwing. The Workshop UI surfaces that
 * as a clear "rebuild required" banner. CMS operations themselves use
 * software keys via the OpenSSL CLI and work without the provider.
 */

interface OpenSSLModule {
  callMain: (args: string[]) => number
  cwrap: (
    name: string,
    returnType: string | null,
    argTypes: string[]
  ) => (...args: unknown[]) => unknown
  FS: {
    writeFile: (path: string, data: Uint8Array | string) => void
    readFile: (path: string, opts?: { encoding?: 'utf8' | 'binary' }) => Uint8Array | string
    unlink: (path: string) => void
    mkdir: (path: string) => void
    stat: (path: string) => unknown
    readdir: (path: string) => string[]
  }
  ENV?: Record<string, string>
  // PKCS#11 C functions statically linked from softhsmv3 (present when the
  // WASM bundle was built with those symbols in EXPORTED_FUNCTIONS).
  _C_Initialize?: (pInitArgs: number) => number
  _C_GetSlotList?: (tokenPresent: number, pSlotList: number, pulCount: number) => number
  _C_InitToken?: (slotID: number, pPin: number, ulPinLen: number, pLabel: number) => number
  _C_OpenSession?: (
    slotID: number,
    flags: number,
    pApp: number,
    notify: number,
    phSession: number
  ) => number
  _C_Login?: (hSession: number, userType: number, pPin: number, ulPinLen: number) => number
  _C_Logout?: (hSession: number) => number
  _C_CloseSession?: (hSession: number) => number
  _C_InitPIN?: (hSession: number, pPin: number, ulPinLen: number) => number
  _malloc?: (size: number) => number
  _free?: (ptr: number) => void
  HEAPU8?: Uint8Array
  setValue?: (ptr: number, value: number, type: string) => void
  getValue?: (ptr: number, type: string) => number
  stringToUTF8?: (str: string, outPtr: number, maxBytesToWrite: number) => void
}

interface ModuleConfig {
  noInitialRun: boolean
  print: (text: string) => void
  printErr: (text: string) => void
  locateFile: (path: string) => string
}

declare function importScripts(...urls: string[]): void
declare const createOpenSSLModule: (cfg: ModuleConfig) => Promise<OpenSSLModule>

type CmsAlg =
  // Signature algorithms
  | 'ML-DSA-44'
  | 'ML-DSA-65'
  | 'ML-DSA-87'
  | 'SLH-DSA-SHA2-128s'
  | 'RSA-PSS'
  | 'EC'
  // KEM / encryption algorithms (used as recipient keys for cms -encrypt)
  | 'ML-KEM-512'
  | 'ML-KEM-768'
  | 'ML-KEM-1024'
  | 'RSA'
  | 'X25519'
  // LAMPS draft-ietf-lamps-pq-composite-sigs-19 composite signatures.
  // Implemented by pkcs11-provider's composite.c — see
  // pqctoday-hsm/src/vendor/pkcs11-provider/src/composite.c
  // (profiles registered at lines 91, 101, 111). Requires the HSM mode
  // (provider must be registered) — these algorithms are not in stock
  // OpenSSL and the worker forces useHsm = true when one is selected.
  | 'id-MLDSA44-RSA2048-PSS-SHA256'
  | 'id-MLDSA65-ECDSA-P256-SHA512'
  | 'id-MLDSA87-ECDSA-P384-SHA512'

type CmsCipher = 'aes-128-gcm' | 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305'

/**
 * When `useHsm` is true the worker routes the openssl invocation through
 * pkcs11-provider into softhsmv3 — the key never leaves the HSM. Requires
 * the openssl.wasm to have been rebuilt with `_pqctoday_cms_init` exported
 * AND for `LOAD_AND_INIT` to have completed with status `ok` / `already`.
 * When false (default) the worker uses software keys at `/ssl/<id>.key`.
 */
type WorkerInbound =
  | { type: 'LOAD_AND_INIT'; requestId?: string }
  | { type: 'PING'; requestId?: string }
  | {
      type: 'CMS_GENKEY'
      alg: CmsAlg
      keyId: string
      useHsm?: boolean
      requestId?: string
    }
  | {
      type: 'CMS_MKCERT'
      keyId: string
      certId: string
      subject: string
      days?: number
      useHsm?: boolean
      /**
       * When set, the cert is signed by the named issuer key (CA path)
       * instead of being self-signed. Required for KEM-only subject keys
       * (ML-KEM, X25519) that can't produce a self-signature.
       */
      issuerKeyId?: string
      requestId?: string
    }
  | {
      type: 'CMS_SIGN'
      keyId: string
      certId: string
      payload: Uint8Array
      useHsm?: boolean
      requestId?: string
    }
  | {
      type: 'CMS_VERIFY'
      signedP7m: Uint8Array
      certId: string
      useHsm?: boolean
      requestId?: string
    }
  | {
      type: 'CMS_ENCRYPT'
      recipientCertId: string
      payload: Uint8Array
      cipher?: CmsCipher
      requestId?: string
    }
  | {
      type: 'CMS_DECRYPT'
      enveloped: Uint8Array
      recipientCertId: string
      recipientKeyId: string
      useHsm?: boolean
      requestId?: string
    }
  | {
      type: 'CMS_DUAL_SIGN'
      payload: Uint8Array
      pqKeyId: string
      pqCertId: string
      classicalKeyId: string
      classicalCertId: string
      useHsm?: boolean
      requestId?: string
    }
  | {
      type: 'CMS_DUAL_VERIFY'
      signedP7m: Uint8Array
      pqCertId: string
      classicalCertId: string
      useHsm?: boolean
      requestId?: string
    }

type WorkerOutbound =
  | { type: 'READY'; requestId?: string }
  | {
      type: 'INIT_DONE'
      status: 'ok' | 'already' | 'provider_missing' | 'provider_error'
      code: number
      detail?: string
      requestId?: string
    }
  | { type: 'PONG'; requestId?: string }
  | { type: 'LOG'; stream: 'stdout' | 'stderr'; message: string; requestId?: string }
  | { type: 'ERROR'; error: string; requestId?: string }
  | { type: 'CMS_GENKEY_RESULT'; keyPem: string; pubPem: string; requestId?: string }
  | { type: 'CMS_MKCERT_RESULT'; certPem: string; requestId?: string }
  | { type: 'CMS_SIGN_RESULT'; signedP7m: Uint8Array; requestId?: string }
  | {
      type: 'CMS_VERIFY_RESULT'
      ok: boolean
      payload?: Uint8Array
      stderrTail: string
      requestId?: string
    }
  | { type: 'CMS_ENCRYPT_RESULT'; enveloped: Uint8Array; requestId?: string }
  | {
      type: 'CMS_DECRYPT_RESULT'
      ok: boolean
      payload?: Uint8Array
      stderrTail: string
      requestId?: string
    }
  | { type: 'CMS_DUAL_SIGN_RESULT'; signedP7m: Uint8Array; requestId?: string }
  | {
      type: 'CMS_DUAL_VERIFY_RESULT'
      /** True when `openssl cms -verify -noverify` succeeded — meaning every
       *  SignerInfo in the .p7m signed-attributes verified against its
       *  embedded cert's public key. `-noverify` skips chain validation
       *  only; signature math is still checked. */
      ok: boolean
      /** Number of SignerInfo entries the verifier saw. Drawn from openssl
       *  stdout / stderr summary — diagnostic, not authoritative. */
      signerCount: number
      payload?: Uint8Array
      stderr: string
      requestId?: string
    }

// The openssl.wasm bundle is built with -sEXIT_RUNTIME=1, so each callMain()
// tears down the runtime on exit. We work around that the same way
// OpenSSLStudio's worker does: load the script ONCE (cache the factory), but
// instantiate a FRESH module for every command. The factory promise is
// memoized; the per-command instance promise is rebuilt each call.
let factoryReady: Promise<void> | null = null

// State preserved across commands: virtual files written into /ssl. We rehydrate
// them into each freshly-instantiated module so chained calls (genpkey → req →
// cms sign → cms verify) see each other's outputs.
const vfs = new Map<string, Uint8Array>()

// Capture buffer for the duration of a callMain — every LOG event posted
// while `_capturing` is true is mirrored into this buffer so the caller
// can include the tail in error / verify responses.
let _capturing = false
let captureBuffer: { stdout: string[]; stderr: string[] } = { stdout: [], stderr: [] }

function post(msg: WorkerOutbound): void {
  if (_capturing && msg.type === 'LOG') {
    captureBuffer[msg.stream].push(msg.message)
  }
  ;(self as unknown as Worker).postMessage(msg)
}

async function loadFactory(): Promise<void> {
  if (factoryReady) return factoryReady
  factoryReady = (async () => {
    importScripts('/wasm/openssl.js')
  })()
  return factoryReady
}

// Minimal OpenSSL config — same shape OpenSSLStudio's worker uses. OpenSSL
// 3.x's `req`, `cms`, `x509` apps read this on startup; without it they bail
// with "BIO_new_file: No such file or directory" looking for openssl.cnf.
const MINIMAL_OPENSSL_CNF = `
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

// HSM-aware OpenSSL config written over openssl.cnf after pqctoday_cms_init()
// succeeds. Mirrors the PKCS11_CMS_CONF constant in cms_provider_init.c so that
// if callMain's OPENSSL_init_ssl() re-reads from OPENSSL_CONF it sees
// [pkcs11_sect] with the correct module path and doesn't overwrite the config
// that pqctoday_cms_init loaded from /ssl/pkcs11.cnf with a MINIMAL version.
// Without this, p11prov_module_init() gets mctx->path=NULL → dlopen(NULL) →
// returns NULL in pkcs11_static_shim.c → CKR_GENERAL_ERROR → "Module
// initialization failed!".
const HSM_OPENSSL_CNF = `openssl_conf = openssl_init
[openssl_init]
providers = provider_sect
[provider_sect]
default = default_sect
pkcs11 = pkcs11_sect
[default_sect]
activate = 1
[pkcs11_sect]
module = wasm:softhsmv3
pkcs11-module-path = wasm:softhsmv3
pkcs11-module-token-pin = 1234
activate = 1
[req]
distinguished_name = req_distinguished_name
[req_distinguished_name]
`

function configureEnvironment(M: OpenSSLModule): void {
  // Inject 4 KB of crypto-strong entropy so genpkey doesn't fall back to
  // weak sources in the Emscripten /dev/urandom shim.
  try {
    const seed = new Uint8Array(4096)
    crypto.getRandomValues(seed)
    try {
      M.FS.writeFile('/random.seed', seed)
    } catch {
      /* ignore */
    }
    try {
      M.FS.writeFile('/dev/urandom', seed)
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
  // Create every directory OpenSSL might look in.
  for (const dir of ['/ssl', '/usr', '/usr/local', '/usr/local/ssl', '/openssl-wasm']) {
    try {
      M.FS.mkdir(dir)
    } catch {
      /* already exists — fine */
    }
  }
  // Write the config at every well-known location so `req`/`cms` find it
  // regardless of which default the WASM was compiled with.
  const cnfBytes = new TextEncoder().encode(MINIMAL_OPENSSL_CNF)
  for (const path of [
    '/ssl/openssl.cnf',
    '/usr/local/ssl/openssl.cnf',
    '/openssl-wasm/openssl.cnf',
    '/openssl.cnf',
  ]) {
    try {
      M.FS.writeFile(path, cnfBytes)
    } catch {
      /* ignore */
    }
  }
  // Belt-and-suspenders: point OPENSSL_CONF directly at /ssl/openssl.cnf.
  if (M.ENV) {
    M.ENV['OPENSSL_CONF'] = '/ssl/openssl.cnf'
    M.ENV['RANDFILE'] = '/random.seed'
    // Pre-set PKCS11_PROVIDER_MODULE so p11prov_module_new() always resolves the
    // module path to the statically-linked softhsmv3 — even when the app libctx
    // processes the explicit -provider pkcs11 flag BEFORE reading [pkcs11_sect]
    // from OPENSSL_CONF.  This is the highest-priority path in interface.c.
    M.ENV['PKCS11_PROVIDER_MODULE'] = 'wasm:softhsmv3'
  }
}

// ── SoftHSMv3 file-backend token persistence ─────────────────────────────────
//
// EXIT_RUNTIME=1 in the WASM build means every callMain() tears down the
// runtime — so each `newModule()` produces a completely fresh softhsmv3
// in-memory state. Keys generated in module A are invisible to module B.
//
// Solution: configure softhsmv3 to use its FILE backend (objectstore.backend
// = file) with the token directory under /ssl/ so that generated key-object
// files land on MEMFS. After each HSM key-generation step we walk
// /ssl/softhsm-tokens and snapshot every file into the worker-scope `vfs`
// map. On the next newModule() call those snapshots are rehydrated back into
// the fresh module's MEMFS before pkcs11-provider ever calls C_Initialize —
// so softhsmv3 finds the existing initialized token (with all its key
// objects) and pkcs11: URI operations work cross-module.

const SOFTHSM_CONF_PATH = '/ssl/softhsm.conf'
const SOFTHSM_TOKEN_DIR = '/ssl/softhsm-tokens'
const SOFTHSM_SO_PIN = '1234'
const SOFTHSM_USER_PIN = '1234'
const CKR_CRYPTOKI_ALREADY_INITIALIZED = 0x191
const CKF_RW_SESSION_VAL = 0x0002
const CKF_SERIAL_SESSION_VAL = 0x0004
const CKU_SO_VAL = 0

/** Ensure all parent directories of `filePath` exist in M's MEMFS. */
function ensureDirs(M: OpenSSLModule, filePath: string): void {
  const parts = filePath.split('/')
  let current = ''
  for (let i = 0; i < parts.length - 1; i++) {
    if (!parts[i]) continue
    current += '/' + parts[i]
    try {
      M.FS.mkdir(current)
    } catch {
      /* already exists — fine */
    }
  }
}

/**
 * Write /ssl/softhsm.conf with file-backend config, create the token dir,
 * and point SOFTHSM2_CONF at it. Must be called before vfs rehydration so
 * the token dir exists when we try to write softhsm object files into it.
 */
function setupSoftHsmConf(M: OpenSSLModule): void {
  try {
    M.FS.mkdir(SOFTHSM_TOKEN_DIR)
  } catch {
    /* already exists */
  }
  const conf =
    `directories.tokendir = ${SOFTHSM_TOKEN_DIR}\n` +
    `objectstore.backend = file\n` +
    `log.level = ERROR\n`
  try {
    M.FS.writeFile(SOFTHSM_CONF_PATH, new TextEncoder().encode(conf))
  } catch {
    /* ignore */
  }
  if (M.ENV) {
    M.ENV['SOFTHSM2_CONF'] = SOFTHSM_CONF_PATH
    // Repeat here so it's guaranteed set even if setupSoftHsmConf is called
    // independently of configureEnvironment in future refactors.
    M.ENV['PKCS11_PROVIDER_MODULE'] = 'wasm:softhsmv3'
  }
}

/** Recursively walk `dir` in M's MEMFS and snapshot every file into vfs. */
function walkAndPersist(M: OpenSSLModule, dir: string): void {
  let entries: string[]
  try {
    entries = M.FS.readdir(dir)
  } catch {
    return
  }
  for (const name of entries) {
    if (name === '.' || name === '..') continue
    const p = `${dir}/${name}`
    try {
      const stat = M.FS.stat(p) as { mode: number }
      if ((stat.mode & 0o170000) === 0o040000) {
        walkAndPersist(M, p)
      } else {
        const data = M.FS.readFile(p) as Uint8Array
        vfs.set(p, data)
      }
    } catch {
      /* skip unreadable entries */
    }
  }
}

/** Save all /ssl/softhsm-tokens/** files to vfs so the next module instance
 *  finds the token — including any key objects written by a genpkey command. */
function persistSoftHsmTokenFiles(M: OpenSSLModule): void {
  walkAndPersist(M, SOFTHSM_TOKEN_DIR)
}

/**
 * Initialize the softhsmv3 token via direct PKCS#11 calls if no token files
 * exist in vfs yet. After C_InitToken + C_InitPIN the token directory has its
 * baseline files; we persist them immediately so subsequent modules restore
 * them during vfs rehydration and pkcs11-provider finds an initialized token.
 *
 * Called BEFORE ensureProviderInit so pkcs11-provider's C_GetSlotList (inside
 * OSSL_PROVIDER_load) sees an initialized token on its first look.
 *
 * If token files ARE in vfs they have already been rehydrated to the FS by
 * the time this function runs — softhsmv3 will find them during the
 * C_Initialize call inside ensureProviderInit. This function is a no-op in
 * that case.
 *
 * Gracefully degrades (returns without throwing) if the C_* symbols are
 * missing from this WASM build.
 */
function initSoftHsmTokenIfNeeded(M: OpenSSLModule): void {
  // Always call _C_Initialize(0) unconditionally so that softhsmv3 scans the
  // restored token files and builds its in-memory slot list BEFORE
  // pkcs11-provider's lazy p11prov_module_init fires. Without this,
  // pkcs11-provider calls C_GetSlotList on an un-primed softhsmv3 and sees no
  // initialized tokens, causing p11prov_ctx_status to report "Module
  // initialization failed!" on the very first pkcs11: URI access. Subsequent
  // C_Initialize calls return CKR_CRYPTOKI_ALREADY_INITIALIZED (0x191), which
  // pkcs11-provider explicitly tolerates.

  // Grab the exported PKCS#11 C functions from the module. These are
  // present when the WASM was built with the full EXPORTED_FUNCTIONS list.
  const {
    _C_Initialize,
    _C_GetSlotList,
    _C_InitToken,
    _C_OpenSession,
    _C_Login,
    _C_InitPIN,
    _C_Logout,
    _C_CloseSession,
    _malloc,
    _free,
    HEAPU8,
    setValue,
    getValue,
    stringToUTF8,
  } = M as OpenSSLModule & Record<string, unknown>

  if (
    typeof _C_Initialize !== 'function' ||
    typeof _C_GetSlotList !== 'function' ||
    typeof _C_InitToken !== 'function' ||
    typeof _C_OpenSession !== 'function' ||
    typeof _C_Login !== 'function' ||
    typeof _C_InitPIN !== 'function' ||
    typeof _C_Logout !== 'function' ||
    typeof _C_CloseSession !== 'function' ||
    typeof _malloc !== 'function' ||
    typeof _free !== 'function' ||
    typeof setValue !== 'function' ||
    typeof getValue !== 'function' ||
    typeof stringToUTF8 !== 'function' ||
    !(HEAPU8 instanceof Uint8Array)
  ) {
    // Old WASM build — token init not possible, HSM mode will fail at genpkey.
    return
  }

  type P11Fn = (...args: number[]) => number
  const pC_Initialize = _C_Initialize as P11Fn
  const pC_GetSlotList = _C_GetSlotList as P11Fn
  const pC_InitToken = _C_InitToken as P11Fn
  const pC_OpenSession = _C_OpenSession as P11Fn
  const pC_Login = _C_Login as P11Fn
  const pC_InitPIN = _C_InitPIN as P11Fn
  const pC_Logout = _C_Logout as P11Fn
  const pC_CloseSession = _C_CloseSession as P11Fn
  const pmalloc = _malloc as P11Fn
  const pfree = _free as P11Fn
  const psetValue = setValue as (p: number, v: number, t: string) => void
  const pgetValue = getValue as (p: number, t: string) => number
  const pstringToUTF8 = stringToUTF8 as (s: string, p: number, n: number) => void
  const pHEAPU8 = HEAPU8 as Uint8Array

  // C_Initialize — prime softhsmv3 so it reads the token directory from MEMFS.
  // Tolerate ALREADY_INITIALIZED (0x191).
  const rv0 = pC_Initialize(0)
  if (rv0 !== 0 && rv0 !== CKR_CRYPTOKI_ALREADY_INITIALIZED) return

  // If token files were already in vfs they are now restored to MEMFS and
  // softhsmv3 has loaded the token (including all key objects). Return now —
  // do NOT call C_InitToken. Per PKCS#11 §11.6, calling C_InitToken on an
  // already-initialized token with the CORRECT SO PIN resets the token and
  // destroys ALL key objects. Calling it here would silently wipe alice's
  // ML-DSA-65 key on every cmsMkCert / cmsSign module call.
  const tokenExists = [...vfs.keys()].some((k) => k.startsWith(SOFTHSM_TOKEN_DIR + '/'))
  if (tokenExists) return

  // ── First-time initialization path ─────────────────────────────────────
  // Get the uninitialized virtual slot.
  const cntP = pmalloc(4)
  psetValue(cntP, 0, 'i32')
  if (pC_GetSlotList(0, 0, cntP) !== 0) {
    pfree(cntP)
    return
  }
  const cnt = pgetValue(cntP, 'i32')
  pfree(cntP)
  if (cnt === 0) return
  const listP = pmalloc(cnt * 4)
  const c2P = pmalloc(4)
  psetValue(c2P, cnt, 'i32')
  if (pC_GetSlotList(0, listP, c2P) !== 0) {
    pfree(listP)
    pfree(c2P)
    return
  }
  const slot0 = pgetValue(listP, 'i32')
  pfree(listP)
  pfree(c2P)

  // C_InitToken — create the token with label + SO PIN.
  const labelBuf = new Uint8Array(32).fill(0x20)
  const labelStr = 'cms-workshop'
  for (let i = 0; i < labelStr.length; i++) labelBuf[i] = labelStr.charCodeAt(i)
  const labelP = pmalloc(32)
  pHEAPU8.set(labelBuf, labelP)
  const soPin = SOFTHSM_SO_PIN
  const soPinP = pmalloc(soPin.length + 1)
  pstringToUTF8(soPin, soPinP, soPin.length + 1)
  const initRv = pC_InitToken(slot0, soPinP, soPin.length, labelP)
  pfree(soPinP)
  pfree(labelP)
  if (initRv !== 0) return // hardware error — unexpected on fresh token

  // Get slot list again — softhsmv3 moves the initialized token to a new slot
  const c3P = pmalloc(4)
  psetValue(c3P, 0, 'i32')
  if (pC_GetSlotList(0, 0, c3P) !== 0) {
    pfree(c3P)
    return
  }
  const cnt3 = pgetValue(c3P, 'i32')
  pfree(c3P)
  if (cnt3 === 0) return
  const list3P = pmalloc(cnt3 * 4)
  const c4P = pmalloc(4)
  psetValue(c4P, cnt3, 'i32')
  if (pC_GetSlotList(0, list3P, c4P) !== 0) {
    pfree(list3P)
    pfree(c4P)
    return
  }
  const newSlot = pgetValue(list3P, 'i32')
  pfree(list3P)
  pfree(c4P)

  // C_OpenSession (SO) → C_Login(SO) → C_InitPIN(userPin) → C_Logout → C_CloseSession
  const hSP = pmalloc(4)
  psetValue(hSP, 0, 'i32')
  if (pC_OpenSession(newSlot, CKF_RW_SESSION_VAL | CKF_SERIAL_SESSION_VAL, 0, 0, hSP) === 0) {
    const hSoSess = pgetValue(hSP, 'i32')
    const soPinP2 = pmalloc(soPin.length + 1)
    pstringToUTF8(soPin, soPinP2, soPin.length + 1)
    pC_Login(hSoSess, CKU_SO_VAL, soPinP2, soPin.length)
    pfree(soPinP2)
    const userPin = SOFTHSM_USER_PIN
    const uPinP = pmalloc(userPin.length + 1)
    pstringToUTF8(userPin, uPinP, userPin.length + 1)
    pC_InitPIN(hSoSess, uPinP, userPin.length)
    pfree(uPinP)
    pC_Logout(hSoSess)
    pC_CloseSession(hSoSess)
  }
  pfree(hSP)

  // Persist the freshly-created (empty) token directory so the next module
  // instance finds an initialized token and only calls C_Initialize.
  persistSoftHsmTokenFiles(M)
}

/**
 * Mint a fresh OpenSSL module. Pass `withHsm: true` to also register the
 * pkcs11-provider on this module BEFORE returning — every HSM-routed
 * command needs this because provider registration is module-scoped state
 * and EXIT_RUNTIME=1 means each module is single-use.
 */
async function newModule(withHsm = false): Promise<OpenSSLModule> {
  await loadFactory()
  const M = await createOpenSSLModule({
    noInitialRun: true,
    print: (text: string) => post({ type: 'LOG', stream: 'stdout', message: text }),
    printErr: (text: string) => post({ type: 'LOG', stream: 'stderr', message: text }),
    locateFile: (path: string) => (path.endsWith('.wasm') ? '/wasm/openssl.wasm' : path),
  })
  configureEnvironment(M)
  // For HSM mode: write softhsm.conf and create the token dir BEFORE vfs
  // rehydration so that softhsm object files under /ssl/softhsm-tokens/ can
  // be written into an already-existing directory.
  if (withHsm) setupSoftHsmConf(M)
  // Rehydrate the in-memory file system from prior commands.  ensureDirs
  // creates any missing parent directories (e.g. /ssl/softhsm-tokens/UUID/)
  // so writeFile succeeds for nested softhsm token object files.
  for (const [path, data] of vfs) {
    try {
      ensureDirs(M, path)
      M.FS.writeFile(path, data)
    } catch {
      /* skip */
    }
  }
  if (withHsm) {
    // Initialize the softhsm token via direct PKCS#11 calls if this is the
    // first HSM use (no token files in vfs yet). Must happen BEFORE
    // ensureProviderInit so pkcs11-provider's C_GetSlotList sees an initialized
    // token on its very first look during OSSL_PROVIDER_load.
    initSoftHsmTokenIfNeeded(M)
    const initCode = ensureProviderInit(M)
    if (initCode < 0) {
      throw new Error(
        `pqctoday_cms_init returned ${initCode} — WASM bundle may not have been rebuilt with the provider shim. Run \`npm run build:openssl-wasm\`.`
      )
    }
    // Overwrite OPENSSL_CONF paths with an HSM-aware config that includes
    // [pkcs11_sect]. callMain's OPENSSL_init_ssl() may re-read from
    // OPENSSL_CONF; if it finds MINIMAL (no pkcs11_sect) it can blot out the
    // [pkcs11_sect] that pqctoday_cms_init loaded from /ssl/pkcs11.cnf, leaving
    // pkcs11-provider with mctx->path=NULL → dlopen(NULL) → "Module
    // initialization failed!" on every subsequent CLI invocation.
    const hsmCnfBytes = new TextEncoder().encode(HSM_OPENSSL_CNF)
    for (const path of [
      '/ssl/openssl.cnf',
      '/usr/local/ssl/openssl.cnf',
      '/openssl-wasm/openssl.cnf',
      '/openssl.cnf',
    ]) {
      try {
        M.FS.writeFile(path, hsmCnfBytes)
      } catch {
        /* ignore — path may not exist */
      }
    }
  }
  return M
}

/**
 * Wrapper around `newModule()` that posts a friendly ERROR back to the
 * service if module construction or provider init fails. Handlers should
 * use this in place of raw `newModule()` so HSM-init failures show up in
 * the demo UI instead of as unhandled promise rejections.
 */
async function newModuleSafe(
  useHsm: boolean | undefined,
  requestId: string | undefined
): Promise<OpenSSLModule | null> {
  try {
    return await newModule(Boolean(useHsm))
  } catch (err) {
    post({
      type: 'ERROR',
      error: err instanceof Error ? err.message : String(err),
      requestId,
    })
    return null
  }
}

/**
 * Register the statically-linked pkcs11-provider with THIS module's OpenSSL
 * runtime. Must be called on every fresh module instance that runs an HSM
 * command — provider registration is module-scoped state and each
 * EXIT_RUNTIME=1 module starts with a clean slate.
 *
 * Without this, openssl tries to dlopen `/usr/local/lib/ossl-modules/pkcs11.so`
 * (which doesn't exist in the WASM filesystem) and fails with
 * `dso_dlfcn.c:115:filename(...): <NULL>`. With it, `OSSL_PROVIDER_load`
 * finds the registered builtin via `pkcs11_static_shim.c` interception.
 *
 * Returns the rc from `pqctoday_cms_init`:
 *   0  → provider freshly loaded on this module
 *   1  → already loaded (idempotent no-op on the same module)
 *  <0  → init failed (see cms_provider_init.c for codes)
 */
function ensureProviderInit(M: OpenSSLModule): number {
  let init: (() => number) | null = null
  try {
    init = M.cwrap('pqctoday_cms_init', 'number', []) as () => number
  } catch {
    return -100 // symbol missing — WASM not rebuilt
  }
  if (!init) return -100
  try {
    return Number(init())
  } catch {
    return -101 // C function threw
  }
}

// Snapshot any /ssl/* file the worker wrote during this call into the
// persistent vfs map so the next module instance sees it.
function persistVfs(M: OpenSSLModule, paths: string[]): void {
  for (const p of paths) {
    if (!p.startsWith('/ssl/')) continue
    try {
      const data = M.FS.readFile(p) as Uint8Array
      vfs.set(p, data)
    } catch {
      /* path didn't exist post-command — fine */
    }
  }
}

async function initProvider(requestId?: string): Promise<void> {
  let M: OpenSSLModule
  try {
    M = await newModule()
  } catch (err) {
    post({ type: 'ERROR', error: `WASM load failed: ${String(err)}`, requestId })
    return
  }
  let init: (() => number) | null = null
  try {
    init = M.cwrap('pqctoday_cms_init', 'number', []) as () => number
  } catch {
    init = null
  }
  if (!init) {
    post({
      type: 'INIT_DONE',
      status: 'provider_missing',
      code: -100,
      detail:
        'openssl.wasm does not export pqctoday_cms_init — rebuild via `npm run build:openssl-wasm`',
      requestId,
    })
    return
  }
  let code: number
  try {
    code = Number(init())
  } catch (err) {
    post({
      type: 'INIT_DONE',
      status: 'provider_error',
      code: -101,
      detail: `pqctoday_cms_init threw: ${String(err)}`,
      requestId,
    })
    return
  }
  if (code === 0) {
    post({ type: 'INIT_DONE', status: 'ok', code: 0, requestId })
  } else if (code === 1) {
    post({ type: 'INIT_DONE', status: 'already', code: 1, requestId })
  } else {
    post({
      type: 'INIT_DONE',
      status: 'provider_error',
      code,
      detail: cmsInitErrorMessage(code),
      requestId,
    })
  }
}

function cmsInitErrorMessage(code: number): string {
  switch (code) {
    case -1:
      return 'OSSL_PROVIDER_add_builtin(pkcs11) failed'
    case -2:
      return 'could not write /ssl/pkcs11.cnf'
    case -3:
      return 'OSSL_LIB_CTX_load_config failed'
    case -4:
      return 'OSSL_PROVIDER_load(pkcs11) failed'
    default:
      return `pqctoday_cms_init returned unexpected code ${code}`
  }
}

function runOpenssl(M: OpenSSLModule, args: string[]): { rc: number; stderr: string } {
  _capturing = true
  captureBuffer = { stdout: [], stderr: [] }
  let rc = -1
  try {
    rc = M.callMain(args)
  } catch (err) {
    captureBuffer.stderr.push(`callMain threw: ${String(err)}`)
  } finally {
    _capturing = false
  }
  const stderr = captureBuffer.stderr.join('\n')
  return { rc, stderr }
}

function fileExists(M: OpenSSLModule, path: string): boolean {
  try {
    M.FS.stat(path)
    return true
  } catch {
    return false
  }
}

function readPem(M: OpenSSLModule, path: string): string {
  return new TextDecoder().decode(M.FS.readFile(path) as Uint8Array)
}

function readBin(M: OpenSSLModule, path: string): Uint8Array {
  return M.FS.readFile(path) as Uint8Array
}

function writeBin(M: OpenSSLModule, path: string, data: Uint8Array): void {
  M.FS.writeFile(path, data)
}

function safeUnlink(M: OpenSSLModule, path: string): void {
  try {
    M.FS.unlink(path)
  } catch {
    /* ignore */
  }
}

/** PKCS#11 URI for the named key inside softhsmv3 token 0. The pin-value
 *  parameter has to match the one written into /ssl/pkcs11.cnf by
 *  pqctoday_cms_init (currently `1234`). */
function pkcs11Uri(keyId: string): string {
  return `pkcs11:object=${keyId};pin-value=1234`
}

// pqctoday_cms_init() registers pkcs11-provider as a builtin in the GLOBAL
// OpenSSL lib ctx (NULL). CLI `-provider pkcs11` flags create a SEPARATE
// app_libctx that does NOT inherit that builtin; OpenSSL falls back to
// dlopen("/usr/local/lib/ossl-modules/pkcs11.so") → NULL (file absent in
// WASM) → "Module initialization failed!".  Without the flags the CLI uses
// the global lib ctx where the provider is already loaded, pkcs11: URI store
// ops work, and the HSM path is fully functional.  HSM_OPENSSL_CNF written
// by newModule() guarantees [pkcs11_sect] is in OPENSSL_CONF before callMain
// so the provider auto-activates even if the config is re-read on init.
const HSM_PROVIDER_FLAGS: string[] = []

async function cmsGenKey(
  alg: CmsAlg,
  keyId: string,
  useHsm: boolean | undefined,
  requestId?: string
): Promise<void> {
  const M = await newModuleSafe(useHsm, requestId)
  if (!M) return
  const keyPath = `/ssl/${keyId}.key`
  // Clear prior versions from both the live FS and our persistent vfs cache.
  vfs.delete(keyPath)
  safeUnlink(M, keyPath)

  if (useHsm) {
    // genpkey into softhsmv3 via pkcs11-provider. The key destination is a
    // pkcs11: URI passed as `-out` — pkcs11-provider registers an OSSL_STORE
    // writer for the pkcs11: scheme so new key material is stored in the HSM
    // (softhsmv3 token) rather than serialized to a PEM file. No file is
    // written to the WASM FS at all. See pkcs11-provider/HOWTO.md §"Key
    // generation". Downstream calls (cmsSign, cmsMkCert, cmsDecrypt) already
    // reference the key via pkcs11Uri(keyId) when useHsm=true, so no VFS
    // entry is needed here.
    const argv = ['genpkey', ...HSM_PROVIDER_FLAGS, '-algorithm', alg, '-out', pkcs11Uri(keyId)]
    const { rc, stderr } = runOpenssl(M, argv)
    if (rc !== 0) {
      post({
        type: 'ERROR',
        error: `hsm genpkey ${alg} failed (rc=${rc}): ${stderr.slice(-300)}`,
        requestId,
      })
      return
    }
    // Key lives in softhsmv3's file-backed token. Persist ALL token object
    // files to vfs so the next module instance finds the key when it restores
    // from vfs during rehydration. Without this persist, the key is lost when
    // this module's WASM heap is GC'd.
    persistSoftHsmTokenFiles(M)
    // Return a human-readable placeholder (no PEM file was written).
    const keyPem = `# HSM-resident key\n# URI: ${pkcs11Uri(keyId)}\n# Algorithm: ${alg}\n`
    post({ type: 'CMS_GENKEY_RESULT', keyPem, pubPem: '', requestId })
    return
  }

  // Software path (default). Different families need different -pkeyopt flags:
  //   - EC: must pick a curve (P-256 default)
  //   - RSA / RSA-PSS: must pick a modulus size (3072 default; FIPS 140-3 floor)
  //   - ML-DSA / ML-KEM / SLH-DSA / X25519: no -pkeyopt needed in OpenSSL 3.5+
  const argv =
    alg === 'EC'
      ? ['genpkey', '-algorithm', 'EC', '-pkeyopt', 'ec_paramgen_curve:P-256', '-out', keyPath]
      : alg === 'RSA-PSS' || alg === 'RSA'
        ? ['genpkey', '-algorithm', alg, '-pkeyopt', 'rsa_keygen_bits:3072', '-out', keyPath]
        : ['genpkey', '-algorithm', alg, '-out', keyPath]
  const { rc, stderr } = runOpenssl(M, argv)
  if (rc !== 0 || !fileExists(M, keyPath)) {
    post({
      type: 'ERROR',
      error: `genpkey ${alg} failed (rc=${rc}): ${stderr.slice(-300)}`,
      requestId,
    })
    return
  }
  const keyPem = readPem(M, keyPath)
  persistVfs(M, [keyPath])
  // Skip the public-key extraction step — it would burn another runtime and
  // require a fresh module. PEM key already carries enough metadata for the
  // demo UI; the verify path uses the cert instead of the bare pubkey.
  post({ type: 'CMS_GENKEY_RESULT', keyPem, pubPem: '', requestId })
}

async function cmsMkCert(
  keyId: string,
  certId: string,
  subject: string,
  days: number | undefined,
  useHsm: boolean | undefined,
  issuerKeyId: string | undefined,
  requestId?: string
): Promise<void> {
  const M = await newModuleSafe(useHsm, requestId)
  if (!M) return
  const subjectKeyPath = `/ssl/${keyId}.key`
  const subjectPubPath = `/ssl/${keyId}.pub`
  const certPath = `/ssl/${certId}.crt`
  if (!useHsm && !fileExists(M, subjectKeyPath)) {
    post({ type: 'ERROR', error: `subject key not found: ${subjectKeyPath}`, requestId })
    return
  }
  vfs.delete(certPath)
  safeUnlink(M, certPath)

  if (issuerKeyId) {
    // CA-signed path. Required when the subject key can't self-sign
    // (ML-KEM / X25519). Three openssl invocations:
    //   1. `pkey -pubout` extracts the subject public key.
    //   2. `x509 -new -CA <issuer.crt> -CAkey <issuer.key> -force_pubkey <subject.pub>`
    //      mints a cert that carries the subject's pubkey but is signed by
    //      the issuer. `-force_pubkey` only exists on the `x509` subcommand
    //      (NOT `req`). The cert's Issuer DN is taken from issuer.crt's
    //      Subject; the new cert's Subject DN comes from -subj.
    //
    // EXIT_RUNTIME=1 in the WASM build means each callMain tears down the
    // module — so step 2 runs on a fresh module instance. The vfs map
    // persists subject.pub + issuer.crt + issuer.key across the call.
    // Convention: the issuer cert lives at `/ssl/${issuerKeyId}.crt`
    // (matches MLKEMEncryptDemo's CA_KEY_ID === CA_CERT_ID setup).
    const issuerKeyPath = `/ssl/${issuerKeyId}.key`
    const issuerCertPath = `/ssl/${issuerKeyId}.crt`
    if (!useHsm && !fileExists(M, issuerKeyPath)) {
      post({ type: 'ERROR', error: `issuer key not found: ${issuerKeyPath}`, requestId })
      return
    }
    if (!fileExists(M, issuerCertPath)) {
      post({
        type: 'ERROR',
        error: `issuer cert not found: ${issuerCertPath} — caller must mint the CA cert before issuing a subject cert from it`,
        requestId,
      })
      return
    }
    safeUnlink(M, subjectPubPath)
    const subjectKeyArg = useHsm ? pkcs11Uri(keyId) : subjectKeyPath
    const issuerKeyArg = useHsm ? pkcs11Uri(issuerKeyId) : issuerKeyPath
    const providerArgs = useHsm ? HSM_PROVIDER_FLAGS : []

    // Step 1 — extract subject pubkey. After this callMain the runtime is
    // dead; we discard the module before step 2.
    const pubRc = runOpenssl(M, [
      'pkey',
      ...providerArgs,
      '-in',
      subjectKeyArg,
      '-pubout',
      '-out',
      subjectPubPath,
    ])
    if (pubRc.rc !== 0 || !fileExists(M, subjectPubPath)) {
      post({
        type: 'ERROR',
        error: `pkey -pubout (subject) failed (rc=${pubRc.rc}): ${pubRc.stderr.slice(-300)}`,
        requestId,
      })
      return
    }
    persistVfs(M, [subjectPubPath])

    // Step 2 — fresh module, vfs auto-rehydrates subject.pub + issuer.crt.
    const M2 = await newModuleSafe(useHsm, requestId)
    if (!M2) return
    const { rc, stderr } = runOpenssl(M2, [
      'x509',
      ...providerArgs,
      '-new',
      '-CA',
      issuerCertPath,
      '-CAkey',
      issuerKeyArg,
      '-force_pubkey',
      subjectPubPath,
      '-subj',
      subject,
      '-days',
      String(days ?? 365),
      '-out',
      certPath,
    ])
    if (rc !== 0 || !fileExists(M2, certPath)) {
      post({
        type: 'ERROR',
        error: `x509 -new (CA-signed) failed (rc=${rc}): ${stderr.slice(-400)}`,
        requestId,
      })
      return
    }
    const certPem = readPem(M2, certPath)
    persistVfs(M2, [certPath])
    post({ type: 'CMS_MKCERT_RESULT', certPem, requestId })
    return
  }

  // Self-signed X.509 cert. When useHsm, route the signing key through
  // a pkcs11 URI so the private key never leaves softhsmv3. The subject
  // key must be sign-capable — fails for ML-KEM / X25519 (use issuerKeyId
  // in that case).
  const argv = useHsm
    ? [
        'req',
        ...HSM_PROVIDER_FLAGS,
        '-new',
        '-x509',
        '-key',
        pkcs11Uri(keyId),
        '-out',
        certPath,
        '-subj',
        subject,
        '-days',
        String(days ?? 365),
      ]
    : [
        'req',
        '-new',
        '-x509',
        '-key',
        subjectKeyPath,
        '-out',
        certPath,
        '-subj',
        subject,
        '-days',
        String(days ?? 365),
      ]
  const { rc, stderr } = runOpenssl(M, argv)
  if (rc !== 0 || !fileExists(M, certPath)) {
    post({
      type: 'ERROR',
      error: `req -x509 failed (rc=${rc}): ${stderr.slice(-300)}`,
      requestId,
    })
    return
  }
  const certPem = readPem(M, certPath)
  persistVfs(M, [certPath])
  post({ type: 'CMS_MKCERT_RESULT', certPem, requestId })
}

async function cmsSign(
  keyId: string,
  certId: string,
  payload: Uint8Array,
  useHsm: boolean | undefined,
  requestId?: string
): Promise<void> {
  const M = await newModuleSafe(useHsm, requestId)
  if (!M) return
  const keyPath = `/ssl/${keyId}.key`
  const certPath = `/ssl/${certId}.crt`
  const payloadPath = `/ssl/payload-${keyId}.bin`
  const outPath = `/ssl/signed-${keyId}.p7m`
  if (!fileExists(M, certPath)) {
    post({ type: 'ERROR', error: `cert not found: ${certPath}`, requestId })
    return
  }
  if (!useHsm && !fileExists(M, keyPath)) {
    post({ type: 'ERROR', error: `key not found: ${keyPath}`, requestId })
    return
  }
  writeBin(M, payloadPath, payload)
  vfs.set(payloadPath, payload)
  vfs.delete(outPath)
  safeUnlink(M, outPath)
  // -outform DER produces a binary .p7m. -md sha256 selects the hash (ML-DSA
  // is hash-internal so this is mostly a no-op; included for classical algs).
  // -binary tells openssl cms not to normalize line endings.
  // -nodetach embeds the payload inside the SignedData so verify can recover
  // it without an external -content file (opaque-signed, self-contained .p7m).
  // When useHsm, the -inkey value is a pkcs11: URI; openssl + pkcs11-provider
  // route the signing operation to softhsmv3 in-process — the private key
  // never enters the openssl process address space.
  const inkeyArg = useHsm ? pkcs11Uri(keyId) : keyPath
  const providerArgs = useHsm ? HSM_PROVIDER_FLAGS : []
  const { rc, stderr } = runOpenssl(M, [
    'cms',
    ...providerArgs,
    '-sign',
    '-signer',
    certPath,
    '-inkey',
    inkeyArg,
    '-in',
    payloadPath,
    '-binary',
    '-nodetach',
    '-outform',
    'DER',
    '-out',
    outPath,
    '-md',
    'sha256',
  ])
  if (rc !== 0 || !fileExists(M, outPath)) {
    post({
      type: 'ERROR',
      error: `cms -sign failed (rc=${rc}): ${stderr.slice(-400)}`,
      requestId,
    })
    return
  }
  const signedP7m = readBin(M, outPath)
  persistVfs(M, [outPath])
  post({ type: 'CMS_SIGN_RESULT', signedP7m, requestId })
}

async function cmsVerify(
  signedP7m: Uint8Array,
  certId: string,
  useHsm: boolean | undefined,
  requestId?: string
): Promise<void> {
  const M = await newModuleSafe(useHsm, requestId)
  if (!M) return
  const certPath = `/ssl/${certId}.crt`
  const inPath = `/ssl/in-${certId}.p7m`
  const outPath = `/ssl/out-${certId}.bin`
  if (!fileExists(M, certPath)) {
    post({ type: 'ERROR', error: `cert not found: ${certPath}`, requestId })
    return
  }
  writeBin(M, inPath, signedP7m)
  safeUnlink(M, outPath)
  // Verify only needs the signer's public key (in the cert), so private-key
  // routing is irrelevant. We still pass HSM provider flags when useHsm is
  // set so the verify path matches the sign path (uniform provider config
  // surfaces any provider-side OID/encoding asymmetries early).
  const providerArgs = useHsm ? HSM_PROVIDER_FLAGS : []
  const { rc, stderr } = runOpenssl(M, [
    'cms',
    ...providerArgs,
    '-verify',
    '-in',
    inPath,
    '-inform',
    'DER',
    '-certfile',
    certPath,
    '-CAfile',
    certPath,
    '-binary',
    '-out',
    outPath,
  ])
  const ok = rc === 0 && fileExists(M, outPath)
  const payload = ok ? readBin(M, outPath) : undefined
  post({
    type: 'CMS_VERIFY_RESULT',
    ok,
    payload,
    stderrTail: stderr.split('\n').slice(-6).join('\n'),
    requestId,
  })
}

async function cmsEncrypt(
  recipientCertId: string,
  payload: Uint8Array,
  cipher: CmsCipher | undefined,
  requestId?: string
): Promise<void> {
  // Encrypt uses the recipient's public key from the cert — no signing
  // operation, so the provider isn't needed. Always software-side here.
  const M = await newModuleSafe(false, requestId)
  if (!M) return
  const certPath = `/ssl/${recipientCertId}.crt`
  const payloadPath = `/ssl/payload-enc-${recipientCertId}.bin`
  const outPath = `/ssl/enveloped-${recipientCertId}.p7m`
  if (!fileExists(M, certPath)) {
    post({ type: 'ERROR', error: `recipient cert not found: ${certPath}`, requestId })
    return
  }
  writeBin(M, payloadPath, payload)
  vfs.set(payloadPath, payload)
  vfs.delete(outPath)
  safeUnlink(M, outPath)
  // `openssl cms -encrypt` builds AuthEnvelopedData. The recipient cert's
  // public key drives RecipientInfo selection:
  //   - ML-KEM cert → KEMRecipientInfo (RFC 9629 + RFC 9936 ML-KEM profile)
  //   - RSA cert    → KeyTransRecipientInfo (OAEP)
  //   - EC/X25519   → KeyAgreeRecipientInfo (ECDH)
  // The user-selected `cipher` is the content-encryption (CEK) algorithm.
  const cipherFlag = `-${cipher ?? 'aes-256-gcm'}`
  const { rc, stderr } = runOpenssl(M, [
    'cms',
    '-encrypt',
    cipherFlag,
    '-in',
    payloadPath,
    '-binary',
    '-outform',
    'DER',
    '-out',
    outPath,
    certPath,
  ])
  if (rc !== 0 || !fileExists(M, outPath)) {
    post({
      type: 'ERROR',
      error: `cms -encrypt failed (rc=${rc}): ${stderr.slice(-400)}`,
      requestId,
    })
    return
  }
  const enveloped = readBin(M, outPath)
  persistVfs(M, [outPath])
  post({ type: 'CMS_ENCRYPT_RESULT', enveloped, requestId })
}

async function cmsDecrypt(
  enveloped: Uint8Array,
  recipientCertId: string,
  recipientKeyId: string,
  useHsm: boolean | undefined,
  requestId?: string
): Promise<void> {
  const M = await newModuleSafe(useHsm, requestId)
  if (!M) return
  const certPath = `/ssl/${recipientCertId}.crt`
  const keyPath = `/ssl/${recipientKeyId}.key`
  const inPath = `/ssl/in-enc-${recipientCertId}.p7m`
  const outPath = `/ssl/dec-${recipientCertId}.bin`
  if (!fileExists(M, certPath)) {
    post({ type: 'ERROR', error: `cert not found: ${certPath}`, requestId })
    return
  }
  if (!useHsm && !fileExists(M, keyPath)) {
    post({ type: 'ERROR', error: `key not found: ${keyPath}`, requestId })
    return
  }
  writeBin(M, inPath, enveloped)
  vfs.delete(outPath)
  safeUnlink(M, outPath)
  const inkeyArg = useHsm ? pkcs11Uri(recipientKeyId) : keyPath
  const providerArgs = useHsm ? HSM_PROVIDER_FLAGS : []
  const { rc, stderr } = runOpenssl(M, [
    'cms',
    ...providerArgs,
    '-decrypt',
    '-in',
    inPath,
    '-inform',
    'DER',
    '-recip',
    certPath,
    '-inkey',
    inkeyArg,
    '-binary',
    '-out',
    outPath,
  ])
  const ok = rc === 0 && fileExists(M, outPath)
  const payload = ok ? readBin(M, outPath) : undefined
  post({
    type: 'CMS_DECRYPT_RESULT',
    ok,
    payload,
    stderrTail: stderr.split('\n').slice(-6).join('\n'),
    requestId,
  })
}

/**
 * Dual-sign: produce ONE CMS SignedData carrying TWO SignerInfo entries
 * — one signed by the PQ key, one by the classical key. RFC 5652 §5.1
 * `SignerInfos ::= SET OF SignerInfo` makes this the natural way to ship
 * "two signatures over the same content" without a composite OID.
 *
 * NOTE: this is NOT LAMPS draft-ietf-lamps-pq-composite-sigs-19 composite
 * (which uses a single combined OID like id-MLDSA65-ECDSA-P256-SHA256).
 * LAMPS composite is verify-stronger because the verifier MUST validate
 * both algorithms; multi-SignerInfo lets the verifier strip one signer.
 * We pick multi-SignerInfo here because it works today on stock OpenSSL +
 * pkcs11-provider with no vendoring patch. The LAMPS composite path is
 * a Phase 5 follow-up once pkcs11-provider's composite.c dispatch table
 * is verified for the target OID pair.
 */
async function cmsDualSign(
  payload: Uint8Array,
  pqKeyId: string,
  pqCertId: string,
  classicalKeyId: string,
  classicalCertId: string,
  useHsm: boolean | undefined,
  requestId?: string
): Promise<void> {
  const M = await newModuleSafe(useHsm, requestId)
  if (!M) return
  const pqKey = `/ssl/${pqKeyId}.key`
  const pqCert = `/ssl/${pqCertId}.crt`
  const clKey = `/ssl/${classicalKeyId}.key`
  const clCert = `/ssl/${classicalCertId}.crt`
  const payloadPath = `/ssl/payload-dual-${pqKeyId}.bin`
  const outPath = `/ssl/signed-dual-${pqKeyId}.p7m`
  if (!fileExists(M, pqCert) || !fileExists(M, clCert)) {
    post({ type: 'ERROR', error: 'missing PQ or classical cert before dual-sign', requestId })
    return
  }
  if (!useHsm && (!fileExists(M, pqKey) || !fileExists(M, clKey))) {
    post({ type: 'ERROR', error: 'missing key file(s) before dual-sign', requestId })
    return
  }
  writeBin(M, payloadPath, payload)
  vfs.set(payloadPath, payload)
  vfs.delete(outPath)
  safeUnlink(M, outPath)
  const pqInkey = useHsm ? pkcs11Uri(pqKeyId) : pqKey
  const clInkey = useHsm ? pkcs11Uri(classicalKeyId) : clKey
  const providerArgs = useHsm ? HSM_PROVIDER_FLAGS : []
  // Repeated -signer/-inkey pairs produce one SignerInfo per pair.
  const { rc, stderr } = runOpenssl(M, [
    'cms',
    ...providerArgs,
    '-sign',
    '-signer',
    pqCert,
    '-inkey',
    pqInkey,
    '-signer',
    clCert,
    '-inkey',
    clInkey,
    '-in',
    payloadPath,
    '-binary',
    '-nodetach',
    '-outform',
    'DER',
    '-out',
    outPath,
    '-md',
    'sha256',
  ])
  if (rc !== 0 || !fileExists(M, outPath)) {
    post({
      type: 'ERROR',
      error: `cms -sign (dual) failed (rc=${rc}): ${stderr.slice(-400)}`,
      requestId,
    })
    return
  }
  const signedP7m = readBin(M, outPath)
  persistVfs(M, [outPath])
  post({ type: 'CMS_DUAL_SIGN_RESULT', signedP7m, requestId })
}

/**
 * Dual-verify: validate the multi-SignerInfo SignedData.
 *
 * Earlier iteration tried to verify each SignerInfo independently by
 * running `cms -verify` twice with a different `-CAfile` each time, but
 * OpenSSL's `cms -verify` is all-or-nothing across signers — it walks
 * every SignerInfo in the SignedData and fails the whole call if ANY
 * embedded signer cert can't be validated. That produced spurious
 * "self-signed certificate" chain errors on the non-trusted signer.
 *
 * Per-SignerInfo atomicity is what LAMPS draft-19 composite signatures
 * give you (single combined OID, both algorithms verified together at
 * the spec level). Multi-SignerInfo CMS doesn't — true per-signer
 * verification would require parsing the .p7m, extracting each
 * SignerInfo's signed-attributes hash, and verifying signatures with
 * `pkeyutl -verify`. That's future work.
 *
 * Today we do ONE `cms -verify -noverify` invocation. `-noverify` skips
 * cert chain validation (so self-signed certs are fine) but keeps
 * signature math. Returns `ok = true` iff EVERY SignerInfo's signature
 * math passed against its embedded signer cert.
 */
async function cmsDualVerify(
  signedP7m: Uint8Array,
  pqCertId: string,
  classicalCertId: string,
  useHsm: boolean | undefined,
  requestId?: string
): Promise<void> {
  const M = await newModuleSafe(useHsm, requestId)
  if (!M) return
  const pqCert = `/ssl/${pqCertId}.crt`
  const clCert = `/ssl/${classicalCertId}.crt`
  const inPath = `/ssl/in-dual-${pqCertId}.p7m`
  const outPath = `/ssl/dual-out.bin`
  if (!fileExists(M, pqCert) || !fileExists(M, clCert)) {
    post({ type: 'ERROR', error: 'missing PQ or classical cert', requestId })
    return
  }
  writeBin(M, inPath, signedP7m)
  safeUnlink(M, outPath)
  const providerArgs = useHsm ? HSM_PROVIDER_FLAGS : []
  // Both signer certs are embedded in the .p7m by `cms -sign` — we pass
  // them via `-certfile` so they're guaranteed to be in the certificate
  // collection during verify. `-noverify` skips chain validation; the
  // signature math is still checked.
  const v = runOpenssl(M, [
    'cms',
    ...providerArgs,
    '-verify',
    '-noverify',
    '-in',
    inPath,
    '-inform',
    'DER',
    '-certfile',
    pqCert,
    '-certfile',
    clCert,
    '-binary',
    '-out',
    outPath,
  ])
  const ok = v.rc === 0 && fileExists(M, outPath)
  const payload = ok ? readBin(M, outPath) : undefined
  // Heuristic: openssl prints "Verification successful" once per signer;
  // count it. Falls back to "2" on success when openssl is quiet about it.
  const successHits = (v.stderr.match(/Verification successful/g) || []).length
  const signerCount = ok ? Math.max(successHits, 2) : 0
  post({
    type: 'CMS_DUAL_VERIFY_RESULT',
    ok,
    signerCount,
    payload,
    stderr: v.stderr.split('\n').slice(-6).join('\n'),
    requestId,
  })
}

self.addEventListener('message', (e: MessageEvent<WorkerInbound>) => {
  const msg = e.data
  switch (msg.type) {
    case 'LOAD_AND_INIT':
      void initProvider(msg.requestId)
      break
    case 'PING':
      post({ type: 'PONG', requestId: msg.requestId })
      break
    case 'CMS_GENKEY':
      void cmsGenKey(msg.alg, msg.keyId, msg.useHsm, msg.requestId)
      break
    case 'CMS_MKCERT':
      void cmsMkCert(
        msg.keyId,
        msg.certId,
        msg.subject,
        msg.days,
        msg.useHsm,
        msg.issuerKeyId,
        msg.requestId
      )
      break
    case 'CMS_SIGN':
      void cmsSign(msg.keyId, msg.certId, msg.payload, msg.useHsm, msg.requestId)
      break
    case 'CMS_VERIFY':
      void cmsVerify(msg.signedP7m, msg.certId, msg.useHsm, msg.requestId)
      break
    case 'CMS_ENCRYPT':
      void cmsEncrypt(msg.recipientCertId, msg.payload, msg.cipher, msg.requestId)
      break
    case 'CMS_DECRYPT':
      void cmsDecrypt(
        msg.enveloped,
        msg.recipientCertId,
        msg.recipientKeyId,
        msg.useHsm,
        msg.requestId
      )
      break
    case 'CMS_DUAL_SIGN':
      void cmsDualSign(
        msg.payload,
        msg.pqKeyId,
        msg.pqCertId,
        msg.classicalKeyId,
        msg.classicalCertId,
        msg.useHsm,
        msg.requestId
      )
      break
    case 'CMS_DUAL_VERIFY':
      void cmsDualVerify(
        msg.signedP7m,
        msg.pqCertId,
        msg.classicalCertId,
        msg.useHsm,
        msg.requestId
      )
      break
    default:
      post({
        type: 'ERROR',
        error: `unknown message type: ${(msg as { type: string }).type}`,
        requestId: (msg as { requestId?: string }).requestId,
      })
  }
})

post({ type: 'READY' })

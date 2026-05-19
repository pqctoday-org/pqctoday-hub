// SPDX-License-Identifier: GPL-3.0-only
//
// IMPORTANT: this worker is `type: 'classic'` (Web Worker constructor option
// in CMSSigningService). In Vite dev mode, classic workers cannot consume
// static ES module imports — Vite serves the file with `importScripts(...)`
// for HMR while leaving any `import` statements intact, which crashes the
// browser with "Cannot use import statement outside a module". Keep this
// file dependency-free.
//
// The composite-CMS pivot (LAMPS draft-19 sign/verify via @peculiar/asn1-cms
// + @noble/post-quantum) runs in the MAIN THREAD inside CMSSigningService,
// which talks to this worker via the new COMPOSITE_PRIMITIVE_SIGN_* message
// types defined below. The worker exposes only the softhsmv3 PKCS#11
// primitives; protocol assembly lives in services/compositeCms.ts.

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
  /** Emscripten's stderr handler. Mutable from JS so callers can wrap it to
   *  capture diagnostic output during a sensitive C call (e.g. softhsmv3
   *  ERROR_MSG during C_Initialize). */
  printErr: (text: string) => void
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
  _C_GenerateKeyPair?: (
    hSession: number,
    pMechanism: number,
    pPublicKeyTemplate: number,
    ulPublicKeyAttributeCount: number,
    pPrivateKeyTemplate: number,
    ulPrivateKeyAttributeCount: number,
    phPublicKey: number,
    phPrivateKey: number
  ) => number
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
  | 'SLH-DSA-SHA2-192s'
  | 'SLH-DSA-SHA2-256s'
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
      /**
       * Algorithm of the subject key. For LAMPS composite OIDs the worker
       * routes through pqctoday_composite_mkcert instead of `openssl req`.
       */
      alg?: CmsAlg
      requestId?: string
    }
  | {
      type: 'CMS_SIGN'
      keyId: string
      certId: string
      payload: Uint8Array
      useHsm?: boolean
      /** Composite-OID routing — see CMS_MKCERT.alg. */
      alg?: CmsAlg
      requestId?: string
    }
  | {
      type: 'CMS_VERIFY'
      signedP7m: Uint8Array
      certId: string
      useHsm?: boolean
      /** Composite-OID routing — see CMS_MKCERT.alg. */
      alg?: CmsAlg
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
  /** Read an arbitrary file from the worker's persistent /ssl vfs. Used by
   *  CMSSigningService for the composite path so the main thread can fetch
   *  cert DER without re-running an openssl module just to convert PEM. */
  | {
      type: 'READ_VFS_FILE'
      path: string
      requestId?: string
    }
  /** Sign `data` with the softhsmv3-resident private key labelled `keyId`
   *  via the named PKCS#11 primitive. For composite CMS the main thread
   *  sends one of these per half (ML-DSA + classical). */
  | {
      type: 'COMPOSITE_PRIMITIVE_SIGN'
      keyId: string
      primitive: 'ml-dsa' | 'ecdsa-digest' | 'rsa-pss-sha256'
      data: Uint8Array
      /** ML-DSA only — FIPS 204 ctx parameter. Required for the ML-DSA
       *  primitive; ignored otherwise. */
      ctx?: Uint8Array
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
  | { type: 'READ_VFS_FILE_RESULT'; data: Uint8Array; requestId?: string }
  | { type: 'COMPOSITE_PRIMITIVE_SIGN_RESULT'; signature: Uint8Array; requestId?: string }
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
const CKU_USER_VAL = 1
// PKCS#11 v3.2 ML-DSA key generation constants (FIPS 204 via softhsmv3).
const CKM_ML_DSA_KEY_PAIR_GEN_VAL = 0x0000001c
const CKK_ML_DSA_VAL = 0x0000004a
// PKCS#11 EC key generation constants (softhsmv3 C++ engine).
const CKM_EC_KEY_PAIR_GEN_VAL = 0x00001040
const CKK_EC_VAL = 0x00000003
const CKA_EC_PARAMS_ATTR = 0x00000180
// PKCS#11 v3.2 ML-KEM key generation constants (FIPS 203 via softhsmv3).
const CKM_ML_KEM_KEY_PAIR_GEN_VAL = 0x0000000f
const CKK_ML_KEM_VAL = 0x00000049
const CKA_ENCAPSULATE_ATTR = 0x00000633
const CKA_DECAPSULATE_ATTR = 0x00000634
const CKP_ML_KEM_512_VAL = 0x00000001
const CKP_ML_KEM_768_VAL = 0x00000002
const CKP_ML_KEM_1024_VAL = 0x00000003
// PKCS#11 RSA key generation constants (softhsmv3 C++ engine).
const CKM_RSA_PKCS_KEY_PAIR_GEN_VAL = 0x00000000
const CKK_RSA_VAL = 0x00000000
const CKA_MODULUS_BITS_ATTR = 0x00000121
const CKA_PUBLIC_EXPONENT_ATTR = 0x00000122
const CKA_DECRYPT_ATTR = 0x00000105
const CKA_ENCRYPT_ATTR = 0x00000104
// PKCS#11 v3.2 SLH-DSA key generation constants (FIPS 205 via softhsmv3).
const CKM_SLH_DSA_KEY_PAIR_GEN_VAL = 0x0000002d
const CKK_SLH_DSA_VAL = 0x0000004b
const CKP_SLH_DSA_SHA2_128S_VAL = 0x00000001
const CKP_SLH_DSA_SHA2_192S_VAL = 0x00000005
const CKP_SLH_DSA_SHA2_256S_VAL = 0x00000009
// PKCS#11 v3.2 Montgomery EC (X25519) key generation constants.
const CKM_EC_MONTGOMERY_KEY_PAIR_GEN_VAL = 0x00001056
const CKK_EC_MONTGOMERY_VAL = 0x00000041
const CKA_DERIVE_ATTR = 0x0000010c
const CKP_ML_DSA_44_VAL = 0x00000001
const CKP_ML_DSA_65_VAL = 0x00000002
const CKP_ML_DSA_87_VAL = 0x00000003
const CKA_CLASS_ATTR = 0x00000000
const CKA_TOKEN_ATTR = 0x00000001
const CKA_LABEL_ATTR = 0x00000003
const CKA_KEY_TYPE_ATTR = 0x00000100
const CKA_ID_ATTR = 0x00000102
const CKA_SENSITIVE_ATTR = 0x00000103
const CKA_SIGN_ATTR = 0x00000108
const CKA_VERIFY_ATTR = 0x0000010a
const CKA_PARAMETER_SET_ATTR = 0x0000061d
const CKO_PUBLIC_KEY_VAL = 0x00000002
const CKO_PRIVATE_KEY_VAL = 0x00000003

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
    `directories.tokendir = ${SOFTHSM_TOKEN_DIR}/\n` +
    `objectstore.backend = file\n` +
    `log.level = ERROR\n`
  // Write to the custom path (used when getenv("SOFTHSM2_CONF") is visible to C).
  try {
    M.FS.writeFile(SOFTHSM_CONF_PATH, new TextEncoder().encode(conf))
  } catch {
    /* ignore */
  }
  // Also write to the compiled-in DEFAULT_SOFTHSM2_CONF path (/etc/softhsmv3.conf).
  // Emscripten's getEnvStrings() caches env strings on first call, so M.ENV changes
  // made after module creation may not be visible to C getenv(). When getenv returns
  // NULL softhsm falls back to this compiled-in path. Mirrors what softhsm_pre.js
  // does for the standalone softhsm.wasm build.
  try {
    M.FS.mkdir('/etc')
  } catch {
    /* already exists */
  }
  try {
    M.FS.writeFile('/etc/softhsmv3.conf', new TextEncoder().encode(conf))
  } catch {
    /* ignore */
  }
  if (M.ENV) {
    M.ENV['SOFTHSM2_CONF'] = SOFTHSM_CONF_PATH
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
    print: (text: string) => {
      // Mirror to worker console so debugging output is visible in DevTools
      // without having to wire CMSSigningService.onLog into every demo UI.

      console.log('[cms.worker]', text)
      post({ type: 'LOG', stream: 'stdout', message: text })
    },
    printErr: (text: string) => {
      console.error('[cms.worker]', text)
      post({ type: 'LOG', stream: 'stderr', message: text })
    },
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
    if (initCode === -100 || initCode === -101) {
      throw new Error(
        `pqctoday_cms_init not exported — WASM bundle needs rebuild: \`npm run build:openssl-wasm\``
      )
    }
    // initCode -1..-4: cwrap-context pre-init partially failed. This is non-fatal:
    // apps_startup() (Fix A, compiled into openssl.c) re-runs pqctoday_cms_init()
    // inside every callMain() where M.ENV vars are fully visible to C getenv(),
    // ensuring the pkcs11-provider is loaded before any CLI operation touches a
    // pkcs11: URI. OPENSSL_CONF stays as MINIMAL_OPENSSL_CNF so OPENSSL_init_ssl
    // does not try to load pkcs11 (builtin not registered yet), avoiding any
    // partially-failed provider stub in the global lib ctx.
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

/* ---------------------------------------------------------------------------
 * LAMPS composite signature helpers
 *
 * The three pqctoday_composite_* shims in cms_provider_init.c each take
 * the composite OID + two pkcs11: URIs + file paths, and route through
 * pkcs11-provider's composite.c dispatch tables. The provider must be
 * loaded before any shim runs — ensureProviderInit handles that on every
 * fresh module instance.
 * ------------------------------------------------------------------------- */

function isCompositeAlg(alg: CmsAlg | undefined | null): boolean {
  if (!alg) return false
  return alg.startsWith('id-MLDSA')
}

/** Map an alg name to its composite OID per LAMPS draft-19 §6. */
function compositeOidFor(alg: CmsAlg): string | null {
  switch (alg) {
    case 'id-MLDSA44-RSA2048-PSS-SHA256':
      return '1.3.6.1.5.5.7.6.37'
    case 'id-MLDSA65-ECDSA-P256-SHA512':
      return '1.3.6.1.5.5.7.6.45'
    case 'id-MLDSA87-ECDSA-P384-SHA512':
      return '1.3.6.1.5.5.7.6.49'
    default:
      return null
  }
}

/** For a composite alg, return the keyId suffixes for the two subkeys
 *  generated in softhsmv3. Convention: composite key 'alice' → softhsm
 *  objects 'alice__pq' + 'alice__cl'. */
function compositeSubkeyIds(parentKeyId: string): { pqKeyId: string; classicalKeyId: string } {
  return { pqKeyId: `${parentKeyId}__pq`, classicalKeyId: `${parentKeyId}__cl` }
}

/** For a composite alg, generate both subkeys in softhsm. Returns a
 *  string error detail or null on success. */
/** Call softhsm's C_FindObjects directly with template {CKA_LABEL=<label>}
 *  and return the number of object handles softhsm returns. Bypasses
 *  pkcs11-provider's URI parser entirely — this is what pkcs11-provider
 *  WOULD do internally if its URI parser is correct.
 *
 *  Returns -1 on init/session/login errors with the failing step appended
 *  to the tag. Returns 0+ on success (the actual handle count). */
function probeFindObjectsByLabel(M: OpenSSLModule, label: string, tag: string): number {
  const {
    _C_GetSlotList,
    _C_OpenSession,
    _C_Login,
    _C_FindObjectsInit,
    _C_FindObjects,
    _C_FindObjectsFinal,
    _C_Logout,
    _C_CloseSession,
    _malloc,
    _free,
    HEAPU8,
    setValue,
    getValue,
  } = M as OpenSSLModule & Record<string, unknown>
  const need = [
    _C_GetSlotList,
    _C_OpenSession,
    _C_Login,
    _C_FindObjectsInit,
    _C_FindObjects,
    _C_FindObjectsFinal,
    _C_Logout,
    _C_CloseSession,
    _malloc,
    _free,
    setValue,
    getValue,
  ]
  if (need.some((f) => typeof f !== 'function') || !(HEAPU8 instanceof Uint8Array)) {
    console.error(`[findobj-probe ${tag} ${label}] missing C_* exports`)
    return -1
  }
  type P11 = (...args: number[]) => number
  const fn_GetSlotList = _C_GetSlotList as P11
  const fn_OpenSession = _C_OpenSession as P11
  const fn_Login = _C_Login as P11
  const fn_FindInit = _C_FindObjectsInit as P11
  const fn_Find = _C_FindObjects as P11
  const fn_FindFinal = _C_FindObjectsFinal as P11
  const fn_Logout = _C_Logout as P11
  const fn_CloseSession = _C_CloseSession as P11
  const fn_malloc = _malloc as P11
  const fn_free = _free as P11
  const fn_setValue = setValue as (p: number, v: number, t: string) => void
  const fn_getValue = getValue as (p: number, t: string) => number
  const heap = HEAPU8 as Uint8Array

  // Find the first token-present slot
  const slotCountP = fn_malloc(4)
  fn_setValue(slotCountP, 0, 'i32')
  let rv = fn_GetSlotList(1, 0, slotCountP)
  const slotCount = fn_getValue(slotCountP, 'i32')
  if (rv !== 0 || slotCount === 0) {
    console.error(
      `[findobj-probe ${tag} ${label}] GetSlotList rv=0x${rv.toString(16)} count=${slotCount}`
    )
    fn_free(slotCountP)
    return -1
  }
  const slotsP = fn_malloc(slotCount * 8)
  rv = fn_GetSlotList(1, slotsP, slotCountP)
  const slot = fn_getValue(slotsP, 'i32')
  fn_free(slotsP)
  fn_free(slotCountP)
  if (rv !== 0) {
    return -1
  }

  // OpenSession R/O serial (flags = 4 = CKF_SERIAL_SESSION)
  const sessP = fn_malloc(8)
  fn_setValue(sessP, 0, 'i32')
  rv = fn_OpenSession(slot, 4, 0, 0, sessP)
  if (rv !== 0) {
    fn_free(sessP)

    console.error(`[findobj-probe ${tag} ${label}] OpenSession rv=0x${rv.toString(16)}`)
    return -1
  }
  const session = fn_getValue(sessP, 'i32')

  // Login USER with PIN "1234" (matches pin-value in our URI + pkcs11.cnf)
  const pinBytes = new TextEncoder().encode('1234')
  const pinP = fn_malloc(pinBytes.length)
  heap.set(pinBytes, pinP)
  fn_Login(session, 1, pinP, pinBytes.length)
  fn_free(pinP)

  // Build template { CKA_LABEL = labelBytes }
  const labelBytes = new TextEncoder().encode(label)
  const labelP = fn_malloc(labelBytes.length)
  heap.set(labelBytes, labelP)
  const tplP = fn_malloc(12) // 1 attribute × 12 bytes
  fn_setValue(tplP + 0, CKA_LABEL_ATTR, 'i32')
  fn_setValue(tplP + 4, labelP, 'i32')
  fn_setValue(tplP + 8, labelBytes.length, 'i32')

  rv = fn_FindInit(session, tplP, 1)
  let found = -1
  if (rv === 0) {
    const handleBufP = fn_malloc(10 * 8) // up to 10 handles
    const countP = fn_malloc(4)
    fn_setValue(countP, 0, 'i32')
    rv = fn_Find(session, handleBufP, 10, countP)
    if (rv === 0) {
      found = fn_getValue(countP, 'i32')
    }
    fn_free(handleBufP)
    fn_free(countP)
    fn_FindFinal(session)
  }
  fn_free(tplP)
  fn_free(labelP)
  fn_Logout(session)
  fn_CloseSession(session)
  fn_free(sessP)

  console.error(
    `[findobj-probe ${tag}] label="${label}" len=${labelBytes.length} found=${found} (rv=0x${rv.toString(16)})`
  )
  return found
}

/** Walk SOFTHSM_TOKEN_DIR recursively and console.error a flat list of
 *  every file path + byte size. Used to verify softhsm actually wrote
 *  the expected key objects between module instances. */
function probeSofthsmTokenDir(M: OpenSSLModule, tag: string): void {
  const entries: string[] = []
  const walk = (dir: string): void => {
    let names: string[] = []
    try {
      names = M.FS.readdir(dir)
    } catch {
      return
    }
    for (const n of names) {
      if (n === '.' || n === '..') continue
      const p = `${dir}/${n}`
      try {
        const data = M.FS.readFile(p) as Uint8Array
        entries.push(`${p} (${data.byteLength}B)`)
      } catch {
        walk(p)
      }
    }
  }
  walk(SOFTHSM_TOKEN_DIR)

  console.error(`[softhsm-probe ${tag}] ${entries.length} files:\n  ${entries.join('\n  ')}`)
}

function generateCompositeSubkeys(
  M: OpenSSLModule,
  alg: CmsAlg,
  parentKeyId: string
): string | null {
  const { pqKeyId, classicalKeyId } = compositeSubkeyIds(parentKeyId)
  let pqErr: string | null = null
  let classicalErr: string | null = null

  probeSofthsmTokenDir(M, 'before-pq-keygen')
  switch (alg) {
    case 'id-MLDSA44-RSA2048-PSS-SHA256':
      pqErr = generateMlDsaKeyInHsm(M, 'ML-DSA-44', pqKeyId)
      probeSofthsmTokenDir(M, `after-pq-keygen (${pqKeyId}, err=${pqErr ?? 'null'})`)
      if (pqErr === null) {
        // LAMPS draft-19 §6 pins this profile to RSA-2048-PSS.
        classicalErr = generateRsaKeyInHsm(M, classicalKeyId, 2048)
        probeSofthsmTokenDir(
          M,
          `after-classical-keygen (${classicalKeyId}, err=${classicalErr ?? 'null'})`
        )
      }
      break
    case 'id-MLDSA65-ECDSA-P256-SHA512':
      pqErr = generateMlDsaKeyInHsm(M, 'ML-DSA-65', pqKeyId)
      probeSofthsmTokenDir(M, `after-pq-keygen (${pqKeyId}, err=${pqErr ?? 'null'})`)
      if (pqErr === null) {
        classicalErr = generateEcKeyInHsm(M, classicalKeyId, 'P-256')
        probeSofthsmTokenDir(
          M,
          `after-classical-keygen (${classicalKeyId}, err=${classicalErr ?? 'null'})`
        )
      }
      break
    case 'id-MLDSA87-ECDSA-P384-SHA512':
      pqErr = generateMlDsaKeyInHsm(M, 'ML-DSA-87', pqKeyId)
      probeSofthsmTokenDir(M, `after-pq-keygen (${pqKeyId}, err=${pqErr ?? 'null'})`)
      if (pqErr === null) {
        classicalErr = generateEcKeyInHsm(M, classicalKeyId, 'P-384')
        probeSofthsmTokenDir(
          M,
          `after-classical-keygen (${classicalKeyId}, err=${classicalErr ?? 'null'})`
        )
      }
      break
    default:
      return `composite alg not recognized: ${alg}`
  }

  if (pqErr !== null) return `composite PQ subkey failed: ${pqErr}`
  if (classicalErr !== null) return `composite classical subkey failed: ${classicalErr}`
  return null
}

/** cwrap binding for _pqctoday_composite_mkcert. Returns 0 on success or
 *  a negative error code from cms_provider_init.c. */
function compositeMkCert(
  M: OpenSSLModule,
  compositeOid: string,
  pqUri: string,
  classicalUri: string,
  subjectCn: string,
  days: number,
  outPath: string
): number {
  let fn:
    | ((oid: string, pq: string, cl: string, cn: string, days: number, out: string) => number)
    | null = null
  try {
    fn = M.cwrap('pqctoday_composite_mkcert', 'number', [
      'string',
      'string',
      'string',
      'string',
      'number',
      'string',
    ]) as (oid: string, pq: string, cl: string, cn: string, days: number, out: string) => number
  } catch {
    return -100 // symbol missing — WASM not rebuilt
  }
  if (!fn) return -100
  try {
    return Number(fn(compositeOid, pqUri, classicalUri, subjectCn, days, outPath))
  } catch {
    return -101
  }
}

// NOTE: pqctoday_composite_cms_sign + pqctoday_composite_cms_verify cwrap
// bindings were removed when the composite CMS path pivoted to TS-driven
// assembly via @peculiar/asn1-cms (see ../services/compositeCms.ts). The C
// exports still ship in openssl.wasm for backward-compat with any external
// consumers; nothing in this worker calls them. The composite mkcert path
// keeps its C cwrap because X509_sign bypasses the broken
// X509_check_private_key code in pkcs11-provider.

/* ---------------------------------------------------------------------------
 * Direct PKCS#11 signers for the composite CMS TS path.
 *
 * The C-shim composite CMS path was blocked by X509_check_private_key —
 * pkcs11-provider has no SPKI decoder for composite keys (registering one
 * causes d2i_X509_PUBKEY infinite recursion). Instead we sign each half
 * directly via the softhsmv3 C_* API and assemble the CMS SignedData with
 * @peculiar/asn1-cms (see ../services/compositeCms.ts). Mkcert still uses
 * the C shim because X509_sign happens to bypass the broken check.
 *
 * Mech codes (PKCS#11 v3.2):
 *   CKM_ML_DSA              0x0000001d  pure ML-DSA, ctx via CK_SIGN_ADDITIONAL_CONTEXT
 *   CKM_ECDSA               0x00001041  raw r||s on caller-supplied digest
 *   CKM_SHA256_RSA_PKCS_PSS 0x00000043  PSS-padding via CK_RSA_PKCS_PSS_PARAMS
 * ------------------------------------------------------------------------- */
const CKM_ML_DSA_PURE_VAL = 0x0000001d
const CKM_ECDSA_VAL = 0x00001041
const CKM_SHA256_RSA_PKCS_PSS_VAL = 0x00000043
const CKM_SHA256_VAL = 0x00000250
const CKG_MGF1_SHA256_VAL = 0x00000002
const CKH_HEDGE_PREFERRED_VAL = 0x00000000

interface P11Session {
  hSession: number
  slot: number
  pinP: number
  pinLen: number
}

/** Open + login a fresh PKCS#11 session on the first initialized softhsmv3
 *  slot. Caller MUST call closeP11Session() when finished. Returns null on
 *  any setup failure (with stderr-style detail in the second tuple slot). */
function openP11Session(M: OpenSSLModule): { session: P11Session | null; detail: string } {
  const ext = M as OpenSSLModule & Record<string, unknown>
  const fn_Initialize = ext._C_Initialize as ((p: number) => number) | undefined
  const fn_GetSlotList = ext._C_GetSlotList as
    | ((tp: number, p: number, pc: number) => number)
    | undefined
  const fn_OpenSession = ext._C_OpenSession as
    | ((slot: number, flags: number, app: number, notify: number, ph: number) => number)
    | undefined
  const fn_Login = ext._C_Login as
    | ((s: number, ut: number, pp: number, pl: number) => number)
    | undefined
  const fn_malloc = ext._malloc as ((n: number) => number) | undefined
  const fn_setValue = ext.setValue as ((p: number, v: number, t: string) => void) | undefined
  const fn_getValue = ext.getValue as ((p: number, t: string) => number) | undefined
  const fn_stringToUTF8 = ext.stringToUTF8 as
    | ((s: string, p: number, n: number) => void)
    | undefined
  if (
    !fn_Initialize ||
    !fn_GetSlotList ||
    !fn_OpenSession ||
    !fn_Login ||
    !fn_malloc ||
    !fn_setValue ||
    !fn_getValue ||
    !fn_stringToUTF8
  ) {
    return { session: null, detail: 'missing PKCS#11 exports in openssl.wasm' }
  }

  const initRv = fn_Initialize(0)
  if (initRv !== 0 && initRv !== CKR_CRYPTOKI_ALREADY_INITIALIZED) {
    return { session: null, detail: `C_Initialize rv=0x${initRv.toString(16)}` }
  }
  const cntP = fn_malloc(4)
  fn_setValue(cntP, 0, 'i32')
  if (fn_GetSlotList(1, 0, cntP) !== 0) {
    return { session: null, detail: 'C_GetSlotList(count) failed' }
  }
  const cnt = fn_getValue(cntP, 'i32')
  if (cnt === 0) {
    return { session: null, detail: 'no initialized slots' }
  }
  const listP = fn_malloc(cnt * 4)
  fn_setValue(cntP, cnt, 'i32')
  if (fn_GetSlotList(1, listP, cntP) !== 0) {
    return { session: null, detail: 'C_GetSlotList(fill) failed' }
  }
  const slot = fn_getValue(listP, 'i32')

  const hSP = fn_malloc(4)
  fn_setValue(hSP, 0, 'i32')
  const openRv = fn_OpenSession(slot, CKF_RW_SESSION_VAL | CKF_SERIAL_SESSION_VAL, 0, 0, hSP)
  if (openRv !== 0) {
    return { session: null, detail: `C_OpenSession rv=0x${openRv.toString(16)}` }
  }
  const hSession = fn_getValue(hSP, 'i32')

  const pin = SOFTHSM_USER_PIN
  const pinP = fn_malloc(pin.length + 1)
  fn_stringToUTF8(pin, pinP, pin.length + 1)
  const loginRv = fn_Login(hSession, CKU_USER_VAL, pinP, pin.length)
  if (loginRv !== 0 && loginRv !== 0x100 /* CKR_USER_ALREADY_LOGGED_IN */) {
    return { session: null, detail: `C_Login rv=0x${loginRv.toString(16)}` }
  }
  return { session: { hSession, slot, pinP, pinLen: pin.length }, detail: '' }
}

function closeP11Session(M: OpenSSLModule, sess: P11Session): void {
  const ext = M as OpenSSLModule & Record<string, unknown>
  const fn_Logout = ext._C_Logout as ((s: number) => number) | undefined
  const fn_CloseSession = ext._C_CloseSession as ((s: number) => number) | undefined
  const fn_free = ext._free as ((p: number) => void) | undefined
  if (fn_Logout) fn_Logout(sess.hSession)
  if (fn_CloseSession) fn_CloseSession(sess.hSession)
  if (fn_free) fn_free(sess.pinP)
}

/** Locate a private-key handle by CKA_LABEL. Returns 0 if no matching object
 *  is found, -1 on internal failure. */
function findPrivKeyHandle(M: OpenSSLModule, hSession: number, label: string): number {
  const ext = M as OpenSSLModule & Record<string, unknown>
  const fn_FindInit = ext._C_FindObjectsInit as
    | ((s: number, tpl: number, n: number) => number)
    | undefined
  const fn_Find = ext._C_FindObjects as
    | ((s: number, hOut: number, ulMax: number, pCount: number) => number)
    | undefined
  const fn_FindFinal = ext._C_FindObjectsFinal as ((s: number) => number) | undefined
  const fn_malloc = ext._malloc as ((n: number) => number) | undefined
  const fn_free = ext._free as ((p: number) => void) | undefined
  const fn_setValue = ext.setValue as ((p: number, v: number, t: string) => void) | undefined
  const fn_getValue = ext.getValue as ((p: number, t: string) => number) | undefined
  const heap = ext.HEAPU8 as Uint8Array | undefined
  if (
    !fn_FindInit ||
    !fn_Find ||
    !fn_FindFinal ||
    !fn_malloc ||
    !fn_free ||
    !fn_setValue ||
    !fn_getValue ||
    !heap
  ) {
    return -1
  }

  const labelBytes = new TextEncoder().encode(label)
  const labelP = fn_malloc(labelBytes.length)
  heap.set(labelBytes, labelP)
  const classBuf = fn_malloc(4)
  fn_setValue(classBuf, CKO_PRIVATE_KEY_VAL, 'i32')

  // Template: { CKA_CLASS = CKO_PRIVATE_KEY, CKA_LABEL = label }
  const tplP = fn_malloc(24)
  fn_setValue(tplP + 0, CKA_CLASS_ATTR, 'i32')
  fn_setValue(tplP + 4, classBuf, 'i32')
  fn_setValue(tplP + 8, 4, 'i32')
  fn_setValue(tplP + 12, CKA_LABEL_ATTR, 'i32')
  fn_setValue(tplP + 16, labelP, 'i32')
  fn_setValue(tplP + 20, labelBytes.length, 'i32')

  let handle = 0
  if (fn_FindInit(hSession, tplP, 2) === 0) {
    const hBufP = fn_malloc(4)
    const countP = fn_malloc(4)
    fn_setValue(countP, 0, 'i32')
    if (fn_Find(hSession, hBufP, 1, countP) === 0) {
      const count = fn_getValue(countP, 'i32')
      if (count > 0) handle = fn_getValue(hBufP, 'i32')
    }
    fn_free(hBufP)
    fn_free(countP)
    fn_FindFinal(hSession)
  }
  fn_free(tplP)
  fn_free(classBuf)
  fn_free(labelP)
  return handle
}

/** ML-DSA sign of `data` with the FIPS 204 `ctx` parameter. Uses
 *  C_MessageSignInit + C_SignMessage per PKCS#11 v3.2. Returns Uint8Array
 *  signature or throws with the failing rv. */
function p11SignMldsaWithCtx(
  M: OpenSSLModule,
  hSession: number,
  privHandle: number,
  data: Uint8Array,
  ctx: Uint8Array
): Uint8Array {
  const ext = M as OpenSSLModule & Record<string, unknown>
  const fn_MsgSignInit = ext._C_MessageSignInit as
    | ((s: number, m: number, k: number) => number)
    | undefined
  const fn_SignMessage = ext._C_SignMessage as
    | ((
        s: number,
        pParam: number,
        ulParamLen: number,
        msg: number,
        msgLen: number,
        sig: number,
        sigLenP: number
      ) => number)
    | undefined
  // PKCS#11 v3.2: C_MessageSignFinal(CK_SESSION_HANDLE hSession) — single
  // argument. Calling with the older multi-message C_SignFinal-style
  // signature traps the Emscripten arg-count assertion.
  const fn_MsgSignFinal = ext._C_MessageSignFinal as ((s: number) => number) | undefined
  const fn_malloc = ext._malloc as ((n: number) => number) | undefined
  const fn_free = ext._free as ((p: number) => void) | undefined
  const fn_setValue = ext.setValue as ((p: number, v: number, t: string) => void) | undefined
  const fn_getValue = ext.getValue as ((p: number, t: string) => number) | undefined
  const heap = ext.HEAPU8 as Uint8Array | undefined
  if (
    !fn_MsgSignInit ||
    !fn_SignMessage ||
    !fn_MsgSignFinal ||
    !fn_malloc ||
    !fn_free ||
    !fn_setValue ||
    !fn_getValue ||
    !heap
  ) {
    throw new Error('PKCS#11 ML-DSA sign exports missing')
  }

  // CK_SIGN_ADDITIONAL_CONTEXT: { CK_HEDGE_TYPE, CK_BYTE_PTR ctx, CK_ULONG ctxLen }
  const ctxBufP = ctx.length > 0 ? fn_malloc(ctx.length) : 0
  if (ctxBufP) heap.set(ctx, ctxBufP)
  const paramP = fn_malloc(12)
  fn_setValue(paramP, CKH_HEDGE_PREFERRED_VAL, 'i32')
  fn_setValue(paramP + 4, ctxBufP, 'i32')
  fn_setValue(paramP + 8, ctx.length, 'i32')

  const mechP = fn_malloc(12)
  fn_setValue(mechP, CKM_ML_DSA_PURE_VAL, 'i32')
  fn_setValue(mechP + 4, paramP, 'i32')
  fn_setValue(mechP + 8, 12, 'i32')

  const msgP = fn_malloc(data.length)
  heap.set(data, msgP)
  const sigLenP = fn_malloc(4)
  fn_setValue(sigLenP, 0, 'i32')
  let sigP = 0
  try {
    const initRv = fn_MsgSignInit(hSession, mechP, privHandle)
    if (initRv !== 0) throw new Error(`C_MessageSignInit(ML-DSA) rv=0x${initRv.toString(16)}`)
    let rv = fn_SignMessage(hSession, 0, 0, msgP, data.length, 0, sigLenP)
    if (rv !== 0) throw new Error(`C_SignMessage(ML-DSA,len) rv=0x${rv.toString(16)}`)
    const sigLen = fn_getValue(sigLenP, 'i32')
    sigP = fn_malloc(sigLen)
    fn_setValue(sigLenP, sigLen, 'i32')
    rv = fn_SignMessage(hSession, 0, 0, msgP, data.length, sigP, sigLenP)
    if (rv !== 0) throw new Error(`C_SignMessage(ML-DSA) rv=0x${rv.toString(16)}`)
    const finalLen = fn_getValue(sigLenP, 'i32')
    return heap.slice(sigP, sigP + finalLen)
  } finally {
    fn_MsgSignFinal(hSession)
    fn_free(mechP)
    fn_free(paramP)
    if (ctxBufP) fn_free(ctxBufP)
    fn_free(msgP)
    fn_free(sigLenP)
    if (sigP) fn_free(sigP)
  }
}

/** Single-shot C_SignInit + C_Sign. `mechParamP`/`mechParamLen` may be 0/0
 *  for mechanisms that take no parameter (CKM_ECDSA). */
function p11SignSingleShot(
  M: OpenSSLModule,
  hSession: number,
  privHandle: number,
  mechType: number,
  mechParamP: number,
  mechParamLen: number,
  data: Uint8Array
): Uint8Array {
  const ext = M as OpenSSLModule & Record<string, unknown>
  const fn_SignInit = ext._C_SignInit as ((s: number, m: number, k: number) => number) | undefined
  const fn_Sign = ext._C_Sign as
    | ((s: number, msg: number, msgLen: number, sig: number, sigLenP: number) => number)
    | undefined
  const fn_malloc = ext._malloc as ((n: number) => number) | undefined
  const fn_free = ext._free as ((p: number) => void) | undefined
  const fn_setValue = ext.setValue as ((p: number, v: number, t: string) => void) | undefined
  const fn_getValue = ext.getValue as ((p: number, t: string) => number) | undefined
  const heap = ext.HEAPU8 as Uint8Array | undefined
  if (!fn_SignInit || !fn_Sign || !fn_malloc || !fn_free || !fn_setValue || !fn_getValue || !heap) {
    throw new Error('PKCS#11 single-shot sign exports missing')
  }

  const mechP = fn_malloc(12)
  fn_setValue(mechP, mechType, 'i32')
  fn_setValue(mechP + 4, mechParamP, 'i32')
  fn_setValue(mechP + 8, mechParamLen, 'i32')

  const msgP = fn_malloc(data.length)
  heap.set(data, msgP)
  const sigLenP = fn_malloc(4)
  fn_setValue(sigLenP, 0, 'i32')
  let sigP = 0
  try {
    const initRv = fn_SignInit(hSession, mechP, privHandle)
    if (initRv !== 0)
      throw new Error(`C_SignInit(0x${mechType.toString(16)}) rv=0x${initRv.toString(16)}`)
    let rv = fn_Sign(hSession, msgP, data.length, 0, sigLenP)
    if (rv !== 0) throw new Error(`C_Sign(0x${mechType.toString(16)},len) rv=0x${rv.toString(16)}`)
    const sigLen = fn_getValue(sigLenP, 'i32')
    sigP = fn_malloc(sigLen)
    fn_setValue(sigLenP, sigLen, 'i32')
    rv = fn_Sign(hSession, msgP, data.length, sigP, sigLenP)
    if (rv !== 0) throw new Error(`C_Sign(0x${mechType.toString(16)}) rv=0x${rv.toString(16)}`)
    const finalLen = fn_getValue(sigLenP, 'i32')
    return heap.slice(sigP, sigP + finalLen)
  } finally {
    fn_free(mechP)
    fn_free(msgP)
    fn_free(sigLenP)
    if (sigP) fn_free(sigP)
  }
}

/** ECDSA sign of an externally-computed digest via CKM_ECDSA. Returns raw
 *  r||s (component-length × 2). Caller is responsible for DER-encoding if
 *  the surrounding format requires it. */
function p11SignEcdsaDigest(
  M: OpenSSLModule,
  hSession: number,
  privHandle: number,
  digest: Uint8Array
): Uint8Array {
  return p11SignSingleShot(M, hSession, privHandle, CKM_ECDSA_VAL, 0, 0, digest)
}

/** RSA-PSS-SHA256 sign of an arbitrary message via CKM_SHA256_RSA_PKCS_PSS
 *  with CK_RSA_PKCS_PSS_PARAMS (SHA-256 / MGF1-SHA-256 / sLen=32). Returns
 *  the modulus-length signature octets. */
function p11SignRsaPssSha256(
  M: OpenSSLModule,
  hSession: number,
  privHandle: number,
  data: Uint8Array
): Uint8Array {
  const ext = M as OpenSSLModule & Record<string, unknown>
  const fn_malloc = ext._malloc as ((n: number) => number) | undefined
  const fn_setValue = ext.setValue as ((p: number, v: number, t: string) => void) | undefined
  const fn_free = ext._free as ((p: number) => void) | undefined
  if (!fn_malloc || !fn_setValue || !fn_free) {
    throw new Error('PKCS#11 PSS-param exports missing')
  }
  // CK_RSA_PKCS_PSS_PARAMS = { hashAlg, mgf, sLen } — 3 × 4 bytes in WASM32
  const paramP = fn_malloc(12)
  fn_setValue(paramP + 0, CKM_SHA256_VAL, 'i32')
  fn_setValue(paramP + 4, CKG_MGF1_SHA256_VAL, 'i32')
  fn_setValue(paramP + 8, 32, 'i32') // SHA-256 digest length (rRFC 8017 PSS sLen recommendation)
  try {
    return p11SignSingleShot(M, hSession, privHandle, CKM_SHA256_RSA_PKCS_PSS_VAL, paramP, 12, data)
  } finally {
    fn_free(paramP)
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

/** Returns the CKP_ML_DSA_* parameter-set value for an ML-DSA CmsAlg,
 *  or -1 for non-ML-DSA algorithms. */
function mlDsaParamSet(alg: CmsAlg): number {
  if (alg === 'ML-DSA-44') return CKP_ML_DSA_44_VAL
  if (alg === 'ML-DSA-65') return CKP_ML_DSA_65_VAL
  if (alg === 'ML-DSA-87') return CKP_ML_DSA_87_VAL
  return -1
}

function mlKemParamSet(alg: CmsAlg): number {
  if (alg === 'ML-KEM-512') return CKP_ML_KEM_512_VAL
  if (alg === 'ML-KEM-768') return CKP_ML_KEM_768_VAL
  if (alg === 'ML-KEM-1024') return CKP_ML_KEM_1024_VAL
  return -1
}

function slhDsaParamSet(alg: CmsAlg): number {
  if (alg === 'SLH-DSA-SHA2-128s') return CKP_SLH_DSA_SHA2_128S_VAL
  if (alg === 'SLH-DSA-SHA2-192s') return CKP_SLH_DSA_SHA2_192S_VAL
  if (alg === 'SLH-DSA-SHA2-256s') return CKP_SLH_DSA_SHA2_256S_VAL
  return -1
}

/**
 * Generate an ML-DSA key pair directly in softhsmv3 via C_GenerateKeyPair.
 *
 * `genpkey -out pkcs11:...` routes output through POSIX open() (not
 * OSSL_STORE), so it writes a PEM file to the WASM MEMFS root rather than
 * into the softhsmv3 token. This function uses the PKCS#11 C API directly,
 * which stores the key object in the file-backed token so that pkcs11: URI
 * references in subsequent CLI commands (req, cms) find it via C_FindObjects.
 *
 * Precondition: initSoftHsmTokenIfNeeded() has already run on M, so
 * softhsmv3 is initialised and the token is present.
 *
 * Returns null on success, or a diagnostic string describing the exact
 * failure (call name + CK return code) so callers can surface it in the UI.
 */
function generateMlDsaKeyInHsm(M: OpenSSLModule, alg: CmsAlg, keyId: string): string | null {
  const paramSet = mlDsaParamSet(alg)
  if (paramSet < 0) return `bad paramSet for alg=${alg}`

  const {
    _C_GetSlotList,
    _C_OpenSession,
    _C_Login,
    _C_GenerateKeyPair,
    _C_Logout,
    _C_CloseSession,
    _malloc,
    _free,
    HEAPU8,
    setValue,
    getValue,
    stringToUTF8,
  } = M as OpenSSLModule & Record<string, unknown>

  const { _C_Initialize: _C_Init2 } = M as OpenSSLModule & Record<string, unknown>

  const missing: string[] = []
  if (typeof _C_GetSlotList !== 'function') missing.push('_C_GetSlotList')
  if (typeof _C_OpenSession !== 'function') missing.push('_C_OpenSession')
  if (typeof _C_Login !== 'function') missing.push('_C_Login')
  if (typeof _C_GenerateKeyPair !== 'function') missing.push('_C_GenerateKeyPair')
  if (typeof _C_Logout !== 'function') missing.push('_C_Logout')
  if (typeof _C_CloseSession !== 'function') missing.push('_C_CloseSession')
  if (typeof _malloc !== 'function') missing.push('_malloc')
  if (typeof _free !== 'function') missing.push('_free')
  if (typeof setValue !== 'function') missing.push('setValue')
  if (typeof getValue !== 'function') missing.push('getValue')
  if (typeof stringToUTF8 !== 'function') missing.push('stringToUTF8')
  if (!(HEAPU8 instanceof Uint8Array)) missing.push('HEAPU8')
  if (missing.length > 0) return `missing WASM exports: ${missing.join(', ')}`

  type P11Fn = (...args: number[]) => number
  const fn_GetSlotList = _C_GetSlotList as P11Fn
  const fn_OpenSession = _C_OpenSession as P11Fn
  const fn_Login = _C_Login as P11Fn
  const fn_GenerateKeyPair = _C_GenerateKeyPair as P11Fn
  const fn_Logout = _C_Logout as P11Fn
  const fn_CloseSession = _C_CloseSession as P11Fn
  const fn_malloc = _malloc as P11Fn
  const fn_free = _free as P11Fn
  const fn_setValue = setValue as (p: number, v: number, t: string) => void
  const fn_getValue = getValue as (p: number, t: string) => number
  const fn_stringToUTF8 = stringToUTF8 as (s: string, p: number, n: number) => void
  const heap = HEAPU8 as Uint8Array

  // Ensure Cryptoki is initialized — tolerate ALREADY_INITIALIZED (0x191) since
  // initSoftHsmTokenIfNeeded() may have called C_Initialize first, or pkcs11-provider
  // may have called it during OSSL_PROVIDER_load. A fresh rv=0 here means
  // initSoftHsmTokenIfNeeded silently failed (config unreadable, etc.) — in that
  // case the token is not set up and we'll get 0 slots from C_GetSlotList below.
  if (typeof _C_Init2 === 'function') {
    // Capture any ERROR_MSG / WARNING_MSG printed to stderr by softhsmv3
    // during C_Initialize — these pinpoint exactly which sub-step fails.
    const diagLogs: string[] = []
    const origPrintErr = M.printErr
    M.printErr = (text: string) => {
      diagLogs.push(text)
    }
    const initRv = (_C_Init2 as P11Fn)(0)
    M.printErr = origPrintErr
    if (initRv !== 0 && initRv !== CKR_CRYPTOKI_ALREADY_INITIALIZED) {
      const diagStr = diagLogs.length > 0 ? ` | stderr: ${diagLogs.join(' | ')}` : ''
      return `C_Initialize rv=0x${initRv.toString(16)} SOFTHSM2_CONF=${M.ENV?.['SOFTHSM2_CONF'] ?? 'unset'} tokenDir=[${(() => {
        try {
          return M.FS.readdir(SOFTHSM_TOKEN_DIR).join(',')
        } catch {
          return 'ERR'
        }
      })()}]${diagStr}`
    }
  }

  // Find the initialized token slot (tokenPresent=1).
  const cntP = fn_malloc(4)
  fn_setValue(cntP, 0, 'i32')
  const slCountRv = fn_GetSlotList(1, 0, cntP)
  if (slCountRv !== 0) {
    fn_free(cntP)
    return `C_GetSlotList(count) rv=0x${slCountRv.toString(16)}`
  }
  const cnt = fn_getValue(cntP, 'i32')
  fn_free(cntP)
  if (cnt === 0) return `C_GetSlotList returned 0 initialized slots`

  const listP = fn_malloc(cnt * 4)
  const c2P = fn_malloc(4)
  fn_setValue(c2P, cnt, 'i32')
  const slFillRv = fn_GetSlotList(1, listP, c2P)
  if (slFillRv !== 0) {
    fn_free(listP)
    fn_free(c2P)
    return `C_GetSlotList(fill) rv=0x${slFillRv.toString(16)}`
  }
  const tokenSlot = fn_getValue(listP, 'i32')
  fn_free(listP)
  fn_free(c2P)

  // Open session + login as user.
  const hSP = fn_malloc(4)
  fn_setValue(hSP, 0, 'i32')
  const openSessRv = fn_OpenSession(
    tokenSlot,
    CKF_RW_SESSION_VAL | CKF_SERIAL_SESSION_VAL,
    0,
    0,
    hSP
  )
  if (openSessRv !== 0) {
    fn_free(hSP)
    return `C_OpenSession(slot=${tokenSlot}) rv=0x${openSessRv.toString(16)}`
  }
  const hSession = fn_getValue(hSP, 'i32')
  fn_free(hSP)

  const pin = SOFTHSM_USER_PIN
  const pinP = fn_malloc(pin.length + 1)
  fn_stringToUTF8(pin, pinP, pin.length + 1)
  const loginRv = fn_Login(hSession, CKU_USER_VAL, pinP, pin.length)
  fn_free(pinP)
  if (loginRv !== 0) {
    fn_CloseSession(hSession)
    return `C_Login rv=0x${loginRv.toString(16)}`
  }

  // Shared value buffers.
  // CK_BBOOL (1 byte) for boolean attributes.
  const boolTrueP = fn_malloc(1)
  heap[boolTrueP] = 1 // CK_TRUE
  // CK_ULONG (4 bytes) for class, key-type, parameter-set.
  const pubClassP = fn_malloc(4)
  fn_setValue(pubClassP, CKO_PUBLIC_KEY_VAL, 'i32')
  const privClassP = fn_malloc(4)
  fn_setValue(privClassP, CKO_PRIVATE_KEY_VAL, 'i32')
  const keyTypeP = fn_malloc(4)
  fn_setValue(keyTypeP, CKK_ML_DSA_VAL, 'i32')
  const paramSetP = fn_malloc(4)
  fn_setValue(paramSetP, paramSet, 'i32')
  // Label + ID byte strings (PKCS#11 does not use null terminators for byte strings).
  const labelBytes = new TextEncoder().encode(keyId)
  const labelP = fn_malloc(labelBytes.length)
  heap.set(labelBytes, labelP)
  const idBytes = new TextEncoder().encode(keyId)
  const idP = fn_malloc(idBytes.length)
  heap.set(idBytes, idP)

  // CK_MECHANISM (12 bytes: type | pParameter | ulParameterLen).
  const mechP = fn_malloc(12)
  fn_setValue(mechP, CKM_ML_DSA_KEY_PAIR_GEN_VAL, 'i32')
  fn_setValue(mechP + 4, 0, 'i32') // pParameter = NULL
  fn_setValue(mechP + 8, 0, 'i32') // ulParameterLen = 0

  // CK_ATTRIBUTE helper: write one entry at base[idx] (12 bytes each).
  const writeAttr = (base: number, idx: number, type: number, valPtr: number, valLen: number) => {
    const off = base + idx * 12
    fn_setValue(off, type, 'i32')
    fn_setValue(off + 4, valPtr, 'i32')
    fn_setValue(off + 8, valLen, 'i32')
  }

  // Public key template: CLASS, TOKEN, LABEL, ID, KEY_TYPE, PARAMETER_SET, VERIFY
  const pubAttrCount = 7
  const pubTplP = fn_malloc(pubAttrCount * 12)
  writeAttr(pubTplP, 0, CKA_CLASS_ATTR, pubClassP, 4)
  writeAttr(pubTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(pubTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(pubTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(pubTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(pubTplP, 5, CKA_PARAMETER_SET_ATTR, paramSetP, 4)
  writeAttr(pubTplP, 6, CKA_VERIFY_ATTR, boolTrueP, 1)

  // Private key template: CLASS, TOKEN, LABEL, ID, KEY_TYPE, PARAMETER_SET, SENSITIVE, SIGN
  const privAttrCount = 8
  const privTplP = fn_malloc(privAttrCount * 12)
  writeAttr(privTplP, 0, CKA_CLASS_ATTR, privClassP, 4)
  writeAttr(privTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(privTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(privTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(privTplP, 5, CKA_PARAMETER_SET_ATTR, paramSetP, 4)
  writeAttr(privTplP, 6, CKA_SENSITIVE_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 7, CKA_SIGN_ATTR, boolTrueP, 1)

  // Output handles.
  const hPubP = fn_malloc(4)
  const hPrivP = fn_malloc(4)
  fn_setValue(hPubP, 0, 'i32')
  fn_setValue(hPrivP, 0, 'i32')

  const genRv = fn_GenerateKeyPair(
    hSession,
    mechP,
    pubTplP,
    pubAttrCount,
    privTplP,
    privAttrCount,
    hPubP,
    hPrivP
  )
  fn_free(hPubP)
  fn_free(hPrivP)
  fn_free(pubTplP)
  fn_free(privTplP)
  fn_free(mechP)
  fn_free(boolTrueP)
  fn_free(pubClassP)
  fn_free(privClassP)
  fn_free(keyTypeP)
  fn_free(paramSetP)
  fn_free(labelP)
  fn_free(idP)

  fn_Logout(hSession)
  fn_CloseSession(hSession)

  if (genRv !== 0) return `C_GenerateKeyPair(${alg}, slot=${tokenSlot}) rv=0x${genRv.toString(16)}`
  return null
}

/**
 * Generate an EC key pair directly in softhsmv3 via C_GenerateKeyPair.
 * CKA_EC_PARAMS carries the DER-encoded curve OID. Default is prime256v1
 * (secp256r1) for the standalone ECDSA workshop path; pass curve='P-384'
 * to drive id-MLDSA87-ECDSA-P384-SHA512 composite keygen.
 * Follows the same session lifecycle as generateMlDsaKeyInHsm.
 */
function generateEcKeyInHsm(
  M: OpenSSLModule,
  keyId: string,
  curve: 'P-256' | 'P-384' = 'P-256'
): string | null {
  const {
    _C_GetSlotList,
    _C_OpenSession,
    _C_Login,
    _C_GenerateKeyPair,
    _C_Logout,
    _C_CloseSession,
    _malloc,
    _free,
    HEAPU8,
    setValue,
    getValue,
    stringToUTF8,
  } = M as OpenSSLModule & Record<string, unknown>

  const { _C_Initialize: _C_Init2 } = M as OpenSSLModule & Record<string, unknown>

  const missing: string[] = []
  if (typeof _C_GetSlotList !== 'function') missing.push('_C_GetSlotList')
  if (typeof _C_OpenSession !== 'function') missing.push('_C_OpenSession')
  if (typeof _C_Login !== 'function') missing.push('_C_Login')
  if (typeof _C_GenerateKeyPair !== 'function') missing.push('_C_GenerateKeyPair')
  if (typeof _C_Logout !== 'function') missing.push('_C_Logout')
  if (typeof _C_CloseSession !== 'function') missing.push('_C_CloseSession')
  if (typeof _malloc !== 'function') missing.push('_malloc')
  if (typeof _free !== 'function') missing.push('_free')
  if (typeof setValue !== 'function') missing.push('setValue')
  if (typeof getValue !== 'function') missing.push('getValue')
  if (typeof stringToUTF8 !== 'function') missing.push('stringToUTF8')
  if (!(HEAPU8 instanceof Uint8Array)) missing.push('HEAPU8')
  if (missing.length > 0) return `missing WASM exports: ${missing.join(', ')}`

  type P11Fn = (...args: number[]) => number
  const fn_GetSlotList = _C_GetSlotList as P11Fn
  const fn_OpenSession = _C_OpenSession as P11Fn
  const fn_Login = _C_Login as P11Fn
  const fn_GenerateKeyPair = _C_GenerateKeyPair as P11Fn
  const fn_Logout = _C_Logout as P11Fn
  const fn_CloseSession = _C_CloseSession as P11Fn
  const fn_malloc = _malloc as P11Fn
  const fn_free = _free as P11Fn
  const fn_setValue = setValue as (p: number, v: number, t: string) => void
  const fn_getValue = getValue as (p: number, t: string) => number
  const fn_stringToUTF8 = stringToUTF8 as (s: string, p: number, n: number) => void
  const heap = HEAPU8 as Uint8Array

  if (typeof _C_Init2 === 'function') {
    const initRv = (_C_Init2 as P11Fn)(0)
    if (initRv !== 0 && initRv !== CKR_CRYPTOKI_ALREADY_INITIALIZED) {
      return `C_Initialize rv=0x${initRv.toString(16)}`
    }
  }

  const cntP = fn_malloc(4)
  fn_setValue(cntP, 0, 'i32')
  const slCountRv = fn_GetSlotList(1, 0, cntP)
  if (slCountRv !== 0) {
    fn_free(cntP)
    return `C_GetSlotList(count) rv=0x${slCountRv.toString(16)}`
  }
  const cnt = fn_getValue(cntP, 'i32')
  fn_free(cntP)
  if (cnt === 0) return `C_GetSlotList returned 0 initialized slots`

  const listP = fn_malloc(cnt * 4)
  const c2P = fn_malloc(4)
  fn_setValue(c2P, cnt, 'i32')
  const slFillRv = fn_GetSlotList(1, listP, c2P)
  if (slFillRv !== 0) {
    fn_free(listP)
    fn_free(c2P)
    return `C_GetSlotList(fill) rv=0x${slFillRv.toString(16)}`
  }
  const tokenSlot = fn_getValue(listP, 'i32')
  fn_free(listP)
  fn_free(c2P)

  const hSP = fn_malloc(4)
  fn_setValue(hSP, 0, 'i32')
  const openSessRv = fn_OpenSession(
    tokenSlot,
    CKF_RW_SESSION_VAL | CKF_SERIAL_SESSION_VAL,
    0,
    0,
    hSP
  )
  if (openSessRv !== 0) {
    fn_free(hSP)
    return `C_OpenSession(slot=${tokenSlot}) rv=0x${openSessRv.toString(16)}`
  }
  const hSession = fn_getValue(hSP, 'i32')
  fn_free(hSP)

  const pin = SOFTHSM_USER_PIN
  const pinP = fn_malloc(pin.length + 1)
  fn_stringToUTF8(pin, pinP, pin.length + 1)
  const loginRv = fn_Login(hSession, CKU_USER_VAL, pinP, pin.length)
  fn_free(pinP)
  if (loginRv !== 0) {
    fn_CloseSession(hSession)
    return `C_Login rv=0x${loginRv.toString(16)}`
  }

  // DER-encoded ECParameters OID:
  //   P-256 = prime256v1 / secp256r1 / 1.2.840.10045.3.1.7
  //   P-384 = secp384r1                / 1.3.132.0.34
  const curveOid =
    curve === 'P-384'
      ? new Uint8Array([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x22])
      : new Uint8Array([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07])
  const ecParamsP = fn_malloc(curveOid.length)
  heap.set(curveOid, ecParamsP)

  const boolTrueP = fn_malloc(1)
  heap[boolTrueP] = 1
  const pubClassP = fn_malloc(4)
  fn_setValue(pubClassP, CKO_PUBLIC_KEY_VAL, 'i32')
  const privClassP = fn_malloc(4)
  fn_setValue(privClassP, CKO_PRIVATE_KEY_VAL, 'i32')
  const keyTypeP = fn_malloc(4)
  fn_setValue(keyTypeP, CKK_EC_VAL, 'i32')

  const labelBytes = new TextEncoder().encode(keyId)
  const labelP = fn_malloc(labelBytes.length)
  heap.set(labelBytes, labelP)
  const idBytes = new TextEncoder().encode(keyId)
  const idP = fn_malloc(idBytes.length)
  heap.set(idBytes, idP)

  const mechP = fn_malloc(12)
  fn_setValue(mechP, CKM_EC_KEY_PAIR_GEN_VAL, 'i32')
  fn_setValue(mechP + 4, 0, 'i32')
  fn_setValue(mechP + 8, 0, 'i32')

  const writeAttr = (base: number, idx: number, type: number, valPtr: number, valLen: number) => {
    const off = base + idx * 12
    fn_setValue(off, type, 'i32')
    fn_setValue(off + 4, valPtr, 'i32')
    fn_setValue(off + 8, valLen, 'i32')
  }

  // Public key: CLASS, TOKEN, LABEL, ID, KEY_TYPE, EC_PARAMS, VERIFY
  const pubAttrCount = 7
  const pubTplP = fn_malloc(pubAttrCount * 12)
  writeAttr(pubTplP, 0, CKA_CLASS_ATTR, pubClassP, 4)
  writeAttr(pubTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(pubTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(pubTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(pubTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(pubTplP, 5, CKA_EC_PARAMS_ATTR, ecParamsP, curveOid.length)
  writeAttr(pubTplP, 6, CKA_VERIFY_ATTR, boolTrueP, 1)

  // Private key: CLASS, TOKEN, LABEL, ID, KEY_TYPE, SENSITIVE, SIGN
  const privAttrCount = 7
  const privTplP = fn_malloc(privAttrCount * 12)
  writeAttr(privTplP, 0, CKA_CLASS_ATTR, privClassP, 4)
  writeAttr(privTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(privTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(privTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(privTplP, 5, CKA_SENSITIVE_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 6, CKA_SIGN_ATTR, boolTrueP, 1)

  const hPubP = fn_malloc(4)
  const hPrivP = fn_malloc(4)
  fn_setValue(hPubP, 0, 'i32')
  fn_setValue(hPrivP, 0, 'i32')

  const genRv = fn_GenerateKeyPair(
    hSession,
    mechP,
    pubTplP,
    pubAttrCount,
    privTplP,
    privAttrCount,
    hPubP,
    hPrivP
  )

  fn_free(hPubP)
  fn_free(hPrivP)
  fn_free(pubTplP)
  fn_free(privTplP)
  fn_free(mechP)
  fn_free(boolTrueP)
  fn_free(pubClassP)
  fn_free(privClassP)
  fn_free(keyTypeP)
  fn_free(ecParamsP)
  fn_free(labelP)
  fn_free(idP)

  fn_Logout(hSession)
  fn_CloseSession(hSession)

  if (genRv !== 0)
    return `C_GenerateKeyPair(EC/${curve}, slot=${tokenSlot}) rv=0x${genRv.toString(16)}`
  return null
}

/**
 * Generate an ML-KEM key pair directly in softhsmv3 via C_GenerateKeyPair.
 * Same rationale as generateMlDsaKeyInHsm: `genpkey -out pkcs11:...` writes
 * a PEM to MEMFS via the BIO path, so the key never reaches the token and
 * `pkey -in pkcs11:object=<keyId>` later fails with "Could not find private key".
 */
function generateMlKemKeyInHsm(M: OpenSSLModule, alg: CmsAlg, keyId: string): string | null {
  const paramSet = mlKemParamSet(alg)
  if (paramSet < 0) return `bad paramSet for alg=${alg}`

  const {
    _C_GetSlotList,
    _C_OpenSession,
    _C_Login,
    _C_GenerateKeyPair,
    _C_Logout,
    _C_CloseSession,
    _malloc,
    _free,
    HEAPU8,
    setValue,
    getValue,
    stringToUTF8,
  } = M as OpenSSLModule & Record<string, unknown>

  const { _C_Initialize: _C_Init2 } = M as OpenSSLModule & Record<string, unknown>

  const missing: string[] = []
  if (typeof _C_GetSlotList !== 'function') missing.push('_C_GetSlotList')
  if (typeof _C_OpenSession !== 'function') missing.push('_C_OpenSession')
  if (typeof _C_Login !== 'function') missing.push('_C_Login')
  if (typeof _C_GenerateKeyPair !== 'function') missing.push('_C_GenerateKeyPair')
  if (typeof _C_Logout !== 'function') missing.push('_C_Logout')
  if (typeof _C_CloseSession !== 'function') missing.push('_C_CloseSession')
  if (typeof _malloc !== 'function') missing.push('_malloc')
  if (typeof _free !== 'function') missing.push('_free')
  if (typeof setValue !== 'function') missing.push('setValue')
  if (typeof getValue !== 'function') missing.push('getValue')
  if (typeof stringToUTF8 !== 'function') missing.push('stringToUTF8')
  if (!(HEAPU8 instanceof Uint8Array)) missing.push('HEAPU8')
  if (missing.length > 0) return `missing WASM exports: ${missing.join(', ')}`

  type P11Fn = (...args: number[]) => number
  const fn_GetSlotList = _C_GetSlotList as P11Fn
  const fn_OpenSession = _C_OpenSession as P11Fn
  const fn_Login = _C_Login as P11Fn
  const fn_GenerateKeyPair = _C_GenerateKeyPair as P11Fn
  const fn_Logout = _C_Logout as P11Fn
  const fn_CloseSession = _C_CloseSession as P11Fn
  const fn_malloc = _malloc as P11Fn
  const fn_free = _free as P11Fn
  const fn_setValue = setValue as (p: number, v: number, t: string) => void
  const fn_getValue = getValue as (p: number, t: string) => number
  const fn_stringToUTF8 = stringToUTF8 as (s: string, p: number, n: number) => void
  const heap = HEAPU8 as Uint8Array

  if (typeof _C_Init2 === 'function') {
    const initRv = (_C_Init2 as P11Fn)(0)
    if (initRv !== 0 && initRv !== CKR_CRYPTOKI_ALREADY_INITIALIZED) {
      return `C_Initialize rv=0x${initRv.toString(16)}`
    }
  }

  const cntP = fn_malloc(4)
  fn_setValue(cntP, 0, 'i32')
  const slCountRv = fn_GetSlotList(1, 0, cntP)
  if (slCountRv !== 0) {
    fn_free(cntP)
    return `C_GetSlotList(count) rv=0x${slCountRv.toString(16)}`
  }
  const cnt = fn_getValue(cntP, 'i32')
  fn_free(cntP)
  if (cnt === 0) return `C_GetSlotList returned 0 initialized slots`

  const listP = fn_malloc(cnt * 4)
  const c2P = fn_malloc(4)
  fn_setValue(c2P, cnt, 'i32')
  const slFillRv = fn_GetSlotList(1, listP, c2P)
  if (slFillRv !== 0) {
    fn_free(listP)
    fn_free(c2P)
    return `C_GetSlotList(fill) rv=0x${slFillRv.toString(16)}`
  }
  const tokenSlot = fn_getValue(listP, 'i32')
  fn_free(listP)
  fn_free(c2P)

  const hSP = fn_malloc(4)
  fn_setValue(hSP, 0, 'i32')
  const openSessRv = fn_OpenSession(
    tokenSlot,
    CKF_RW_SESSION_VAL | CKF_SERIAL_SESSION_VAL,
    0,
    0,
    hSP
  )
  if (openSessRv !== 0) {
    fn_free(hSP)
    return `C_OpenSession(slot=${tokenSlot}) rv=0x${openSessRv.toString(16)}`
  }
  const hSession = fn_getValue(hSP, 'i32')
  fn_free(hSP)

  const pin = SOFTHSM_USER_PIN
  const pinP = fn_malloc(pin.length + 1)
  fn_stringToUTF8(pin, pinP, pin.length + 1)
  const loginRv = fn_Login(hSession, CKU_USER_VAL, pinP, pin.length)
  fn_free(pinP)
  if (loginRv !== 0) {
    fn_CloseSession(hSession)
    return `C_Login rv=0x${loginRv.toString(16)}`
  }

  const boolTrueP = fn_malloc(1)
  heap[boolTrueP] = 1
  const pubClassP = fn_malloc(4)
  fn_setValue(pubClassP, CKO_PUBLIC_KEY_VAL, 'i32')
  const privClassP = fn_malloc(4)
  fn_setValue(privClassP, CKO_PRIVATE_KEY_VAL, 'i32')
  const keyTypeP = fn_malloc(4)
  fn_setValue(keyTypeP, CKK_ML_KEM_VAL, 'i32')
  const paramSetP = fn_malloc(4)
  fn_setValue(paramSetP, paramSet, 'i32')

  const labelBytes = new TextEncoder().encode(keyId)
  const labelP = fn_malloc(labelBytes.length)
  heap.set(labelBytes, labelP)
  const idBytes = new TextEncoder().encode(keyId)
  const idP = fn_malloc(idBytes.length)
  heap.set(idBytes, idP)

  const mechP = fn_malloc(12)
  fn_setValue(mechP, CKM_ML_KEM_KEY_PAIR_GEN_VAL, 'i32')
  fn_setValue(mechP + 4, 0, 'i32')
  fn_setValue(mechP + 8, 0, 'i32')

  const writeAttr = (base: number, idx: number, type: number, valPtr: number, valLen: number) => {
    const off = base + idx * 12
    fn_setValue(off, type, 'i32')
    fn_setValue(off + 4, valPtr, 'i32')
    fn_setValue(off + 8, valLen, 'i32')
  }

  // Public key: CLASS, TOKEN, LABEL, ID, KEY_TYPE, PARAMETER_SET, ENCAPSULATE
  const pubAttrCount = 7
  const pubTplP = fn_malloc(pubAttrCount * 12)
  writeAttr(pubTplP, 0, CKA_CLASS_ATTR, pubClassP, 4)
  writeAttr(pubTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(pubTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(pubTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(pubTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(pubTplP, 5, CKA_PARAMETER_SET_ATTR, paramSetP, 4)
  writeAttr(pubTplP, 6, CKA_ENCAPSULATE_ATTR, boolTrueP, 1)

  // Private key: CLASS, TOKEN, LABEL, ID, KEY_TYPE, PARAMETER_SET, SENSITIVE, DECAPSULATE
  const privAttrCount = 8
  const privTplP = fn_malloc(privAttrCount * 12)
  writeAttr(privTplP, 0, CKA_CLASS_ATTR, privClassP, 4)
  writeAttr(privTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(privTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(privTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(privTplP, 5, CKA_PARAMETER_SET_ATTR, paramSetP, 4)
  writeAttr(privTplP, 6, CKA_SENSITIVE_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 7, CKA_DECAPSULATE_ATTR, boolTrueP, 1)

  const hPubP = fn_malloc(4)
  const hPrivP = fn_malloc(4)
  fn_setValue(hPubP, 0, 'i32')
  fn_setValue(hPrivP, 0, 'i32')

  const genRv = fn_GenerateKeyPair(
    hSession,
    mechP,
    pubTplP,
    pubAttrCount,
    privTplP,
    privAttrCount,
    hPubP,
    hPrivP
  )

  fn_free(hPubP)
  fn_free(hPrivP)
  fn_free(pubTplP)
  fn_free(privTplP)
  fn_free(mechP)
  fn_free(boolTrueP)
  fn_free(pubClassP)
  fn_free(privClassP)
  fn_free(keyTypeP)
  fn_free(paramSetP)
  fn_free(labelP)
  fn_free(idP)

  fn_Logout(hSession)
  fn_CloseSession(hSession)

  if (genRv !== 0) return `C_GenerateKeyPair(${alg}, slot=${tokenSlot}) rv=0x${genRv.toString(16)}`
  return null
}

/**
 * Generate an RSA-3072 key pair directly in softhsmv3 via C_GenerateKeyPair.
 * 3072 is the FIPS 140-3 floor; the public exponent is fixed at 65537 (DER 0x010001).
 * Same rationale as the other helpers — bypasses the BIO/genpkey trap that writes
 * PEM to MEMFS instead of the token. Used for both RSA-PSS (sign) and RSA (sign+wrap)
 * pkcs11: URIs in CMS sign / cert mint flows.
 */
function generateRsaKeyInHsm(M: OpenSSLModule, keyId: string, bits = 3072): string | null {
  const {
    _C_GetSlotList,
    _C_OpenSession,
    _C_Login,
    _C_GenerateKeyPair,
    _C_Logout,
    _C_CloseSession,
    _malloc,
    _free,
    HEAPU8,
    setValue,
    getValue,
    stringToUTF8,
  } = M as OpenSSLModule & Record<string, unknown>

  const { _C_Initialize: _C_Init2 } = M as OpenSSLModule & Record<string, unknown>

  const missing: string[] = []
  if (typeof _C_GetSlotList !== 'function') missing.push('_C_GetSlotList')
  if (typeof _C_OpenSession !== 'function') missing.push('_C_OpenSession')
  if (typeof _C_Login !== 'function') missing.push('_C_Login')
  if (typeof _C_GenerateKeyPair !== 'function') missing.push('_C_GenerateKeyPair')
  if (typeof _C_Logout !== 'function') missing.push('_C_Logout')
  if (typeof _C_CloseSession !== 'function') missing.push('_C_CloseSession')
  if (typeof _malloc !== 'function') missing.push('_malloc')
  if (typeof _free !== 'function') missing.push('_free')
  if (typeof setValue !== 'function') missing.push('setValue')
  if (typeof getValue !== 'function') missing.push('getValue')
  if (typeof stringToUTF8 !== 'function') missing.push('stringToUTF8')
  if (!(HEAPU8 instanceof Uint8Array)) missing.push('HEAPU8')
  if (missing.length > 0) return `missing WASM exports: ${missing.join(', ')}`

  type P11Fn = (...args: number[]) => number
  const fn_GetSlotList = _C_GetSlotList as P11Fn
  const fn_OpenSession = _C_OpenSession as P11Fn
  const fn_Login = _C_Login as P11Fn
  const fn_GenerateKeyPair = _C_GenerateKeyPair as P11Fn
  const fn_Logout = _C_Logout as P11Fn
  const fn_CloseSession = _C_CloseSession as P11Fn
  const fn_malloc = _malloc as P11Fn
  const fn_free = _free as P11Fn
  const fn_setValue = setValue as (p: number, v: number, t: string) => void
  const fn_getValue = getValue as (p: number, t: string) => number
  const fn_stringToUTF8 = stringToUTF8 as (s: string, p: number, n: number) => void
  const heap = HEAPU8 as Uint8Array

  if (typeof _C_Init2 === 'function') {
    const initRv = (_C_Init2 as P11Fn)(0)
    if (initRv !== 0 && initRv !== CKR_CRYPTOKI_ALREADY_INITIALIZED) {
      return `C_Initialize rv=0x${initRv.toString(16)}`
    }
  }

  const cntP = fn_malloc(4)
  fn_setValue(cntP, 0, 'i32')
  const slCountRv = fn_GetSlotList(1, 0, cntP)
  if (slCountRv !== 0) {
    fn_free(cntP)
    return `C_GetSlotList(count) rv=0x${slCountRv.toString(16)}`
  }
  const cnt = fn_getValue(cntP, 'i32')
  fn_free(cntP)
  if (cnt === 0) return `C_GetSlotList returned 0 initialized slots`

  const listP = fn_malloc(cnt * 4)
  const c2P = fn_malloc(4)
  fn_setValue(c2P, cnt, 'i32')
  const slFillRv = fn_GetSlotList(1, listP, c2P)
  if (slFillRv !== 0) {
    fn_free(listP)
    fn_free(c2P)
    return `C_GetSlotList(fill) rv=0x${slFillRv.toString(16)}`
  }
  const tokenSlot = fn_getValue(listP, 'i32')
  fn_free(listP)
  fn_free(c2P)

  const hSP = fn_malloc(4)
  fn_setValue(hSP, 0, 'i32')
  const openSessRv = fn_OpenSession(
    tokenSlot,
    CKF_RW_SESSION_VAL | CKF_SERIAL_SESSION_VAL,
    0,
    0,
    hSP
  )
  if (openSessRv !== 0) {
    fn_free(hSP)
    return `C_OpenSession(slot=${tokenSlot}) rv=0x${openSessRv.toString(16)}`
  }
  const hSession = fn_getValue(hSP, 'i32')
  fn_free(hSP)

  const pin = SOFTHSM_USER_PIN
  const pinP = fn_malloc(pin.length + 1)
  fn_stringToUTF8(pin, pinP, pin.length + 1)
  const loginRv = fn_Login(hSession, CKU_USER_VAL, pinP, pin.length)
  fn_free(pinP)
  if (loginRv !== 0) {
    fn_CloseSession(hSession)
    return `C_Login rv=0x${loginRv.toString(16)}`
  }

  // 65537 (0x010001) — standard RSA public exponent.
  const expBytes = new Uint8Array([0x01, 0x00, 0x01])
  const expP = fn_malloc(expBytes.length)
  heap.set(expBytes, expP)

  const boolTrueP = fn_malloc(1)
  heap[boolTrueP] = 1
  const pubClassP = fn_malloc(4)
  fn_setValue(pubClassP, CKO_PUBLIC_KEY_VAL, 'i32')
  const privClassP = fn_malloc(4)
  fn_setValue(privClassP, CKO_PRIVATE_KEY_VAL, 'i32')
  const keyTypeP = fn_malloc(4)
  fn_setValue(keyTypeP, CKK_RSA_VAL, 'i32')
  const modulusBitsP = fn_malloc(4)
  fn_setValue(modulusBitsP, bits, 'i32')

  const labelBytes = new TextEncoder().encode(keyId)
  const labelP = fn_malloc(labelBytes.length)
  heap.set(labelBytes, labelP)
  const idBytes = new TextEncoder().encode(keyId)
  const idP = fn_malloc(idBytes.length)
  heap.set(idBytes, idP)

  const mechP = fn_malloc(12)
  fn_setValue(mechP, CKM_RSA_PKCS_KEY_PAIR_GEN_VAL, 'i32')
  fn_setValue(mechP + 4, 0, 'i32')
  fn_setValue(mechP + 8, 0, 'i32')

  const writeAttr = (base: number, idx: number, type: number, valPtr: number, valLen: number) => {
    const off = base + idx * 12
    fn_setValue(off, type, 'i32')
    fn_setValue(off + 4, valPtr, 'i32')
    fn_setValue(off + 8, valLen, 'i32')
  }

  // Public key: CLASS, TOKEN, LABEL, ID, KEY_TYPE, MODULUS_BITS, PUBLIC_EXPONENT, VERIFY, ENCRYPT
  const pubAttrCount = 9
  const pubTplP = fn_malloc(pubAttrCount * 12)
  writeAttr(pubTplP, 0, CKA_CLASS_ATTR, pubClassP, 4)
  writeAttr(pubTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(pubTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(pubTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(pubTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(pubTplP, 5, CKA_MODULUS_BITS_ATTR, modulusBitsP, 4)
  writeAttr(pubTplP, 6, CKA_PUBLIC_EXPONENT_ATTR, expP, expBytes.length)
  writeAttr(pubTplP, 7, CKA_VERIFY_ATTR, boolTrueP, 1)
  writeAttr(pubTplP, 8, CKA_ENCRYPT_ATTR, boolTrueP, 1)

  // Private key: CLASS, TOKEN, LABEL, ID, KEY_TYPE, SENSITIVE, SIGN, DECRYPT
  const privAttrCount = 8
  const privTplP = fn_malloc(privAttrCount * 12)
  writeAttr(privTplP, 0, CKA_CLASS_ATTR, privClassP, 4)
  writeAttr(privTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(privTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(privTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(privTplP, 5, CKA_SENSITIVE_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 6, CKA_SIGN_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 7, CKA_DECRYPT_ATTR, boolTrueP, 1)

  const hPubP = fn_malloc(4)
  const hPrivP = fn_malloc(4)
  fn_setValue(hPubP, 0, 'i32')
  fn_setValue(hPrivP, 0, 'i32')

  const genRv = fn_GenerateKeyPair(
    hSession,
    mechP,
    pubTplP,
    pubAttrCount,
    privTplP,
    privAttrCount,
    hPubP,
    hPrivP
  )

  fn_free(hPubP)
  fn_free(hPrivP)
  fn_free(pubTplP)
  fn_free(privTplP)
  fn_free(mechP)
  fn_free(boolTrueP)
  fn_free(pubClassP)
  fn_free(privClassP)
  fn_free(keyTypeP)
  fn_free(modulusBitsP)
  fn_free(expP)
  fn_free(labelP)
  fn_free(idP)

  fn_Logout(hSession)
  fn_CloseSession(hSession)

  if (genRv !== 0)
    return `C_GenerateKeyPair(RSA-${bits}, slot=${tokenSlot}) rv=0x${genRv.toString(16)}`
  return null
}

/**
 * Generate an SLH-DSA key pair directly in softhsmv3 via C_GenerateKeyPair.
 * Mirrors generateMlDsaKeyInHsm — only the mechanism/key-type/paramSet differ.
 * Covers SLH-DSA-SHA2-128s/192s/256s (FIPS 205 § 9.1 small-sig variants).
 */
function generateSlhDsaKeyInHsm(M: OpenSSLModule, alg: CmsAlg, keyId: string): string | null {
  const paramSet = slhDsaParamSet(alg)
  if (paramSet < 0) return `bad paramSet for alg=${alg}`

  const {
    _C_GetSlotList,
    _C_OpenSession,
    _C_Login,
    _C_GenerateKeyPair,
    _C_Logout,
    _C_CloseSession,
    _malloc,
    _free,
    HEAPU8,
    setValue,
    getValue,
    stringToUTF8,
  } = M as OpenSSLModule & Record<string, unknown>

  const { _C_Initialize: _C_Init2 } = M as OpenSSLModule & Record<string, unknown>

  const missing: string[] = []
  if (typeof _C_GetSlotList !== 'function') missing.push('_C_GetSlotList')
  if (typeof _C_OpenSession !== 'function') missing.push('_C_OpenSession')
  if (typeof _C_Login !== 'function') missing.push('_C_Login')
  if (typeof _C_GenerateKeyPair !== 'function') missing.push('_C_GenerateKeyPair')
  if (typeof _C_Logout !== 'function') missing.push('_C_Logout')
  if (typeof _C_CloseSession !== 'function') missing.push('_C_CloseSession')
  if (typeof _malloc !== 'function') missing.push('_malloc')
  if (typeof _free !== 'function') missing.push('_free')
  if (typeof setValue !== 'function') missing.push('setValue')
  if (typeof getValue !== 'function') missing.push('getValue')
  if (typeof stringToUTF8 !== 'function') missing.push('stringToUTF8')
  if (!(HEAPU8 instanceof Uint8Array)) missing.push('HEAPU8')
  if (missing.length > 0) return `missing WASM exports: ${missing.join(', ')}`

  type P11Fn = (...args: number[]) => number
  const fn_GetSlotList = _C_GetSlotList as P11Fn
  const fn_OpenSession = _C_OpenSession as P11Fn
  const fn_Login = _C_Login as P11Fn
  const fn_GenerateKeyPair = _C_GenerateKeyPair as P11Fn
  const fn_Logout = _C_Logout as P11Fn
  const fn_CloseSession = _C_CloseSession as P11Fn
  const fn_malloc = _malloc as P11Fn
  const fn_free = _free as P11Fn
  const fn_setValue = setValue as (p: number, v: number, t: string) => void
  const fn_getValue = getValue as (p: number, t: string) => number
  const fn_stringToUTF8 = stringToUTF8 as (s: string, p: number, n: number) => void
  const heap = HEAPU8 as Uint8Array

  if (typeof _C_Init2 === 'function') {
    const initRv = (_C_Init2 as P11Fn)(0)
    if (initRv !== 0 && initRv !== CKR_CRYPTOKI_ALREADY_INITIALIZED) {
      return `C_Initialize rv=0x${initRv.toString(16)}`
    }
  }

  const cntP = fn_malloc(4)
  fn_setValue(cntP, 0, 'i32')
  const slCountRv = fn_GetSlotList(1, 0, cntP)
  if (slCountRv !== 0) {
    fn_free(cntP)
    return `C_GetSlotList(count) rv=0x${slCountRv.toString(16)}`
  }
  const cnt = fn_getValue(cntP, 'i32')
  fn_free(cntP)
  if (cnt === 0) return `C_GetSlotList returned 0 initialized slots`

  const listP = fn_malloc(cnt * 4)
  const c2P = fn_malloc(4)
  fn_setValue(c2P, cnt, 'i32')
  const slFillRv = fn_GetSlotList(1, listP, c2P)
  if (slFillRv !== 0) {
    fn_free(listP)
    fn_free(c2P)
    return `C_GetSlotList(fill) rv=0x${slFillRv.toString(16)}`
  }
  const tokenSlot = fn_getValue(listP, 'i32')
  fn_free(listP)
  fn_free(c2P)

  const hSP = fn_malloc(4)
  fn_setValue(hSP, 0, 'i32')
  const openSessRv = fn_OpenSession(
    tokenSlot,
    CKF_RW_SESSION_VAL | CKF_SERIAL_SESSION_VAL,
    0,
    0,
    hSP
  )
  if (openSessRv !== 0) {
    fn_free(hSP)
    return `C_OpenSession(slot=${tokenSlot}) rv=0x${openSessRv.toString(16)}`
  }
  const hSession = fn_getValue(hSP, 'i32')
  fn_free(hSP)

  const pin = SOFTHSM_USER_PIN
  const pinP = fn_malloc(pin.length + 1)
  fn_stringToUTF8(pin, pinP, pin.length + 1)
  const loginRv = fn_Login(hSession, CKU_USER_VAL, pinP, pin.length)
  fn_free(pinP)
  if (loginRv !== 0) {
    fn_CloseSession(hSession)
    return `C_Login rv=0x${loginRv.toString(16)}`
  }

  const boolTrueP = fn_malloc(1)
  heap[boolTrueP] = 1
  const pubClassP = fn_malloc(4)
  fn_setValue(pubClassP, CKO_PUBLIC_KEY_VAL, 'i32')
  const privClassP = fn_malloc(4)
  fn_setValue(privClassP, CKO_PRIVATE_KEY_VAL, 'i32')
  const keyTypeP = fn_malloc(4)
  fn_setValue(keyTypeP, CKK_SLH_DSA_VAL, 'i32')
  const paramSetP = fn_malloc(4)
  fn_setValue(paramSetP, paramSet, 'i32')

  const labelBytes = new TextEncoder().encode(keyId)
  const labelP = fn_malloc(labelBytes.length)
  heap.set(labelBytes, labelP)
  const idBytes = new TextEncoder().encode(keyId)
  const idP = fn_malloc(idBytes.length)
  heap.set(idBytes, idP)

  const mechP = fn_malloc(12)
  fn_setValue(mechP, CKM_SLH_DSA_KEY_PAIR_GEN_VAL, 'i32')
  fn_setValue(mechP + 4, 0, 'i32')
  fn_setValue(mechP + 8, 0, 'i32')

  const writeAttr = (base: number, idx: number, type: number, valPtr: number, valLen: number) => {
    const off = base + idx * 12
    fn_setValue(off, type, 'i32')
    fn_setValue(off + 4, valPtr, 'i32')
    fn_setValue(off + 8, valLen, 'i32')
  }

  const pubAttrCount = 7
  const pubTplP = fn_malloc(pubAttrCount * 12)
  writeAttr(pubTplP, 0, CKA_CLASS_ATTR, pubClassP, 4)
  writeAttr(pubTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(pubTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(pubTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(pubTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(pubTplP, 5, CKA_PARAMETER_SET_ATTR, paramSetP, 4)
  writeAttr(pubTplP, 6, CKA_VERIFY_ATTR, boolTrueP, 1)

  const privAttrCount = 8
  const privTplP = fn_malloc(privAttrCount * 12)
  writeAttr(privTplP, 0, CKA_CLASS_ATTR, privClassP, 4)
  writeAttr(privTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(privTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(privTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(privTplP, 5, CKA_PARAMETER_SET_ATTR, paramSetP, 4)
  writeAttr(privTplP, 6, CKA_SENSITIVE_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 7, CKA_SIGN_ATTR, boolTrueP, 1)

  const hPubP = fn_malloc(4)
  const hPrivP = fn_malloc(4)
  fn_setValue(hPubP, 0, 'i32')
  fn_setValue(hPrivP, 0, 'i32')

  const genRv = fn_GenerateKeyPair(
    hSession,
    mechP,
    pubTplP,
    pubAttrCount,
    privTplP,
    privAttrCount,
    hPubP,
    hPrivP
  )

  fn_free(hPubP)
  fn_free(hPrivP)
  fn_free(pubTplP)
  fn_free(privTplP)
  fn_free(mechP)
  fn_free(boolTrueP)
  fn_free(pubClassP)
  fn_free(privClassP)
  fn_free(keyTypeP)
  fn_free(paramSetP)
  fn_free(labelP)
  fn_free(idP)

  fn_Logout(hSession)
  fn_CloseSession(hSession)

  if (genRv !== 0) return `C_GenerateKeyPair(${alg}, slot=${tokenSlot}) rv=0x${genRv.toString(16)}`
  return null
}

/**
 * Generate an X25519 key pair directly in softhsmv3 via C_GenerateKeyPair.
 * Uses the Montgomery EC mechanism (CKM_EC_MONTGOMERY_KEY_PAIR_GEN) — NOT the
 * standard CKM_EC_KEY_PAIR_GEN (per softhsmv3 API quirk documented in the
 * softhsmv3-capabilities memory). Montgomery keys don't sign — DERIVE only —
 * so the public template carries no CKA_VERIFY and the private template no CKA_SIGN.
 * Use case: KEM-only recipient in CMS KeyAgreeRecipientInfo (ECDH).
 */
function generateX25519KeyInHsm(M: OpenSSLModule, keyId: string): string | null {
  const {
    _C_GetSlotList,
    _C_OpenSession,
    _C_Login,
    _C_GenerateKeyPair,
    _C_Logout,
    _C_CloseSession,
    _malloc,
    _free,
    HEAPU8,
    setValue,
    getValue,
    stringToUTF8,
  } = M as OpenSSLModule & Record<string, unknown>

  const { _C_Initialize: _C_Init2 } = M as OpenSSLModule & Record<string, unknown>

  const missing: string[] = []
  if (typeof _C_GetSlotList !== 'function') missing.push('_C_GetSlotList')
  if (typeof _C_OpenSession !== 'function') missing.push('_C_OpenSession')
  if (typeof _C_Login !== 'function') missing.push('_C_Login')
  if (typeof _C_GenerateKeyPair !== 'function') missing.push('_C_GenerateKeyPair')
  if (typeof _C_Logout !== 'function') missing.push('_C_Logout')
  if (typeof _C_CloseSession !== 'function') missing.push('_C_CloseSession')
  if (typeof _malloc !== 'function') missing.push('_malloc')
  if (typeof _free !== 'function') missing.push('_free')
  if (typeof setValue !== 'function') missing.push('setValue')
  if (typeof getValue !== 'function') missing.push('getValue')
  if (typeof stringToUTF8 !== 'function') missing.push('stringToUTF8')
  if (!(HEAPU8 instanceof Uint8Array)) missing.push('HEAPU8')
  if (missing.length > 0) return `missing WASM exports: ${missing.join(', ')}`

  type P11Fn = (...args: number[]) => number
  const fn_GetSlotList = _C_GetSlotList as P11Fn
  const fn_OpenSession = _C_OpenSession as P11Fn
  const fn_Login = _C_Login as P11Fn
  const fn_GenerateKeyPair = _C_GenerateKeyPair as P11Fn
  const fn_Logout = _C_Logout as P11Fn
  const fn_CloseSession = _C_CloseSession as P11Fn
  const fn_malloc = _malloc as P11Fn
  const fn_free = _free as P11Fn
  const fn_setValue = setValue as (p: number, v: number, t: string) => void
  const fn_getValue = getValue as (p: number, t: string) => number
  const fn_stringToUTF8 = stringToUTF8 as (s: string, p: number, n: number) => void
  const heap = HEAPU8 as Uint8Array

  if (typeof _C_Init2 === 'function') {
    const initRv = (_C_Init2 as P11Fn)(0)
    if (initRv !== 0 && initRv !== CKR_CRYPTOKI_ALREADY_INITIALIZED) {
      return `C_Initialize rv=0x${initRv.toString(16)}`
    }
  }

  const cntP = fn_malloc(4)
  fn_setValue(cntP, 0, 'i32')
  const slCountRv = fn_GetSlotList(1, 0, cntP)
  if (slCountRv !== 0) {
    fn_free(cntP)
    return `C_GetSlotList(count) rv=0x${slCountRv.toString(16)}`
  }
  const cnt = fn_getValue(cntP, 'i32')
  fn_free(cntP)
  if (cnt === 0) return `C_GetSlotList returned 0 initialized slots`

  const listP = fn_malloc(cnt * 4)
  const c2P = fn_malloc(4)
  fn_setValue(c2P, cnt, 'i32')
  const slFillRv = fn_GetSlotList(1, listP, c2P)
  if (slFillRv !== 0) {
    fn_free(listP)
    fn_free(c2P)
    return `C_GetSlotList(fill) rv=0x${slFillRv.toString(16)}`
  }
  const tokenSlot = fn_getValue(listP, 'i32')
  fn_free(listP)
  fn_free(c2P)

  const hSP = fn_malloc(4)
  fn_setValue(hSP, 0, 'i32')
  const openSessRv = fn_OpenSession(
    tokenSlot,
    CKF_RW_SESSION_VAL | CKF_SERIAL_SESSION_VAL,
    0,
    0,
    hSP
  )
  if (openSessRv !== 0) {
    fn_free(hSP)
    return `C_OpenSession(slot=${tokenSlot}) rv=0x${openSessRv.toString(16)}`
  }
  const hSession = fn_getValue(hSP, 'i32')
  fn_free(hSP)

  const pin = SOFTHSM_USER_PIN
  const pinP = fn_malloc(pin.length + 1)
  fn_stringToUTF8(pin, pinP, pin.length + 1)
  const loginRv = fn_Login(hSession, CKU_USER_VAL, pinP, pin.length)
  fn_free(pinP)
  if (loginRv !== 0) {
    fn_CloseSession(hSession)
    return `C_Login rv=0x${loginRv.toString(16)}`
  }

  // DER-encoded OID 1.3.101.110 (X25519).
  const x25519Oid = new Uint8Array([0x06, 0x03, 0x2b, 0x65, 0x6e])
  const ecParamsP = fn_malloc(x25519Oid.length)
  heap.set(x25519Oid, ecParamsP)

  const boolTrueP = fn_malloc(1)
  heap[boolTrueP] = 1
  const pubClassP = fn_malloc(4)
  fn_setValue(pubClassP, CKO_PUBLIC_KEY_VAL, 'i32')
  const privClassP = fn_malloc(4)
  fn_setValue(privClassP, CKO_PRIVATE_KEY_VAL, 'i32')
  const keyTypeP = fn_malloc(4)
  fn_setValue(keyTypeP, CKK_EC_MONTGOMERY_VAL, 'i32')

  const labelBytes = new TextEncoder().encode(keyId)
  const labelP = fn_malloc(labelBytes.length)
  heap.set(labelBytes, labelP)
  const idBytes = new TextEncoder().encode(keyId)
  const idP = fn_malloc(idBytes.length)
  heap.set(idBytes, idP)

  const mechP = fn_malloc(12)
  fn_setValue(mechP, CKM_EC_MONTGOMERY_KEY_PAIR_GEN_VAL, 'i32')
  fn_setValue(mechP + 4, 0, 'i32')
  fn_setValue(mechP + 8, 0, 'i32')

  const writeAttr = (base: number, idx: number, type: number, valPtr: number, valLen: number) => {
    const off = base + idx * 12
    fn_setValue(off, type, 'i32')
    fn_setValue(off + 4, valPtr, 'i32')
    fn_setValue(off + 8, valLen, 'i32')
  }

  // Public key: CLASS, TOKEN, LABEL, ID, KEY_TYPE, EC_PARAMS, DERIVE
  // No CKA_VERIFY — Montgomery curves are ECDH-only, no signing.
  const pubAttrCount = 7
  const pubTplP = fn_malloc(pubAttrCount * 12)
  writeAttr(pubTplP, 0, CKA_CLASS_ATTR, pubClassP, 4)
  writeAttr(pubTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(pubTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(pubTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(pubTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(pubTplP, 5, CKA_EC_PARAMS_ATTR, ecParamsP, x25519Oid.length)
  writeAttr(pubTplP, 6, CKA_DERIVE_ATTR, boolTrueP, 1)

  // Private key: CLASS, TOKEN, LABEL, ID, KEY_TYPE, SENSITIVE, DERIVE
  const privAttrCount = 7
  const privTplP = fn_malloc(privAttrCount * 12)
  writeAttr(privTplP, 0, CKA_CLASS_ATTR, privClassP, 4)
  writeAttr(privTplP, 1, CKA_TOKEN_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 2, CKA_LABEL_ATTR, labelP, labelBytes.length)
  writeAttr(privTplP, 3, CKA_ID_ATTR, idP, idBytes.length)
  writeAttr(privTplP, 4, CKA_KEY_TYPE_ATTR, keyTypeP, 4)
  writeAttr(privTplP, 5, CKA_SENSITIVE_ATTR, boolTrueP, 1)
  writeAttr(privTplP, 6, CKA_DERIVE_ATTR, boolTrueP, 1)

  const hPubP = fn_malloc(4)
  const hPrivP = fn_malloc(4)
  fn_setValue(hPubP, 0, 'i32')
  fn_setValue(hPrivP, 0, 'i32')

  const genRv = fn_GenerateKeyPair(
    hSession,
    mechP,
    pubTplP,
    pubAttrCount,
    privTplP,
    privAttrCount,
    hPubP,
    hPrivP
  )

  fn_free(hPubP)
  fn_free(hPrivP)
  fn_free(pubTplP)
  fn_free(privTplP)
  fn_free(mechP)
  fn_free(boolTrueP)
  fn_free(pubClassP)
  fn_free(privClassP)
  fn_free(keyTypeP)
  fn_free(ecParamsP)
  fn_free(labelP)
  fn_free(idP)

  fn_Logout(hSession)
  fn_CloseSession(hSession)

  if (genRv !== 0) return `C_GenerateKeyPair(X25519, slot=${tokenSlot}) rv=0x${genRv.toString(16)}`
  return null
}

// pqctoday_cms_init() registers pkcs11-provider as a builtin in the GLOBAL
// OpenSSL lib ctx (NULL). CLI `-provider pkcs11` flags create a SEPARATE
// app_libctx that does NOT inherit that builtin; OpenSSL falls back to
// dlopen("/usr/local/lib/ossl-modules/pkcs11.so") → NULL (file absent in
// WASM) → "Module initialization failed!".  Without the flags the CLI uses
// the global lib ctx where the provider is already loaded, pkcs11: URI store
// ops work, and the HSM path is fully functional.  apps_startup() (Fix A)
// calls pqctoday_cms_init() inside every callMain() so the provider is always
// loaded before any CLI command accesses a pkcs11: URI.
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
    if (mlDsaParamSet(alg) >= 0) {
      // ML-DSA: generate key pair directly in softhsmv3 via C_GenerateKeyPair.
      // `genpkey -out pkcs11:...` routes output through POSIX open() (BIO) which
      // writes a PEM file to the WASM MEMFS root — it does NOT use OSSL_STORE and
      // the key never reaches softhsmv3. Direct PKCS#11 key generation stores the
      // key object in the file-backed token so pkcs11: URI references in req and
      // cms commands find it via C_FindObjects.
      const errDetail = generateMlDsaKeyInHsm(M, alg, keyId)
      if (errDetail !== null) {
        post({
          type: 'ERROR',
          error: `HSM keygen (${alg}): ${errDetail}`,
          requestId,
        })
        return
      }
    } else if (alg === 'EC') {
      // EC P-256: use direct PKCS#11 C_GenerateKeyPair so the key object lands
      // in the softhsmv3 token and is reachable via pkcs11:object=<keyId> URIs.
      // `genpkey -out pkcs11:...` writes a PEM to MEMFS (BIO path), not the token.
      const errDetail = generateEcKeyInHsm(M, keyId)
      if (errDetail !== null) {
        post({
          type: 'ERROR',
          error: `HSM keygen (EC): ${errDetail}`,
          requestId,
        })
        return
      }
    } else if (mlKemParamSet(alg) >= 0) {
      // ML-KEM: same rationale as ML-DSA — go direct via C_GenerateKeyPair so
      // the key lands in the token (genpkey -out pkcs11:... writes a PEM to MEMFS).
      const errDetail = generateMlKemKeyInHsm(M, alg, keyId)
      if (errDetail !== null) {
        post({
          type: 'ERROR',
          error: `HSM keygen (${alg}): ${errDetail}`,
          requestId,
        })
        return
      }
    } else if (slhDsaParamSet(alg) >= 0) {
      // SLH-DSA: FIPS 205 small-sig variants via direct C_GenerateKeyPair.
      const errDetail = generateSlhDsaKeyInHsm(M, alg, keyId)
      if (errDetail !== null) {
        post({
          type: 'ERROR',
          error: `HSM keygen (${alg}): ${errDetail}`,
          requestId,
        })
        return
      }
    } else if (alg === 'RSA' || alg === 'RSA-PSS') {
      // RSA-3072 via direct C_GenerateKeyPair. Same modulus floor as the
      // software path; PSS-vs-PKCS#1v1.5 routing is set at sign time.
      const errDetail = generateRsaKeyInHsm(M, keyId)
      if (errDetail !== null) {
        post({
          type: 'ERROR',
          error: `HSM keygen (${alg}): ${errDetail}`,
          requestId,
        })
        return
      }
    } else if (alg === 'X25519') {
      // X25519 via direct C_GenerateKeyPair with Montgomery mechanism.
      const errDetail = generateX25519KeyInHsm(M, keyId)
      if (errDetail !== null) {
        post({
          type: 'ERROR',
          error: `HSM keygen (X25519): ${errDetail}`,
          requestId,
        })
        return
      }
    } else if (isCompositeAlg(alg)) {
      // LAMPS draft-19 composite OIDs. The composite cert/sig flow needs
      // TWO softhsm-resident subkeys (one ML-DSA, one classical), then
      // pkcs11-provider's composite.c stitches them together via the
      // pqctoday_composite_* shims at mkcert/sign/verify time.
      // openssl genpkey on the composite alg name cannot do this — it
      // doesn't know how to construct a composite EVP_PKEY from softhsm
      // objects (the IMPORT path takes a C pointer, not a CLI URI).
      const errDetail = generateCompositeSubkeys(M, alg, keyId)
      if (errDetail !== null) {
        post({
          type: 'ERROR',
          error: `HSM keygen (${alg}): ${errDetail}`,
          requestId,
        })
        return
      }
    } else {
      post({
        type: 'ERROR',
        error: `HSM keygen: unsupported algorithm ${alg}`,
        requestId,
      })
      return
    }
    // Persist ALL softhsm token object files so the next module instance
    // restores the key during vfs rehydration.
    persistSoftHsmTokenFiles(M)
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
      : alg === 'RSA' || alg === 'RSA-PSS'
        ? ['genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:3072', '-out', keyPath]
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
  alg: CmsAlg | undefined,
  requestId?: string
): Promise<void> {
  const M = await newModuleSafe(useHsm, requestId)
  if (!M) return
  const subjectKeyPath = `/ssl/${keyId}.key`
  const subjectPubPath = `/ssl/${keyId}.pub`
  const certPath = `/ssl/${certId}.crt`

  // Composite path: forks before any CLI invocation. Subkeys must already
  // be in softhsm under the ${keyId}__pq / ${keyId}__cl convention
  // (CMS_GENKEY routed through generateCompositeSubkeys above).
  if (isCompositeAlg(alg) && useHsm) {
    const compositeOid = compositeOidFor(alg as CmsAlg)
    if (!compositeOid) {
      post({ type: 'ERROR', error: `unknown composite alg: ${alg}`, requestId })
      return
    }
    const { pqKeyId, classicalKeyId } = compositeSubkeyIds(keyId)
    const subjectCn = subject.replace(/^\/?CN=/i, '')
    vfs.delete(certPath)
    safeUnlink(M, certPath)
    probeSofthsmTokenDir(M, 'mkcert-start (module B, after vfs rehydrate)')
    // Direct softhsm C_FindObjects probes — bypass pkcs11-provider's URI
    // parser entirely. If softhsm returns 0 handles here, the bug is at
    // the softhsm layer. If it returns 1+, the bug is in pkcs11-provider's
    // URI → C_FindObjects template translation.
    probeFindObjectsByLabel(M, pqKeyId, 'mkcert-find-pq')
    probeFindObjectsByLabel(M, classicalKeyId, 'mkcert-find-cl')
    // Decode each .object file's CKA_LABEL so we can see WHAT softhsm
    // thinks the labels are vs. what our URI is searching for. softhsm
    // serializes objects as a flat key/value blob: each attribute is
    // {u32 type, u32 len, bytes}. CKA_LABEL = 0x00000003.
    try {
      const tokenRoot = M.FS.readdir(SOFTHSM_TOKEN_DIR) as string[]
      for (const tokenDir of tokenRoot) {
        if (tokenDir === '.' || tokenDir === '..') continue
        const tokenPath = `${SOFTHSM_TOKEN_DIR}/${tokenDir}`
        let objs: string[] = []
        try {
          objs = M.FS.readdir(tokenPath) as string[]
        } catch {
          continue
        }
        for (const obj of objs) {
          if (!obj.endsWith('.object')) continue
          const data = M.FS.readFile(`${tokenPath}/${obj}`) as Uint8Array
          const txt = new TextDecoder('utf-8', { fatal: false }).decode(data)
          const found: string[] = []
          for (const candidate of [pqKeyId, classicalKeyId]) {
            if (txt.includes(candidate)) found.push(candidate)
          }
          // Hex-dump first 256 bytes of each file so we can see softhsm's
          // serialization layout — attribute IDs are little-endian u32 at
          // the start of each {type,len,bytes} record.
          const head = Array.from(data.slice(0, 256))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(' ')

          console.error(
            `[obj-probe] ${tokenDir}/${obj} bytes=${data.byteLength} labels-found=${JSON.stringify(found)}\n  head256: ${head}`
          )
        }
      }
    } catch (err) {
      console.error(`[obj-probe] failed: ${String(err)}`)
    }
    const rc = compositeMkCert(
      M,
      compositeOid,
      pkcs11Uri(pqKeyId),
      pkcs11Uri(classicalKeyId),
      subjectCn,
      days ?? 365,
      certPath
    )
    if (rc !== 0 || !fileExists(M, certPath)) {
      post({
        type: 'ERROR',
        error: `composite mkcert (${alg}) failed (rc=${rc}) — softhsm subkeys at ${pqKeyId} + ${classicalKeyId} must exist`,
        requestId,
      })
      return
    }
    const certPem = readPem(M, certPath)
    persistVfs(M, [certPath])
    post({ type: 'CMS_MKCERT_RESULT', certPem, requestId })
    return
  }

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

    const pubArgs = useHsm
      ? ['-in', `${subjectKeyArg};type=public`, '-pubin']
      : ['-in', subjectKeyArg]

    // Step 1 — extract subject pubkey. After this callMain the runtime is
    // dead; we discard the module before step 2.
    const pubRc = runOpenssl(M, [
      'pkey',
      ...providerArgs,
      ...pubArgs,
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
  alg: CmsAlg | undefined,
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

  // Composite path — the high-level CMS SignedData assembly + verify lives in
  // the MAIN THREAD inside CMSSigningService (services/compositeCms.ts).
  // The service intercepts before this worker call, so reaching here means
  // the caller bypassed the service or hit a coding error. Bail loudly.
  if (isCompositeAlg(alg)) {
    post({
      type: 'ERROR',
      error: `composite alg ${alg} must be orchestrated by CMSSigningService; the worker only exposes COMPOSITE_PRIMITIVE_SIGN_* primitives for composite signing`,
      requestId,
    })
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
  // For RSA-PSS, force PSS padding via -keyopt so the SignerInfo carries
  // id-RSASSA-PSS (not sha256WithRSAEncryption). Without this, OpenSSL CMS
  // puts PKCS1v1.5 in the SignerInfo but the verify path rejects it when it
  // encounters a PSS-mode key.
  const rsaPssKeyopts: string[] =
    alg === 'RSA-PSS'
      ? [
          '-keyopt',
          'rsa_padding_mode:pss',
          '-keyopt',
          'rsa_pss_saltlen:32',
          '-keyopt',
          'rsa_mgf1_md:sha256',
        ]
      : []
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
    ...rsaPssKeyopts,
  ])
  if (rc !== 0 || !fileExists(M, outPath)) {
    post({
      type: 'ERROR',
      error: `cms -sign failed (rc=${rc}): ${stderr}`,
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
  alg: CmsAlg | undefined,
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

  // Composite verify lives in the MAIN THREAD (see CMSSigningService +
  // services/compositeCms.ts). Hitting this branch means the service didn't
  // intercept — bail loudly so the regression is obvious.
  if (isCompositeAlg(alg)) {
    post({
      type: 'ERROR',
      error: `composite alg ${alg} verify must be orchestrated by CMSSigningService; the worker does not parse composite CMS SignedData`,
      requestId,
    })
    return
  }

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
  // With HSM mode, append ;type=private so the PKCS#11 store only returns
  // the private key object (CKO_PRIVATE_KEY). Without this, the store returns
  // both public and private ML-KEM objects; OpenSSL then tries to extract
  // the public key from the private key object to match against the cert,
  // but the export_fn has no public bytes on a CKO_PRIVATE_KEY → match fails.
  const inkeyArg = useHsm ? `${pkcs11Uri(recipientKeyId)};type=private` : keyPath
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

/** Return the bytes of a `/ssl/...` file from the persistent vfs. Used by
 *  CMSSigningService to fetch the composite cert DER without spinning up an
 *  openssl module. We avoid round-tripping through openssl `x509 -outform`
 *  for what is essentially a base64 decode. */
function readVfsFile(path: string, requestId?: string): void {
  // PEM-to-DER conversion lives in the service. Worker just returns raw bytes
  // (will be PEM text for .crt / .key files written by the openssl CLI).
  const data = vfs.get(path)
  if (!data) {
    post({ type: 'ERROR', error: `READ_VFS_FILE: not in vfs: ${path}`, requestId })
    return
  }
  // Clone so the caller can't mutate vfs state.
  post({ type: 'READ_VFS_FILE_RESULT', data: data.slice(), requestId })
}

/** Run one PKCS#11 primitive sign in a fresh openssl WASM module instance.
 *  EXIT_RUNTIME=1 means each callMain destroys the module; we instantiate a
 *  new one, hydrate the softhsm token from vfs, locate the private key by
 *  label, sign once, persist any state, and return the signature bytes. */
async function compositePrimitiveSign(
  keyId: string,
  primitive: 'ml-dsa' | 'ecdsa-digest' | 'rsa-pss-sha256',
  data: Uint8Array,
  ctx: Uint8Array | undefined,
  requestId?: string
): Promise<void> {
  const M = await newModuleSafe(true, requestId)
  if (!M) return
  const { session, detail } = openP11Session(M)
  if (!session) {
    post({ type: 'ERROR', error: `compositePrimitiveSign: openP11Session: ${detail}`, requestId })
    return
  }
  const handle = findPrivKeyHandle(M, session.hSession, keyId)
  if (handle <= 0) {
    closeP11Session(M, session)
    post({
      type: 'ERROR',
      error: `compositePrimitiveSign: no private key handle for label "${keyId}" (rc=${handle})`,
      requestId,
    })
    return
  }
  try {
    let signature: Uint8Array
    if (primitive === 'ml-dsa') {
      signature = p11SignMldsaWithCtx(M, session.hSession, handle, data, ctx ?? new Uint8Array(0))
    } else if (primitive === 'ecdsa-digest') {
      // Caller supplies the digest; CKM_ECDSA returns raw r||s. DER encoding
      // is the service's job (it knows the spec wire format).
      signature = p11SignEcdsaDigest(M, session.hSession, handle, data)
    } else {
      signature = p11SignRsaPssSha256(M, session.hSession, handle, data)
    }
    closeP11Session(M, session)
    post({ type: 'COMPOSITE_PRIMITIVE_SIGN_RESULT', signature, requestId })
  } catch (err) {
    closeP11Session(M, session)
    post({
      type: 'ERROR',
      error: `compositePrimitiveSign(${primitive}): ${err instanceof Error ? err.message : String(err)}`,
      requestId,
    })
  }
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
        msg.alg,
        msg.requestId
      )
      break
    case 'CMS_SIGN':
      void cmsSign(msg.keyId, msg.certId, msg.payload, msg.useHsm, msg.alg, msg.requestId)
      break
    case 'CMS_VERIFY':
      void cmsVerify(msg.signedP7m, msg.certId, msg.useHsm, msg.alg, msg.requestId)
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
    case 'READ_VFS_FILE':
      readVfsFile(msg.path, msg.requestId)
      break
    case 'COMPOSITE_PRIMITIVE_SIGN':
      void compositePrimitiveSign(msg.keyId, msg.primitive, msg.data, msg.ctx, msg.requestId)
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

// SPDX-License-Identifier: GPL-3.0-only
//
// openssh.ts — softhsmv3-driven SSH handshake engine.
//
// Replaces the old Web Worker / SharedArrayBuffer approach with direct calls
// to softhsmv3 PKCS#11 helpers.  All key material is generated inside the
// token; private key bytes never leave the HSM boundary.

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import type { Pkcs11LogEntry } from './softhsm'
import {
  hsm_generateEdDSAKeyPair,
  hsm_generateECKeyPair,
  hsm_generateMLDSAKeyPair,
  hsm_generateMLKEMKeyPair,
  hsm_generateSLHDSAKeyPair,
  hsm_ecdhDerive,
  hsm_eddsaSign,
  hsm_signBytesMLDSA,
  hsm_signBytesSLHDSA,
  hsm_encapsulate,
  hsm_extractECPoint,
  hsm_extractKeyValue,
  hsm_digest,
  CKM_SHA256,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHA2_128F,
  CKP_SLH_DSA_SHAKE_128S,
  CKP_SLH_DSA_SHAKE_128F,
  CKP_SLH_DSA_SHA2_256S,
  CKP_SLH_DSA_SHA2_256F,
  CKP_SLH_DSA_SHAKE_256S,
  CKP_SLH_DSA_SHAKE_256F,
  createLoggingProxy,
} from './softhsm'

// CKD_NULL is not exported from softhsm.ts so we declare our own alias.
const CKD_NULL_VALUE = 0x00000001

// ── SSH wire framing helpers ──────────────────────────────────────────────────

function sshUint32(n: number): Uint8Array {
  const b = new Uint8Array(4)
  const v = new DataView(b.buffer)
  v.setUint32(0, n, false)
  return b
}

function sshString(data: Uint8Array): Uint8Array {
  return concat(sshUint32(data.length), data)
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrs) {
    out.set(a, off)
    off += a.length
  }
  return out
}

// ── Public types ─────────────────────────────────────────────────────────────

export interface SshHandshakeResult {
  connection_ok: boolean
  quantum_safe: boolean
  host_key_algorithm: string
  client_auth_algorithm: string
  kex_algorithm: string
  host_pubkey_bytes: number
  client_pubkey_bytes: number
  kex_share_bytes: number
  kex_reply_share_bytes: number
  host_sig_bytes: number
  client_sig_bytes: number
  auth_ms: number
  keygen_ms: number
  kex_ms: number
  host_sig_ms: number
  client_sig_ms: number
  pkcs11_host_backed: boolean
  pkcs11_client_backed: boolean
  token_module: string
  wire_packets: SshWirePacket[]
  error?: string
}

export interface SshWirePacket {
  direction: 'C→S' | 'S→C'
  msgType: string
  msgNum: number
  sizeBytes: number
  hexPreview: string
}

/**
 * SSH KEX algorithms exposed by this engine.
 *
 * Classical:
 *   - curve25519-sha256                  RFC 8731 (X25519 only)
 *
 * Hybrid ML-KEM + classical (draft-ietf-sshm-mlkem-hybrid-kex-10):
 *   - mlkem512-curve25519-sha256
 *   - mlkem768-curve25519-sha256         (current production hybrid)
 *   - mlkem1024-curve25519-sha256
 *   - mlkem512-nistp256-sha256
 *   - mlkem768-nistp256-sha256
 *
 * Pure ML-KEM (CNSA 2.0 SSH profile, no classical fallback):
 *   - mlkem768
 *   - mlkem1024
 */
export type SshKexAlg =
  | 'curve25519-sha256'
  | 'mlkem512-curve25519-sha256'
  | 'mlkem768-curve25519-sha256'
  | 'mlkem1024-curve25519-sha256'
  | 'mlkem512-nistp256-sha256'
  | 'mlkem768-nistp256-sha256'
  | 'mlkem768'
  | 'mlkem1024'

/**
 * SSH host-key signature algorithms exposed by this engine.
 *
 * The 8 `ssh-slh-dsa-*` ids are every FIPS 205 parameter set the connector's
 * openssh-pkcs11/patches/ssh-slhdsa.c actually implements (2026-08-31 SLH-DSA
 * UI wiring) — the 128-/256-bit SHA2 and SHAKE variants in both `s` (small
 * signature) and `f` (fast) modes. The 192-bit sets (SHA2/SHAKE-192s/192f)
 * are deliberately absent: draft-josefsson-ssh-sphincs-02 (the wire-name
 * source) defines no standalone SSH algorithm name for them.
 */
export type SshHostKeyAlg =
  | 'ssh-ed25519'
  | 'ssh-mldsa-44'
  | 'ssh-mldsa-65'
  | 'ssh-mldsa-87'
  | 'ssh-slh-dsa-sha2-128s'
  | 'ssh-slh-dsa-sha2-128f'
  | 'ssh-slh-dsa-shake-128s'
  | 'ssh-slh-dsa-shake-128f'
  | 'ssh-slh-dsa-sha2-256s'
  | 'ssh-slh-dsa-sha2-256f'
  | 'ssh-slh-dsa-shake-256s'
  | 'ssh-slh-dsa-shake-256f'

export interface SshHandshakeConfig {
  kex: SshKexAlg
  hostKey: SshHostKeyAlg
}

/**
 * Back-compat alias — the engine used to take a coarse `'classical' | 'pqc'`
 * mode. Existing callers can still pass the string; we map it to the
 * structured config they would have gotten before.
 */
export type SshAlgoMode = 'classical' | 'pqc'

export const SSH_KEX_OPTIONS: ReadonlyArray<{
  id: SshKexAlg
  label: string
  family: 'classical' | 'hybrid' | 'pure'
  /** Public-share bytes shipped by the client in KEX_ECDH_INIT (Q_C). */
  clientShareBytes: number
  /** Reply share bytes shipped by the server in KEX_ECDH_REPLY (Q_S). */
  serverShareBytes: number
}> = [
  {
    id: 'curve25519-sha256',
    label: 'curve25519-sha256 (classical)',
    family: 'classical',
    clientShareBytes: 32,
    serverShareBytes: 32,
  },
  {
    id: 'mlkem512-curve25519-sha256',
    label: 'mlkem512-curve25519-sha256 (hybrid)',
    family: 'hybrid',
    clientShareBytes: 800 + 32,
    serverShareBytes: 768 + 32,
  },
  {
    id: 'mlkem768-curve25519-sha256',
    label: 'mlkem768-curve25519-sha256 (hybrid)',
    family: 'hybrid',
    clientShareBytes: 1184 + 32,
    serverShareBytes: 1088 + 32,
  },
  {
    id: 'mlkem1024-curve25519-sha256',
    label: 'mlkem1024-curve25519-sha256 (hybrid)',
    family: 'hybrid',
    clientShareBytes: 1568 + 32,
    serverShareBytes: 1568 + 32,
  },
  {
    id: 'mlkem512-nistp256-sha256',
    label: 'mlkem512-nistp256-sha256 (hybrid)',
    family: 'hybrid',
    clientShareBytes: 800 + 65,
    serverShareBytes: 768 + 65,
  },
  {
    id: 'mlkem768-nistp256-sha256',
    label: 'mlkem768-nistp256-sha256 (hybrid)',
    family: 'hybrid',
    clientShareBytes: 1184 + 65,
    serverShareBytes: 1088 + 65,
  },
  {
    id: 'mlkem768',
    label: 'mlkem768 (pure ML-KEM)',
    family: 'pure',
    clientShareBytes: 1184,
    serverShareBytes: 1088,
  },
  {
    id: 'mlkem1024',
    label: 'mlkem1024 (pure ML-KEM)',
    family: 'pure',
    clientShareBytes: 1568,
    serverShareBytes: 1568,
  },
]

export const SSH_HOST_KEY_OPTIONS: ReadonlyArray<{ id: SshHostKeyAlg; label: string }> = [
  { id: 'ssh-ed25519', label: 'ssh-ed25519 (classical)' },
  { id: 'ssh-mldsa-44', label: 'ssh-mldsa-44 (PQC)' },
  { id: 'ssh-mldsa-65', label: 'ssh-mldsa-65 (PQC)' },
  { id: 'ssh-mldsa-87', label: 'ssh-mldsa-87 (PQC)' },
  // Order matches openssh-pkcs11/wasm-shims/sshd_wasm_main.c's HOSTKEY_VARIANTS[] table.
  { id: 'ssh-slh-dsa-sha2-128s', label: 'ssh-slh-dsa-sha2-128s (PQC)' },
  { id: 'ssh-slh-dsa-sha2-128f', label: 'ssh-slh-dsa-sha2-128f (PQC)' },
  { id: 'ssh-slh-dsa-shake-128s', label: 'ssh-slh-dsa-shake-128s (PQC)' },
  { id: 'ssh-slh-dsa-shake-128f', label: 'ssh-slh-dsa-shake-128f (PQC)' },
  { id: 'ssh-slh-dsa-sha2-256s', label: 'ssh-slh-dsa-sha2-256s (PQC)' },
  { id: 'ssh-slh-dsa-sha2-256f', label: 'ssh-slh-dsa-sha2-256f (PQC)' },
  { id: 'ssh-slh-dsa-shake-256s', label: 'ssh-slh-dsa-shake-256s (PQC)' },
  { id: 'ssh-slh-dsa-shake-256f', label: 'ssh-slh-dsa-shake-256f (PQC)' },
]

export interface SshHsmBinding {
  module: SoftHSMModule
  hSession: number
  onPkcs11?: (e: Pkcs11LogEntry) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexPrev(msgNum: number, extra?: Uint8Array): string {
  const base = msgNum.toString(16).padStart(2, '0')
  if (!extra || extra.length === 0) return base
  const tail = Array.from(extra.slice(0, 6))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ')
  return `${base} ${tail}`
}

// Convert Uint8Array to latin-1 string for hsm_eddsaSign (which TextEncoder-encodes it back).
// We pass raw bytes as latin-1 characters so no byte is lost.
function bytesToLatin1(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return s
}

function stripX25519DerWrapper(raw: Uint8Array): Uint8Array {
  if (raw.length === 34 && raw[0] === 0x04 && raw[1] === 0x20) return raw.slice(2)
  return raw
}

/**
 * Extract the raw uncompressed point bytes for a P-256 public key. softhsmv3
 * returns CKA_EC_POINT as a DER OCTET STRING wrapping the SEC1 point
 * (`04 41 04 X Y` — 67 bytes total). We strip the 2-byte DER prefix to get the
 * 65-byte SEC1 uncompressed point used on the SSH wire.
 */
function stripP256DerWrapper(raw: Uint8Array): Uint8Array {
  if (raw.length === 67 && raw[0] === 0x04 && raw[1] === 0x41) return raw.slice(2)
  return raw
}

// ── Per-algorithm parameter resolution ───────────────────────────────────────

function kexAlgInfo(kex: SshKexAlg): {
  mlkemVariant: 512 | 768 | 1024 | null
  classicalCurve: 'X25519' | 'P-256' | null
  isHybrid: boolean
  isPurePqc: boolean
  isClassicalOnly: boolean
} {
  switch (kex) {
    case 'curve25519-sha256':
      return {
        mlkemVariant: null,
        classicalCurve: 'X25519',
        isHybrid: false,
        isPurePqc: false,
        isClassicalOnly: true,
      }
    case 'mlkem512-curve25519-sha256':
      return {
        mlkemVariant: 512,
        classicalCurve: 'X25519',
        isHybrid: true,
        isPurePqc: false,
        isClassicalOnly: false,
      }
    case 'mlkem768-curve25519-sha256':
      return {
        mlkemVariant: 768,
        classicalCurve: 'X25519',
        isHybrid: true,
        isPurePqc: false,
        isClassicalOnly: false,
      }
    case 'mlkem1024-curve25519-sha256':
      return {
        mlkemVariant: 1024,
        classicalCurve: 'X25519',
        isHybrid: true,
        isPurePqc: false,
        isClassicalOnly: false,
      }
    case 'mlkem512-nistp256-sha256':
      return {
        mlkemVariant: 512,
        classicalCurve: 'P-256',
        isHybrid: true,
        isPurePqc: false,
        isClassicalOnly: false,
      }
    case 'mlkem768-nistp256-sha256':
      return {
        mlkemVariant: 768,
        classicalCurve: 'P-256',
        isHybrid: true,
        isPurePqc: false,
        isClassicalOnly: false,
      }
    case 'mlkem768':
      return {
        mlkemVariant: 768,
        classicalCurve: null,
        isHybrid: false,
        isPurePqc: true,
        isClassicalOnly: false,
      }
    case 'mlkem1024':
      return {
        mlkemVariant: 1024,
        classicalCurve: null,
        isHybrid: false,
        isPurePqc: true,
        isClassicalOnly: false,
      }
  }
}

function hostKeyAlgInfo(hk: SshHostKeyAlg): {
  isClassical: boolean
  mldsaVariant: 44 | 65 | 87 | null
  /** One of the CKP_SLH_DSA_* constants, or null for a non-SLH-DSA host key. */
  slhdsaParamSet: number | null
} {
  switch (hk) {
    case 'ssh-ed25519':
      return { isClassical: true, mldsaVariant: null, slhdsaParamSet: null }
    case 'ssh-mldsa-44':
      return { isClassical: false, mldsaVariant: 44, slhdsaParamSet: null }
    case 'ssh-mldsa-65':
      return { isClassical: false, mldsaVariant: 65, slhdsaParamSet: null }
    case 'ssh-mldsa-87':
      return { isClassical: false, mldsaVariant: 87, slhdsaParamSet: null }
    case 'ssh-slh-dsa-sha2-128s':
      return { isClassical: false, mldsaVariant: null, slhdsaParamSet: CKP_SLH_DSA_SHA2_128S }
    case 'ssh-slh-dsa-sha2-128f':
      return { isClassical: false, mldsaVariant: null, slhdsaParamSet: CKP_SLH_DSA_SHA2_128F }
    case 'ssh-slh-dsa-shake-128s':
      return { isClassical: false, mldsaVariant: null, slhdsaParamSet: CKP_SLH_DSA_SHAKE_128S }
    case 'ssh-slh-dsa-shake-128f':
      return { isClassical: false, mldsaVariant: null, slhdsaParamSet: CKP_SLH_DSA_SHAKE_128F }
    case 'ssh-slh-dsa-sha2-256s':
      return { isClassical: false, mldsaVariant: null, slhdsaParamSet: CKP_SLH_DSA_SHA2_256S }
    case 'ssh-slh-dsa-sha2-256f':
      return { isClassical: false, mldsaVariant: null, slhdsaParamSet: CKP_SLH_DSA_SHA2_256F }
    case 'ssh-slh-dsa-shake-256s':
      return { isClassical: false, mldsaVariant: null, slhdsaParamSet: CKP_SLH_DSA_SHAKE_256S }
    case 'ssh-slh-dsa-shake-256f':
      return { isClassical: false, mldsaVariant: null, slhdsaParamSet: CKP_SLH_DSA_SHAKE_256F }
  }
}

/**
 * Generate a host/client PQC signing key pair for the family the selected
 * host-key algorithm belongs to (ML-DSA or SLH-DSA), dispatching to the
 * matching softhsm.ts primitive. Both families' generators share the same
 * `(M, hSession, extractable)` tail shape once the variant/param-set is
 * bound, so callers don't need to branch again after this point.
 */
function generateHostKeyPair(
  M: SoftHSMModule,
  h: number,
  host: ReturnType<typeof hostKeyAlgInfo>,
  extractable: boolean
): { pubHandle: number; privHandle: number } {
  if (host.mldsaVariant !== null) {
    return hsm_generateMLDSAKeyPair(M, h, host.mldsaVariant, extractable)
  }
  if (host.slhdsaParamSet !== null) {
    return hsm_generateSLHDSAKeyPair(M, h, host.slhdsaParamSet, extractable)
  }
  throw new Error('generateHostKeyPair invoked on non-PQC host key')
}

/**
 * Sign raw bytes with the matching family's C_Sign helper. hsm_signBytesMLDSA
 * and hsm_signBytesSLHDSA both take `(M, hSession, privHandle, data)`, so this
 * is a thin family dispatch, not a behavior change for either.
 */
function signWithHostKeyFamily(
  M: SoftHSMModule,
  h: number,
  host: ReturnType<typeof hostKeyAlgInfo>,
  privHandle: number,
  data: Uint8Array
): Uint8Array {
  if (host.mldsaVariant !== null) return hsm_signBytesMLDSA(M, h, privHandle, data)
  if (host.slhdsaParamSet !== null) return hsm_signBytesSLHDSA(M, h, privHandle, data)
  throw new Error('signWithHostKeyFamily invoked on non-PQC host key')
}

// ── Classical handshake (curve25519-sha256 + ssh-ed25519) ────────────────────

async function runClassical(
  M: SoftHSMModule,
  h: number,
  config: SshHandshakeConfig
): Promise<SshHandshakeResult> {
  const kexInitBytes = 104

  const t0 = performance.now()

  // Key generation phase
  const hostEd = hsm_generateEdDSAKeyPair(M, h, 'Ed25519', false)
  const clientEd = hsm_generateEdDSAKeyPair(M, h, 'Ed25519', false)
  const serverX = hsm_generateECKeyPair(M, h, 'X25519', false)
  const clientX = hsm_generateECKeyPair(M, h, 'X25519', false)

  const t1 = performance.now()

  // Extract public keys
  const serverX25519Pub = hsm_extractECPoint(M, h, serverX.pubHandle)
  const clientX25519Pub = hsm_extractECPoint(M, h, clientX.pubHandle)

  const serverX25519Raw = stripX25519DerWrapper(serverX25519Pub)
  const clientX25519Raw = stripX25519DerWrapper(clientX25519Pub)

  const hostEd25519Pub = hsm_extractECPoint(M, h, hostEd.pubHandle)
  const hostEd25519Raw = stripX25519DerWrapper(hostEd25519Pub)

  // KEX phase: ECDH derive on both sides
  const serverDerived = hsm_ecdhDerive(
    M,
    h,
    serverX.privHandle,
    clientX25519Raw,
    CKD_NULL_VALUE,
    undefined,
    { keyLen: 32, extractable: true }
  )
  const clientDerived = hsm_ecdhDerive(
    M,
    h,
    clientX.privHandle,
    serverX25519Raw,
    CKD_NULL_VALUE,
    undefined,
    { keyLen: 32, extractable: true }
  )

  const serverSS = hsm_extractKeyValue(M, h, serverDerived)
  const clientSS = hsm_extractKeyValue(M, h, clientDerived)
  void clientSS // both sides derive same secret; server drives the hash

  // Exchange hash H per RFC 8731
  const enc = new TextEncoder()
  const K_S = concat(sshString(enc.encode(config.hostKey)), sshString(hostEd25519Raw))
  const Q_C = sshString(clientX25519Raw)
  const Q_S = sshString(serverX25519Raw)
  const K = sshString(serverSS)
  const hashInput = concat(sshString(K_S), Q_C, Q_S, K)
  const H = hsm_digest(M, h, hashInput, CKM_SHA256)

  const t2 = performance.now()

  // Host signature
  const hostSig = hsm_eddsaSign(M, h, hostEd.privHandle, bytesToLatin1(H))
  const t3 = performance.now()

  // Client signature (userauth)
  const clientSig = hsm_eddsaSign(M, h, clientEd.privHandle, bytesToLatin1(H))
  const t4 = performance.now()

  // Wire packets
  const host_pubkey_bytes = 4 + config.hostKey.length + 4 + 32
  const kex_share_bytes = 36 // sshString(32B X25519 pub)
  const kex_reply_share_bytes = 36
  const host_sig_bytes = hostSig.length
  const client_sig_bytes = clientSig.length
  const client_pubkey_bytes = host_pubkey_bytes

  const replySize = 4 + host_pubkey_bytes + 4 + kex_reply_share_bytes + 4 + host_sig_bytes

  const wire_packets: SshWirePacket[] = [
    {
      direction: 'C→S',
      msgType: 'SSH_MSG_KEXINIT',
      msgNum: 20,
      sizeBytes: kexInitBytes,
      hexPreview: hexPrev(20),
    },
    {
      direction: 'S→C',
      msgType: 'SSH_MSG_KEXINIT',
      msgNum: 20,
      sizeBytes: kexInitBytes,
      hexPreview: hexPrev(20),
    },
    {
      direction: 'C→S',
      msgType: 'SSH_MSG_KEX_ECDH_INIT',
      msgNum: 30,
      sizeBytes: 4 + kex_share_bytes,
      hexPreview: hexPrev(30, clientX25519Raw),
    },
    {
      direction: 'S→C',
      msgType: 'SSH_MSG_KEX_ECDH_REPLY',
      msgNum: 31,
      sizeBytes: replySize,
      hexPreview: hexPrev(31, hostEd25519Raw),
    },
    {
      direction: 'C→S',
      msgType: 'SSH_MSG_NEWKEYS',
      msgNum: 21,
      sizeBytes: 1,
      hexPreview: hexPrev(21),
    },
    {
      direction: 'S→C',
      msgType: 'SSH_MSG_NEWKEYS',
      msgNum: 21,
      sizeBytes: 1,
      hexPreview: hexPrev(21),
    },
    {
      direction: 'C→S',
      msgType: 'SSH_MSG_SERVICE_REQUEST',
      msgNum: 5,
      sizeBytes: 15,
      hexPreview: hexPrev(5),
    },
    {
      direction: 'C→S',
      msgType: 'SSH_MSG_USERAUTH_REQUEST',
      msgNum: 50,
      sizeBytes: 4 + 4 + 14 + 4 + client_sig_bytes,
      hexPreview: hexPrev(50),
    },
    {
      direction: 'S→C',
      msgType: 'SSH_MSG_USERAUTH_SUCCESS',
      msgNum: 52,
      sizeBytes: 1,
      hexPreview: hexPrev(52),
    },
  ]

  return {
    connection_ok: true,
    quantum_safe: false,
    host_key_algorithm: config.hostKey,
    client_auth_algorithm: config.hostKey,
    kex_algorithm: config.kex,
    host_pubkey_bytes,
    client_pubkey_bytes,
    kex_share_bytes,
    kex_reply_share_bytes,
    host_sig_bytes,
    client_sig_bytes,
    auth_ms: t4 - t0,
    keygen_ms: t1 - t0,
    kex_ms: t2 - t1,
    host_sig_ms: t3 - t2,
    client_sig_ms: t4 - t3,
    pkcs11_host_backed: true,
    pkcs11_client_backed: true,
    token_module: 'softhsmv3 (WASM)',
    wire_packets,
  }
}

// ── PQC handshake (ML-KEM KEX + ML-DSA/SLH-DSA host key) ─────────────────────
//
// Handles hybrid (ML-KEM + classical X25519/P-256, draft-ietf-sshm-mlkem-hybrid-kex)
// and pure ML-KEM-{768,1024} (CNSA 2.0 SSH profile) modes against any of the
// three ML-DSA host-key parameter sets, or any of the 8 SLH-DSA parameter sets
// (generateHostKeyPair/signWithHostKeyFamily dispatch on config.hostKey's family).

async function runPqc(
  M: SoftHSMModule,
  h: number,
  config: SshHandshakeConfig
): Promise<SshHandshakeResult> {
  const kex = kexAlgInfo(config.kex)
  const host = hostKeyAlgInfo(config.hostKey)
  if (kex.mlkemVariant === null) {
    throw new Error(`runPqc invoked on non-PQC KEX ${config.kex}`)
  }
  if (host.mldsaVariant === null && host.slhdsaParamSet === null) {
    throw new Error(`runPqc invoked on non-PQC host key ${config.hostKey}`)
  }

  const kexInitBytes = 112

  const t0 = performance.now()

  // Key generation phase — dispatches to ML-DSA or SLH-DSA generation
  // depending on which family config.hostKey belongs to.
  const hostDsa = generateHostKeyPair(M, h, host, false)
  const clientDsa = generateHostKeyPair(M, h, host, false)
  const clientKem = hsm_generateMLKEMKeyPair(M, h, kex.mlkemVariant, true)

  // Classical ECDH key pairs only generated for hybrid modes.
  const serverEc = kex.classicalCurve
    ? hsm_generateECKeyPair(M, h, kex.classicalCurve, false)
    : null
  const clientEc = kex.classicalCurve
    ? hsm_generateECKeyPair(M, h, kex.classicalCurve, false)
    : null

  const t1 = performance.now()

  // Extract public keys
  // ML-KEM public key: CKA_VALUE on public key object.
  const clientKemPub = hsm_extractKeyValue(M, h, clientKem.pubHandle)

  // Classical EC public keys (X25519: raw 32B; P-256: SEC1 uncompressed 65B).
  let serverEcRaw: Uint8Array | null = null
  let clientEcRaw: Uint8Array | null = null
  if (serverEc && clientEc && kex.classicalCurve) {
    const stripper = kex.classicalCurve === 'X25519' ? stripX25519DerWrapper : stripP256DerWrapper
    serverEcRaw = stripper(hsm_extractECPoint(M, h, serverEc.pubHandle))
    clientEcRaw = stripper(hsm_extractECPoint(M, h, clientEc.pubHandle))
  }

  // Client init share = ML-KEM pub (+ classical pub if hybrid)
  const clientInitShare = clientEcRaw ? concat(clientKemPub, clientEcRaw) : clientKemPub
  const kex_share_bytes = clientInitShare.length

  // Server: encapsulate to client's ML-KEM public key
  const { ciphertextBytes: kemCt, secretHandle: kemSSHandle } = hsm_encapsulate(
    M,
    h,
    clientKem.pubHandle,
    kex.mlkemVariant
  )
  const SS_pq = hsm_extractKeyValue(M, h, kemSSHandle)

  // Classical ECDH (hybrid only)
  let SS_classical: Uint8Array | null = null
  if (serverEc && clientEcRaw) {
    const serverDerived = hsm_ecdhDerive(
      M,
      h,
      serverEc.privHandle,
      clientEcRaw,
      CKD_NULL_VALUE,
      undefined,
      { keyLen: 32, extractable: true }
    )
    SS_classical = hsm_extractKeyValue(M, h, serverDerived)
  }

  // K derivation:
  //   hybrid: K = SHA-256(SS_pq || SS_classical) per draft-kampanakis §3.1
  //   pure ML-KEM: K = SHA-256(SS_pq) — single-component hash for transcript stability
  const hybridInput = SS_classical ? concat(SS_pq, SS_classical) : SS_pq
  const K = hsm_digest(M, h, hybridInput, CKM_SHA256)

  // Server reply: ML-KEM ciphertext (+ classical pub if hybrid)
  const serverReplyShare = serverEcRaw ? concat(kemCt, serverEcRaw) : kemCt
  const kex_reply_share_bytes = serverReplyShare.length

  const t2 = performance.now()

  // Exchange hash H
  const enc = new TextEncoder()
  const host_dsa_pub_raw = hsm_extractKeyValue(M, h, hostDsa.pubHandle)
  const K_S = concat(sshString(enc.encode(config.hostKey)), sshString(host_dsa_pub_raw))
  const Q_C = sshString(clientInitShare)
  const Q_S = sshString(serverReplyShare)
  const K_wrapped = sshString(K)
  const hashInput = concat(sshString(K_S), Q_C, Q_S, K_wrapped)
  const H = hsm_digest(M, h, hashInput, CKM_SHA256)

  // Host signature (ML-DSA or SLH-DSA, per config.hostKey's family)
  const hostSig = signWithHostKeyFamily(M, h, host, hostDsa.privHandle, H)
  const t3 = performance.now()

  // Client signature (same family as the host key)
  const clientSig = signWithHostKeyFamily(M, h, host, clientDsa.privHandle, H)
  const t4 = performance.now()

  const host_pubkey_bytes = 4 + config.hostKey.length + 4 + host_dsa_pub_raw.length
  const client_pubkey_bytes = host_pubkey_bytes
  const host_sig_bytes = hostSig.length
  const client_sig_bytes = clientSig.length

  const replySize = 4 + host_pubkey_bytes + 4 + kex_reply_share_bytes + 4 + host_sig_bytes

  const wire_packets: SshWirePacket[] = [
    {
      direction: 'C→S',
      msgType: 'SSH_MSG_KEXINIT',
      msgNum: 20,
      sizeBytes: kexInitBytes,
      hexPreview: hexPrev(20),
    },
    {
      direction: 'S→C',
      msgType: 'SSH_MSG_KEXINIT',
      msgNum: 20,
      sizeBytes: kexInitBytes,
      hexPreview: hexPrev(20),
    },
    {
      direction: 'C→S',
      msgType: 'SSH_MSG_KEX_ECDH_INIT',
      msgNum: 30,
      sizeBytes: 4 + kex_share_bytes,
      hexPreview: hexPrev(30, clientInitShare),
    },
    {
      direction: 'S→C',
      msgType: 'SSH_MSG_KEX_ECDH_REPLY',
      msgNum: 31,
      sizeBytes: replySize,
      hexPreview: hexPrev(31, host_dsa_pub_raw),
    },
    {
      direction: 'C→S',
      msgType: 'SSH_MSG_NEWKEYS',
      msgNum: 21,
      sizeBytes: 1,
      hexPreview: hexPrev(21),
    },
    {
      direction: 'S→C',
      msgType: 'SSH_MSG_NEWKEYS',
      msgNum: 21,
      sizeBytes: 1,
      hexPreview: hexPrev(21),
    },
    {
      direction: 'C→S',
      msgType: 'SSH_MSG_SERVICE_REQUEST',
      msgNum: 5,
      sizeBytes: 15,
      hexPreview: hexPrev(5),
    },
    {
      direction: 'C→S',
      msgType: 'SSH_MSG_USERAUTH_REQUEST',
      msgNum: 50,
      sizeBytes: 4 + 4 + 14 + 4 + client_sig_bytes,
      hexPreview: hexPrev(50),
    },
    {
      direction: 'S→C',
      msgType: 'SSH_MSG_USERAUTH_SUCCESS',
      msgNum: 52,
      sizeBytes: 1,
      hexPreview: hexPrev(52),
    },
  ]

  return {
    connection_ok: true,
    quantum_safe: true,
    host_key_algorithm: config.hostKey,
    client_auth_algorithm: config.hostKey,
    kex_algorithm: config.kex,
    host_pubkey_bytes,
    client_pubkey_bytes,
    kex_share_bytes,
    kex_reply_share_bytes,
    host_sig_bytes,
    client_sig_bytes,
    auth_ms: t4 - t0,
    keygen_ms: t1 - t0,
    kex_ms: t2 - t1,
    host_sig_ms: t3 - t2,
    client_sig_ms: t4 - t3,
    pkcs11_host_backed: true,
    pkcs11_client_backed: true,
    token_module: 'softhsmv3 (WASM)',
    wire_packets,
  }
}

// ── SshEngine ─────────────────────────────────────────────────────────────────

/**
 * Normalise the legacy `'classical' | 'pqc'` mode strings into the structured
 * `SshHandshakeConfig` the engine now consumes internally. Keeps existing
 * callers (tests, embedded learn-module runners) working without churn.
 */
function normaliseConfig(input: SshAlgoMode | SshHandshakeConfig): SshHandshakeConfig {
  if (typeof input === 'string') {
    return input === 'classical'
      ? { kex: 'curve25519-sha256', hostKey: 'ssh-ed25519' }
      : { kex: 'mlkem768-curve25519-sha256', hostKey: 'ssh-mldsa-65' }
  }
  return input
}

export class SshEngine {
  private binding: SshHsmBinding | null = null

  public bindHsm(binding: SshHsmBinding | null): void {
    this.binding = binding
  }

  public async runHandshake(input: SshAlgoMode | SshHandshakeConfig): Promise<SshHandshakeResult> {
    if (!this.binding) throw new Error('No HSM binding — call bindHsm() first')
    const { module, hSession, onPkcs11 } = this.binding
    const M = onPkcs11 ? createLoggingProxy(module, onPkcs11, 'rust') : module

    const config = normaliseConfig(input)
    const kex = kexAlgInfo(config.kex)

    try {
      if (kex.isClassicalOnly) return await runClassical(M, hSession, config)
      return await runPqc(M, hSession, config)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const base: SshHandshakeResult = {
        connection_ok: false,
        quantum_safe: !kex.isClassicalOnly,
        host_key_algorithm: config.hostKey,
        client_auth_algorithm: config.hostKey,
        kex_algorithm: config.kex,
        host_pubkey_bytes: 0,
        client_pubkey_bytes: 0,
        kex_share_bytes: 0,
        kex_reply_share_bytes: 0,
        host_sig_bytes: 0,
        client_sig_bytes: 0,
        auth_ms: 0,
        keygen_ms: 0,
        kex_ms: 0,
        host_sig_ms: 0,
        client_sig_ms: 0,
        pkcs11_host_backed: false,
        pkcs11_client_backed: false,
        token_module: 'softhsmv3 (WASM)',
        wire_packets: [],
        error: msg,
      }
      return base
    }
  }

  public terminate(): void {
    this.binding = null
  }
}

export const sshEngine = new SshEngine()

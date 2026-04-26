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
  hsm_ecdhDerive,
  hsm_eddsaSign,
  hsm_signBytesMLDSA,
  hsm_encapsulate,
  hsm_extractECPoint,
  hsm_extractKeyValue,
  hsm_digest,
  CKM_SHA256,
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

export type SshAlgoMode = 'classical' | 'pqc'

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

// ── Classical handshake (curve25519-sha256 + ssh-ed25519) ────────────────────

async function runClassical(M: SoftHSMModule, h: number): Promise<SshHandshakeResult> {
  const kexInitBytes = 104

  const t0 = performance.now()

  // Key generation phase
  const hostEd = hsm_generateEdDSAKeyPair(M, h, 'Ed25519', false)
  const clientEd = hsm_generateEdDSAKeyPair(M, h, 'Ed25519', false)
  const serverX = hsm_generateECKeyPair(M, h, 'X25519', false)
  const clientX = hsm_generateECKeyPair(M, h, 'X25519', false)

  const t1 = performance.now()

  // Extract public keys
  // X25519 → raw 32 bytes (CKA_VALUE); Ed25519 → DER-wrapped (strip 0x04 0x20)
  const serverX25519Pub = hsm_extractECPoint(M, h, serverX.pubHandle)
  const clientX25519Pub = hsm_extractECPoint(M, h, clientX.pubHandle)

  function stripDerWrapper(raw: Uint8Array): Uint8Array {
    if (raw.length === 34 && raw[0] === 0x04 && raw[1] === 0x20) return raw.slice(2)
    return raw
  }

  const serverX25519Raw = stripDerWrapper(serverX25519Pub)
  const clientX25519Raw = stripDerWrapper(clientX25519Pub)

  const hostEd25519Pub = hsm_extractECPoint(M, h, hostEd.pubHandle)
  const hostEd25519Raw = stripDerWrapper(hostEd25519Pub)

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
  const K_S = concat(sshString(enc.encode('ssh-ed25519')), sshString(hostEd25519Raw))
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
  const host_pubkey_bytes = 4 + 11 + 4 + 32 // sshString("ssh-ed25519") + sshString(32B key)
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
    host_key_algorithm: 'ssh-ed25519',
    client_auth_algorithm: 'ssh-ed25519',
    kex_algorithm: 'curve25519-sha256',
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

// ── PQC handshake (mlkem768x25519-sha256 + ssh-mldsa-65) ─────────────────────

async function runPqc(M: SoftHSMModule, h: number): Promise<SshHandshakeResult> {
  const kexInitBytes = 112

  const t0 = performance.now()

  // Key generation phase
  const hostDsa = hsm_generateMLDSAKeyPair(M, h, 65, false)
  const clientDsa = hsm_generateMLDSAKeyPair(M, h, 65, false)
  const clientKem = hsm_generateMLKEMKeyPair(M, h, 768, true)
  const serverX = hsm_generateECKeyPair(M, h, 'X25519', false)
  const clientX = hsm_generateECKeyPair(M, h, 'X25519', false)

  const t1 = performance.now()

  // Extract public keys
  function stripDerWrapper(raw: Uint8Array): Uint8Array {
    if (raw.length === 34 && raw[0] === 0x04 && raw[1] === 0x20) return raw.slice(2)
    return raw
  }

  // ML-KEM-768 public key: 1184 bytes (CKA_VALUE on public key object)
  const clientKemPub = hsm_extractKeyValue(M, h, clientKem.pubHandle)
  // X25519 public keys: 32 bytes each
  const serverX25519Raw = stripDerWrapper(hsm_extractECPoint(M, h, serverX.pubHandle))
  const clientX25519Raw = stripDerWrapper(hsm_extractECPoint(M, h, clientX.pubHandle))

  // Client init share = ML-KEM pub (1184B) + X25519 pub (32B) = 1216B
  const clientInitShare = concat(clientKemPub, clientX25519Raw)
  const kex_share_bytes = clientInitShare.length // 1216

  // Server: encapsulate to client's ML-KEM public key → ciphertext 1088B + SS_pq 32B
  const { ciphertextBytes: kemCt, secretHandle: kemSSHandle } = hsm_encapsulate(
    M,
    h,
    clientKem.pubHandle,
    768
  )
  const SS_pq = hsm_extractKeyValue(M, h, kemSSHandle)

  // Server ECDH with client X25519 pub
  const serverDerived = hsm_ecdhDerive(
    M,
    h,
    serverX.privHandle,
    clientX25519Raw,
    CKD_NULL_VALUE,
    undefined,
    { keyLen: 32, extractable: true }
  )
  const SS_classical = hsm_extractKeyValue(M, h, serverDerived)

  // Hybrid K = SHA-256(SS_pq || SS_classical)  per draft-kampanakis §3.1
  const hybridInput = concat(SS_pq, SS_classical)
  const K = hsm_digest(M, h, hybridInput, CKM_SHA256)

  // Server reply: ML-KEM ciphertext (1088B) + server X25519 pub (32B) = 1120B
  const serverReplyShare = concat(kemCt, serverX25519Raw)
  const kex_reply_share_bytes = serverReplyShare.length // 1120

  const t2 = performance.now()

  // Exchange hash H
  const enc = new TextEncoder()
  const host_dsa_pub_raw = hsm_extractKeyValue(M, h, hostDsa.pubHandle)
  const K_S = concat(sshString(enc.encode('ssh-mldsa-65')), sshString(host_dsa_pub_raw))
  const Q_C = sshString(clientInitShare)
  const Q_S = sshString(serverReplyShare)
  const K_wrapped = sshString(K)
  const hashInput = concat(sshString(K_S), Q_C, Q_S, K_wrapped)
  const H = hsm_digest(M, h, hashInput, CKM_SHA256)

  // Host signature (ML-DSA-65)
  const hostSig = hsm_signBytesMLDSA(M, h, hostDsa.privHandle, H)
  const t3 = performance.now()

  // Client signature (ML-DSA-65)
  const clientSig = hsm_signBytesMLDSA(M, h, clientDsa.privHandle, H)
  const t4 = performance.now()

  const host_pubkey_bytes = 4 + 12 + 4 + host_dsa_pub_raw.length // sshString("ssh-mldsa-65") + sshString(pub)
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
    host_key_algorithm: 'ssh-mldsa-65',
    client_auth_algorithm: 'ssh-mldsa-65',
    kex_algorithm: 'mlkem768x25519-sha256',
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

export class SshEngine {
  private binding: SshHsmBinding | null = null

  public bindHsm(binding: SshHsmBinding | null): void {
    this.binding = binding
  }

  public async runHandshake(mode: SshAlgoMode): Promise<SshHandshakeResult> {
    if (!this.binding) throw new Error('No HSM binding — call bindHsm() first')
    const { module, hSession, onPkcs11 } = this.binding
    const M = onPkcs11 ? createLoggingProxy(module, onPkcs11, 'rust') : module

    try {
      if (mode === 'classical') return await runClassical(M, hSession)
      return await runPqc(M, hSession)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const base: SshHandshakeResult = {
        connection_ok: false,
        quantum_safe: mode === 'pqc',
        host_key_algorithm: '',
        client_auth_algorithm: '',
        kex_algorithm: '',
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

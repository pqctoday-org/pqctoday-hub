// SPDX-License-Identifier: GPL-3.0-only
//
// openssh-real.ts — bridge to the REAL OpenSSH WASM handshake.
//
// Unlike the modelled `sshEngine` (./openssh.ts), this drives the genuine
// OpenSSH binary (built from pqctoday-hsm/openssh-pkcs11): a real
// mlkem768x25519-sha256 KEX with an ssh-mldsa-65 host key, real publickey
// userauth, every signature produced by the token's C_Sign — the private keys
// never leave the embedded softhsmv3.
//
// The bundle is self-contained (embeds softhsm, single-process loopback), so the
// bridge is far simpler than StrongSwanEngine: one worker, one run, an event
// stream over postMessage. No SharedArrayBuffer, no RPC.

/** A structured handshake event emitted by the binary (payload is a JSON string). */
export interface SshRealEvent {
  evType: string
  payload: string
}

export interface SshRealLog {
  level: 'info' | 'error'
  text: string
}

export interface SshRealRunResult {
  rv: number
  events: SshRealEvent[]
}

export interface SshRealRunCallbacks {
  /** KEX algorithm wire name, e.g. "mlkem768x25519-sha256" or "curve25519-sha256". */
  kex?: string
  /** Host/user key algorithm, e.g. "ssh-mldsa-65" or "ecdsa-sha2-nistp256". */
  hostalg?: string
  onEvent?: (ev: SshRealEvent) => void
  onLog?: (log: SshRealLog) => void
}

const RUN_TIMEOUT_MS = 60_000

export class SshRealEngine {
  private worker: Worker | null = null

  /**
   * Run one real handshake to completion. Spawns a fresh worker (the wasm
   * bootstraps its token once per instance, so each run gets a clean engine),
   * streams events/logs via the callbacks, and resolves with the full event
   * list when the binary reaches its `done` event.
   */
  public runHandshake(cb: SshRealRunCallbacks = {}): Promise<SshRealRunResult> {
    this.terminate()

    return new Promise<SshRealRunResult>((resolve, reject) => {
      const events: SshRealEvent[] = []
      let settled = false

      const worker = new Worker('/wasm/openssh_worker.js')
      this.worker = worker

      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        this.terminate()
        reject(new Error(`real SSH handshake timed out after ${RUN_TIMEOUT_MS / 1000}s`))
      }, RUN_TIMEOUT_MS)

      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data || {}
        switch (msg.type) {
          case 'EVENT': {
            const ev: SshRealEvent = { evType: msg.evType, payload: msg.payload }
            events.push(ev)
            cb.onEvent?.(ev)
            break
          }
          case 'LOG':
            cb.onLog?.({ level: msg.level === 'error' ? 'error' : 'info', text: msg.text })
            break
          case 'DONE':
            if (settled) return
            settled = true
            clearTimeout(timer)
            resolve({ rv: typeof msg.rv === 'number' ? msg.rv : 0, events })
            this.terminate()
            break
          case 'ERROR':
            if (settled) return
            settled = true
            clearTimeout(timer)
            reject(new Error(msg.message || 'real SSH handshake failed'))
            this.terminate()
            break
        }
      }

      worker.onerror = (err: ErrorEvent) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(new Error(err.message || 'openssh worker error'))
        this.terminate()
      }

      worker.postMessage({ type: 'RUN', kex: cb.kex, hostalg: cb.hostalg })
    })
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}

export const sshRealEngine = new SshRealEngine()

/** Find an event by type and parse its JSON payload (null if absent/unparsable). */
export function parseEvent<T = Record<string, unknown>>(
  events: SshRealEvent[],
  evType: string
): T | null {
  const ev = events.find((e) => e.evType === evType)
  if (!ev) return null
  try {
    return JSON.parse(ev.payload) as T
  } catch {
    return null
  }
}

// CKM mechanism codes that appear in the SSH trace (for friendly labels).
const MECH_NAMES: Record<number, string> = {
  0x1c: 'CKM_ML_DSA_KEY_PAIR_GEN',
  0x1d: 'CKM_ML_DSA',
}

/**
 * Map a "pkcs11" trace event (emitted by the in-wasm tap in pkcs11_static.c and
 * the shim) onto the playground's shared `Pkcs11LogEntry` shape, so the real
 * handshake's genuine C_* calls render in the same PKCS#11 panel the modelled
 * tools use. Returns null if the payload isn't a recognizable trace line.
 */
export function mapPkcs11Event(
  payload: string,
  id: number
): import('./softhsm').Pkcs11LogEntry | null {
  let o: Record<string, unknown>
  try {
    o = JSON.parse(payload)
  } catch {
    return null
  }
  if (typeof o.op !== 'string') return null
  const rv = typeof o.rv === 'number' ? o.rv : 0
  // Build a compact args string from the remaining fields.
  const args = Object.entries(o)
    .filter(([k]) => k !== 'op' && k !== 'rv')
    .map(([k, v]) => {
      if (k === 'mech' && typeof v === 'number')
        return `mech=${MECH_NAMES[v] ?? `0x${v.toString(16)}`}`
      return `${k}=${v}`
    })
    .join(' ')
  return {
    id,
    timestamp: new Date().toISOString().slice(11, 19),
    fn: o.op,
    args,
    rvHex: `0x${rv.toString(16).toUpperCase()}`,
    rvName: rv === 0 ? 'CKR_OK' : `0x${rv.toString(16).toUpperCase()}`,
    ms: 0,
    ok: rv === 0,
    engineName: 'openssh (real)',
  }
}

// The KEX the shim currently runs for real (hardcoded in drive_kex until
// M2a parameterizes it). The model's KEX id `mlkem768-curve25519-sha256` is the
// same algorithm as OpenSSH's wire name `mlkem768x25519-sha256`.
export const REAL_KEX_ID = 'mlkem768-curve25519-sha256'
// Default/primary real host-key id — kept for back-compat with existing callers
// (e.g. the honesty-banner default combo). Prefer REAL_HOSTKEY_IDS for a
// membership check.
export const REAL_HOSTKEY_ID = 'ssh-mldsa-65'
// All ML-DSA host-key parameter sets the rebuilt OpenSSH WASM binary can now
// actually sign with for real (2026-08-31 remediation: ssh-mldsa.c generalized
// from a single hardcoded ML-DSA-65 impl to a DEFINE_MLDSA_IMPL(...) macro
// covering all 3 FIPS 204 parameter sets, and wasm-shims/sshd_wasm_main.c's
// HOSTKEY_VARIANTS[] table now selects any of them by name via
// set_handshake_config). The modeled engine's ids (openssh.ts SshHostKeyAlg)
// are identical to the real OpenSSH wire names for these three, so no mapping
// is needed to pass a selection straight through to the real binary.
export const REAL_HOSTKEY_IDS: ReadonlySet<string> = new Set([
  'ssh-mldsa-44',
  'ssh-mldsa-65',
  'ssh-mldsa-87',
])

/** True when the chosen PQC combo is one the real binary actually runs. */
export function isRealCombo(kex: string, hostKey: string): boolean {
  return kex === REAL_KEX_ID && REAL_HOSTKEY_IDS.has(hostKey)
}

// Public-key wire sizes by host-key algorithm (approx, for the size bars).
// ML-DSA sizes are FIPS 204 Table 2 raw public keys, cross-checked against
// deps/openssl-src/openssl-3.6.3/include/crypto/ml_dsa.h (see openssh-pkcs11
// CHANGELOG.md 2026-08-31 entry).
const HOST_PUBKEY_BYTES: Record<string, number> = {
  'ssh-mldsa-44': 1312, // FIPS 204 ML-DSA-44 raw public key
  'ssh-mldsa-65': 1952, // FIPS 204 ML-DSA-65 raw public key
  'ssh-mldsa-87': 2592, // FIPS 204 ML-DSA-87 raw public key
  'ecdsa-sha2-nistp256': 65, // uncompressed P-256 point Q
}
// KEX init/reply share sizes by KEX algorithm.
const KEX_SHARES: Record<string, [number, number]> = {
  'mlkem768x25519-sha256': [1184 + 32, 1088 + 32], // ML-KEM-768 pk/ct + X25519
  'curve25519-sha256': [32, 32],
  'ecdh-sha2-nistp256': [65, 65],
  'ecdh-sha2-nistp384': [97, 97],
  'ecdh-sha2-nistp521': [133, 133],
}

// SSH message numbers (RFC 4253 §12, RFC 4252 §6).
const SSH_MSG = {
  KEXINIT: 20,
  NEWKEYS: 21,
  KEX_ECDH_INIT: 30,
  KEX_ECDH_REPLY: 31,
  USERAUTH_REQUEST: 50,
  USERAUTH_SUCCESS: 52,
}

/**
 * Reconstruct the SSH packet ladder for a real run from the milestone sizes the
 * binary reports (KEX shares, host/user signature lengths). The protocol message
 * sequence is fixed by RFC 4253/4252; the share/signature sizes are the genuine
 * values from the handshake, framing bytes are nominal. This drives the existing
 * wire-packet diagram/compare views for real runs (which otherwise have no
 * per-packet capture — the loopback only emits milestones, not byte streams).
 */
function buildWirePackets(
  r: import('./openssh').SshHandshakeResult
): import('./openssh').SshWirePacket[] {
  const pkt = (
    direction: 'C→S' | 'S→C',
    msgType: string,
    msgNum: number,
    sizeBytes: number
  ): import('./openssh').SshWirePacket => ({
    direction,
    msgType,
    msgNum,
    sizeBytes,
    hexPreview: msgNum.toString(16).padStart(2, '0'),
  })
  return [
    pkt('C→S', 'SSH_MSG_KEXINIT', SSH_MSG.KEXINIT, 1100),
    pkt('S→C', 'SSH_MSG_KEXINIT', SSH_MSG.KEXINIT, 1100),
    pkt('C→S', 'SSH_MSG_KEX_ECDH_INIT', SSH_MSG.KEX_ECDH_INIT, r.kex_share_bytes + 8),
    // Reply carries the host public key + server KEX share + exchange-hash signature.
    pkt(
      'S→C',
      'SSH_MSG_KEX_ECDH_REPLY',
      SSH_MSG.KEX_ECDH_REPLY,
      r.host_pubkey_bytes + r.kex_reply_share_bytes + r.host_sig_bytes + 24
    ),
    pkt('C→S', 'SSH_MSG_NEWKEYS', SSH_MSG.NEWKEYS, 16),
    pkt('S→C', 'SSH_MSG_NEWKEYS', SSH_MSG.NEWKEYS, 16),
    // Userauth request carries the user public key blob + signature.
    pkt(
      'C→S',
      'SSH_MSG_USERAUTH_REQUEST',
      SSH_MSG.USERAUTH_REQUEST,
      r.client_pubkey_bytes + r.client_sig_bytes + 48
    ),
    pkt('S→C', 'SSH_MSG_USERAUTH_SUCCESS', SSH_MSG.USERAUTH_SUCCESS, 8),
  ]
}

/**
 * Map the real handshake event stream onto the existing `SshHandshakeResult`
 * shape so the comparison/telemetry UI can render a genuine run. The KEX and
 * host-key names come from the binary's own `kex_start` event; signature sizes
 * come from `host_key_sign`/`user_key_sign`; KEX-share and pubkey sizes from the
 * lookups above. `auth_ms` is the measured wall-clock; per-phase timings aren't
 * emitted by the shim, so they're left at 0.
 */
export function mapRealEventsToResult(
  events: SshRealEvent[],
  rv: number,
  wallMs: number
): import('./openssh').SshHandshakeResult {
  const start = parseEvent<{ kex: string; hostkey: string }>(events, 'kex_start')
  const hostSign = parseEvent<{ sig_len: number }>(events, 'host_key_sign')
  const userSign = parseEvent<{ user_sig_len: number }>(events, 'user_key_sign')
  const newkeys = parseEvent<{ hostsign: string }>(events, 'newkeys')
  const success = parseEvent<{ usersign: string }>(events, 'userauth_success')
  const connection_ok = rv === 0 && success != null && newkeys != null

  const kex = start?.kex ?? 'mlkem768x25519-sha256'
  const hostalg = start?.hostkey ?? 'ssh-mldsa-65'
  const [clientShare, serverShare] = KEX_SHARES[kex] ?? [0, 0]
  const pub = HOST_PUBKEY_BYTES[hostalg] ?? 0
  // Quantum-safe when the KEX uses ML-KEM and the host key uses ML-DSA.
  const quantum_safe = kex.includes('mlkem') && hostalg.includes('mldsa')

  const result: import('./openssh').SshHandshakeResult = {
    connection_ok,
    quantum_safe,
    host_key_algorithm: hostalg,
    client_auth_algorithm: hostalg,
    kex_algorithm: kex,
    host_pubkey_bytes: pub,
    client_pubkey_bytes: pub,
    kex_share_bytes: clientShare,
    kex_reply_share_bytes: serverShare,
    host_sig_bytes: hostSign?.sig_len ?? 0,
    client_sig_bytes: userSign?.user_sig_len ?? 0,
    auth_ms: wallMs,
    keygen_ms: 0,
    kex_ms: 0,
    host_sig_ms: 0,
    client_sig_ms: 0,
    // Both host- and user-auth signatures were produced by the token's C_Sign.
    pkcs11_host_backed: newkeys?.hostsign === 'C_Sign',
    pkcs11_client_backed: success?.usersign === 'C_Sign',
    token_module: 'softhsmv3 (WASM, embedded — real OpenSSH)',
    wire_packets: [],
    error: connection_ok ? undefined : 'real handshake did not reach USERAUTH_SUCCESS',
  }
  result.wire_packets = connection_ok ? buildWirePackets(result) : []
  return result
}

// Real classical baseline the binary can run (curve25519 KEX + ECDSA P-256 host
// key, both on the token). Used for the real-vs-real comparison.
export const REAL_CLASSICAL = { kex: 'curve25519-sha256', hostalg: 'ecdsa-sha2-nistp256' }
// Real PQC profile (wire names the shim expects).
export const REAL_PQC = { kex: 'mlkem768x25519-sha256', hostalg: 'ssh-mldsa-65' }

export interface SshConfigArtifacts {
  sshdConfig: string
  sshConfig: string
  authorizedKeys: string
}

// Host-key file basename per algorithm (matches OpenSSH conventions).
const HOSTKEY_FILE: Record<string, string> = {
  'ssh-mldsa-44': 'ssh_host_mldsa44_key',
  'ssh-mldsa-65': 'ssh_host_mldsa65_key',
  'ssh-mldsa-87': 'ssh_host_mldsa87_key',
  'ecdsa-sha2-nistp256': 'ssh_host_ecdsa_key',
}

/**
 * Build the sshd_config / ssh_config / authorized_keys that correspond to a real
 * run. The shim hardcodes the proposal rather than parsing a config file, so
 * these are an *accurate representation* of what the handshake negotiated (KEX,
 * host-key and pubkey-auth algorithms) — useful for "how would I configure this"
 * — not a file the binary read. The panel labels them as such.
 */
export function buildSshConfigArtifacts(
  r: import('./openssh').SshHandshakeResult
): SshConfigArtifacts {
  const kex = r.kex_algorithm
  const alg = r.host_key_algorithm
  const hostFile = HOSTKEY_FILE[alg] ?? 'ssh_host_key'
  const sshdConfig = [
    '# sshd_config — server (key material lives in the PKCS#11 token)',
    `KexAlgorithms ${kex}`,
    `HostKey /etc/ssh/${hostFile}`,
    `HostKeyAlgorithms ${alg}`,
    `PubkeyAcceptedAlgorithms ${alg}`,
    'PubkeyAuthentication yes',
    'PasswordAuthentication no',
    '# Host key fetched + signed via the PKCS#11 provider (C_Sign); never exported.',
    'PKCS11Provider /usr/lib/softhsm/libsofthsmv3.so',
  ].join('\n')
  const sshConfig = [
    '# ssh_config — client',
    'Host pqc-demo',
    `  KexAlgorithms ${kex}`,
    `  HostKeyAlgorithms ${alg}`,
    `  PubkeyAcceptedAlgorithms ${alg}`,
    '  PKCS11Provider /usr/lib/softhsm/libsofthsmv3.so',
  ].join('\n')
  const authorizedKeys = `${alg} AAAA…<${r.client_pubkey_bytes}-byte ${alg} public key>… pqcuser@pqc.today`
  return { sshdConfig, sshConfig, authorizedKeys }
}

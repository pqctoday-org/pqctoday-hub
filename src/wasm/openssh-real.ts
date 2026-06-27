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

      worker.postMessage({ type: 'RUN' })
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

// The one combo the shim currently runs for real (hardcoded in drive_kex until
// M2a parameterizes it). The model's KEX id `mlkem768-curve25519-sha256` is the
// same algorithm as OpenSSH's wire name `mlkem768x25519-sha256`.
export const REAL_KEX_ID = 'mlkem768-curve25519-sha256'
export const REAL_HOSTKEY_ID = 'ssh-mldsa-65'

/** True when the chosen PQC combo is the one the real binary actually runs. */
export function isRealCombo(kex: string, hostKey: string): boolean {
  return kex === REAL_KEX_ID && hostKey === REAL_HOSTKEY_ID
}

// ML-DSA-65 fixed sizes (FIPS 204): public key 1952 B, raw signature 3309 B.
const MLDSA65_PK = 1952
// mlkem768x25519 KEX shares: client = ML-KEM-768 pk (1184) + X25519 (32); server
// = ML-KEM-768 ct (1088) + X25519 (32).
const MLKEM768X25519_CLIENT_SHARE = 1184 + 32
const MLKEM768X25519_SERVER_SHARE = 1088 + 32

/**
 * Map the real handshake event stream onto the existing `SshHandshakeResult`
 * shape so the comparison/telemetry UI can render a genuine PQC run alongside
 * the modelled classical baseline. Sizes come from the binary's own events
 * (signature lengths) plus the fixed ML-KEM/ML-DSA constants; `auth_ms` is the
 * measured wall-clock for the whole run. Per-phase timings aren't emitted by the
 * shim, so they're left at 0 (shown as "—" intent).
 */
export function mapRealEventsToResult(
  events: SshRealEvent[],
  rv: number,
  wallMs: number
): import('./openssh').SshHandshakeResult {
  const hostSign = parseEvent<{ sig_len: number }>(events, 'host_key_sign')
  const userSign = parseEvent<{ user_sig_len: number }>(events, 'user_key_sign')
  const newkeys = parseEvent<{ hostsign: string }>(events, 'newkeys')
  const success = parseEvent<{ usersign: string }>(events, 'userauth_success')
  const connection_ok = rv === 0 && success != null && newkeys != null

  return {
    connection_ok,
    quantum_safe: true,
    host_key_algorithm: 'ssh-mldsa-65',
    client_auth_algorithm: 'ssh-mldsa-65',
    kex_algorithm: 'mlkem768x25519-sha256',
    host_pubkey_bytes: MLDSA65_PK,
    client_pubkey_bytes: MLDSA65_PK,
    kex_share_bytes: MLKEM768X25519_CLIENT_SHARE,
    kex_reply_share_bytes: MLKEM768X25519_SERVER_SHARE,
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
}

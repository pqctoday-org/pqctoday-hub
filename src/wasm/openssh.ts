// SPDX-License-Identifier: GPL-3.0-only
//
// openssh.ts — Engine wrapper for the openssh-pkcs11 WASM build (pqctoday-hsm/openssh-pkcs11).
//
// Architecture mirrors strongswan/bridge.ts:
//   - Two Web Workers (client + server), each loading their own .wasm
//   - Two SharedArrayBuffers (c2s + s2c) carry the raw SSH byte stream
//   - A third SAB carries handshake events (JSON lines) from sshd → JS
//   - JS pre-seeds softhsmv3 keys (via pqc.ts) then passes token handles
//     to both workers via init messages

export interface SshHandshakeEvent {
  type:
    | 'start'
    | 'pkcs11_ready'
    | 'pkcs11_structured'
    | 'kexinit'
    | 'kex_ecdh_init'
    | 'kex_ecdh_reply'
    | 'newkeys'
    | 'userauth_request'
    | 'userauth_success'
    | 'done'
    | 'error'
  payload: string
}

export interface SshHandshakeResult {
  connection_ok: boolean
  quantum_safe: boolean
  host_key_algorithm: string
  client_auth_algorithm: string
  kex_algorithm: string
  host_pubkey_bytes: number
  client_pubkey_bytes: number
  host_sig_bytes: number
  client_sig_bytes: number
  auth_ms: number
  pkcs11_host_backed: boolean
  pkcs11_client_backed: boolean
  token_module: string
  wire_packets: SshWirePacket[]
  error?: string
}

export interface SshWirePacket {
  direction: 'c2s' | 's2c'
  msg_type: number
  msg_name: string
  length: number
  hex_preview: string
}

export type SshEngineState = 'UNINITIALIZED' | 'LOADING' | 'READY' | 'RUNNING' | 'DONE' | 'ERROR'

export type SshAlgoMode = 'classical' | 'pqc'

const SAB_SIZE = 65536 // 64 KB ring per direction

export class SshEngine {
  private clientWorker: Worker | null = null
  private serverWorker: Worker | null = null
  private c2sSab: SharedArrayBuffer | null = null
  private s2cSab: SharedArrayBuffer | null = null

  private state: SshEngineState = 'UNINITIALIZED'
  private stateListeners = new Set<(s: SshEngineState) => void>()
  private eventListeners = new Set<(e: SshHandshakeEvent) => void>()
  private _epoch = 0

  public addStateListener(fn: (s: SshEngineState) => void) {
    this.stateListeners.add(fn)
    fn(this.state)
  }
  public removeStateListener(fn: (s: SshEngineState) => void) {
    this.stateListeners.delete(fn)
  }
  public addEventListener(fn: (e: SshHandshakeEvent) => void) {
    this.eventListeners.add(fn)
  }
  public removeEventListener(fn: (e: SshHandshakeEvent) => void) {
    this.eventListeners.delete(fn)
  }

  private setState(s: SshEngineState) {
    this.state = s
    this.stateListeners.forEach((fn) => fn(s))
  }
  private emitEvent(e: SshHandshakeEvent) {
    this.eventListeners.forEach((fn) => fn(e))
  }

  public async runHandshake(mode: SshAlgoMode): Promise<SshHandshakeResult> {
    this.terminate()
    this._epoch++
    const epoch = this._epoch
    this.setState('LOADING')

    this.c2sSab = new SharedArrayBuffer(SAB_SIZE)
    this.s2cSab = new SharedArrayBuffer(SAB_SIZE)

    const startMs = performance.now()

    return new Promise<SshHandshakeResult>((resolve, reject) => {
      const serverWorker = new Worker(`/wasm/openssh_server_worker.js?v=${Date.now()}`)
      const clientWorker = new Worker(`/wasm/openssh_client_worker.js?v=${Date.now()}`)
      this.serverWorker = serverWorker
      this.clientWorker = clientWorker

      let serverReady = false
      let clientReady = false

      const tryStart = () => {
        if (!serverReady || !clientReady) return
        this.setState('RUNNING')
        const startMsg = { type: 'START', mode }
        serverWorker.postMessage(startMsg)
        clientWorker.postMessage(startMsg)
      }

      serverWorker.onmessage = (e) => {
        if (epoch !== this._epoch) return
        const { type, payload } = e.data as { type: string; payload: unknown }
        if (type === 'READY') {
          serverReady = true
          tryStart()
          return
        }
        if (type === 'EVENT') {
          const ev = payload as SshHandshakeEvent
          this.emitEvent(ev)
          if (ev.type === 'done' || ev.type === 'error') {
            const authMs = performance.now() - startMs
            const result = this._parseResult(ev.payload, mode, authMs)
            if (ev.type === 'error') {
              this.setState('ERROR')
              reject(new Error(ev.payload))
            } else {
              this.setState('DONE')
              resolve(result)
            }
          }
        }
      }

      clientWorker.onmessage = (e) => {
        if (epoch !== this._epoch) return
        const { type } = e.data as { type: string }
        if (type === 'READY') {
          clientReady = true
          tryStart()
        }
      }

      serverWorker.onerror = (err) => {
        if (epoch !== this._epoch) return
        this.setState('ERROR')
        reject(new Error(`sshd worker error: ${err.message}`))
      }
      clientWorker.onerror = (err) => {
        if (epoch !== this._epoch) return
        this.setState('ERROR')
        reject(new Error(`ssh worker error: ${err.message}`))
      }

      // Send SABs + config to both workers
      const initMsg = {
        type: 'INIT',
        c2sSab: this.c2sSab,
        s2cSab: this.s2cSab,
        mode,
      }
      serverWorker.postMessage(initMsg)
      clientWorker.postMessage(initMsg)
    })
  }

  private _parseResult(payload: string, mode: SshAlgoMode, authMs: number): SshHandshakeResult {
    try {
      const parsed = JSON.parse(payload) as Partial<SshHandshakeResult>
      return {
        connection_ok: parsed.connection_ok ?? false,
        quantum_safe: parsed.quantum_safe ?? mode === 'pqc',
        host_key_algorithm:
          parsed.host_key_algorithm ?? (mode === 'pqc' ? 'ssh-mldsa-65' : 'ssh-ed25519'),
        client_auth_algorithm:
          parsed.client_auth_algorithm ?? (mode === 'pqc' ? 'ssh-mldsa-65' : 'ssh-ed25519'),
        kex_algorithm:
          parsed.kex_algorithm ?? (mode === 'pqc' ? 'mlkem768x25519-sha256' : 'curve25519-sha256'),
        host_pubkey_bytes: parsed.host_pubkey_bytes ?? (mode === 'pqc' ? 1952 : 32),
        client_pubkey_bytes: parsed.client_pubkey_bytes ?? (mode === 'pqc' ? 1952 : 32),
        host_sig_bytes: parsed.host_sig_bytes ?? (mode === 'pqc' ? 3309 : 64),
        client_sig_bytes: parsed.client_sig_bytes ?? (mode === 'pqc' ? 3309 : 64),
        auth_ms: parsed.auth_ms ?? authMs,
        pkcs11_host_backed: parsed.pkcs11_host_backed ?? false,
        pkcs11_client_backed: parsed.pkcs11_client_backed ?? false,
        token_module: parsed.token_module ?? 'softhsmv3 (WASM)',
        wire_packets: parsed.wire_packets ?? [],
        error: parsed.error,
      }
    } catch {
      return {
        connection_ok: false,
        quantum_safe: mode === 'pqc',
        host_key_algorithm: '',
        client_auth_algorithm: '',
        kex_algorithm: '',
        host_pubkey_bytes: 0,
        client_pubkey_bytes: 0,
        host_sig_bytes: 0,
        client_sig_bytes: 0,
        auth_ms: authMs,
        pkcs11_host_backed: false,
        pkcs11_client_backed: false,
        token_module: '',
        wire_packets: [],
        error: `Failed to parse result: ${payload}`,
      }
    }
  }

  public terminate() {
    this._epoch++
    this.clientWorker?.terminate()
    this.serverWorker?.terminate()
    this.clientWorker = null
    this.serverWorker = null
    this.c2sSab = null
    this.s2cSab = null
    if (this.state === 'RUNNING' || this.state === 'LOADING') {
      this.setState('UNINITIALIZED')
    }
  }
}

export const sshEngine = new SshEngine()

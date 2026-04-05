// SPDX-License-Identifier: GPL-3.0-only

export interface StrongSwanLog {
  level: 'info' | 'error'
  text: string
}

export type StrongSwanState = 'UNINITIALIZED' | 'LOADING' | 'READY' | 'RUNNING' | 'ERROR'

export interface Pkcs11RpcCallback {
  (sab: SharedArrayBuffer, role: 'initiator' | 'responder'): void
}

const RESPONDER_IP_U32 = 0xc0a80002 // 192.168.0.2

export class StrongSwanEngine {
  private initWorker: Worker | null = null // 192.168.0.1
  private respWorker: Worker | null = null // 192.168.0.2

  private initPkcs11Sab: SharedArrayBuffer | null = null
  private respPkcs11Sab: SharedArrayBuffer | null = null

  private initNetSab: SharedArrayBuffer | null = null
  private respNetSab: SharedArrayBuffer | null = null

  public packetCount = 0

  private rpcHandler: Pkcs11RpcCallback | null = null
  private logListeners = new Set<(log: StrongSwanLog) => void>()
  private stateListeners = new Set<(state: StrongSwanState) => void>()
  private state: StrongSwanState = 'UNINITIALIZED'
  private _readyCount = 0
  private _keysReadyCount = 0
  private _epoch = 0 // Guards against late messages from terminated workers
  private _keySpec: { algType: number; slot0Size: number; slot1Size: number } = {
    algType: 1,
    slot0Size: 3072,
    slot1Size: 3072,
  }

  constructor() {}

  public setRpcHandler(handler: Pkcs11RpcCallback) {
    this.rpcHandler = handler
  }

  public addLogListener(fn: (log: StrongSwanLog) => void) {
    this.logListeners.add(fn)
  }

  public removeLogListener(fn: (log: StrongSwanLog) => void) {
    this.logListeners.delete(fn)
  }

  public addStateListener(fn: (state: StrongSwanState) => void) {
    this.stateListeners.add(fn)
    // Immediately emit current state to new listener
    fn(this.state)
  }

  public removeStateListener(fn: (state: StrongSwanState) => void) {
    this.stateListeners.delete(fn)
  }

  private setState(s: StrongSwanState) {
    this.state = s
    this.stateListeners.forEach((fn) => fn(s))
  }

  public dispatchLog(log: StrongSwanLog) {
    this.logListeners.forEach((fn) => fn(log))
  }

  private _spawnWorker(
    configs: Record<string, string>,
    pkcs11Sab: SharedArrayBuffer,
    netSab: SharedArrayBuffer,
    role: 'initiator' | 'responder'
  ): Worker {
    const worker = new Worker(`/wasm/strongswan_worker.js?v=${Date.now()}`)
    const spawnEpoch = this._epoch // Capture epoch at spawn time

    worker.onmessage = (e) => {
      // Drop messages from workers belonging to a previous session
      if (spawnEpoch !== this._epoch) return
      const { type, payload } = e.data
      switch (type) {
        case 'LOG':
          this.dispatchLog(payload as StrongSwanLog)
          break
        case 'PKCS11_RPC':
          if (this.rpcHandler) {
            this.rpcHandler(pkcs11Sab, role)
          } else {
            this.dispatchLog({
              level: 'error',
              text: '[RPC] Received PKCS11_RPC but no handler is configured!',
            })
          }
          break
        case 'READY':
          this._readyCount++
          if (this._readyCount === 2) {
            // Both workers loaded WASM. Generate keys, then start daemons.
            const keySpec = this._keySpec
            const algName = keySpec.algType === 1 ? 'RSA' : 'ML-DSA'
            this.dispatchLog({
              level: 'info',
              text: `[BRIDGE] Both workers ready. Generating keys (${algName}-${keySpec.slot0Size}/${keySpec.slot1Size})...`,
            })
            this.initWorker?.postMessage({ type: 'GEN_KEYS', payload: keySpec })
            this.respWorker?.postMessage({ type: 'GEN_KEYS', payload: keySpec })
          }
          break
        case 'KEYS_READY':
          this._keysReadyCount = (this._keysReadyCount || 0) + 1
          this.dispatchLog({
            level: 'info',
            text: `[BRIDGE] ${role} keys ready (${this._keysReadyCount}/2)`,
          })
          if (this._keysReadyCount === 2) {
            this.dispatchLog({ level: 'info', text: '[BRIDGE] Starting charon daemons...' })
            this.initWorker?.postMessage({ type: 'START' })
            this.respWorker?.postMessage({ type: 'START' })
            this.setState('RUNNING')
          }
          break
        case 'ERROR':
          this.setState('ERROR')
          this.dispatchLog({ level: 'error', text: payload })
          break
        case 'PACKET_OUT': {
          const { srcIp, srcPort, destIp, data } = payload
          const destIsResponder = destIp >>> 0 === RESPONDER_IP_U32
          const targetSab = destIsResponder ? this.respNetSab : this.initNetSab
          const target = destIsResponder ? 'responder' : 'initiator'
          const destIpStr = `${(destIp >>> 24) & 0xff}.${(destIp >> 16) & 0xff}.${(destIp >> 8) & 0xff}.${destIp & 0xff}`
          if (!targetSab) {
            this.dispatchLog({
              level: 'error',
              text: `[ROUTE] PACKET_OUT → ${destIpStr} but ${target} SAB is null — dropping`,
            })
            break
          }

          const i32 = new Int32Array(targetSab, 0, 4)
          const bytes = new Uint8Array(targetSab)
          const pkt = new Uint8Array(data)

          i32[1] = pkt.length
          i32[2] = srcIp
          i32[3] = srcPort
          bytes.set(pkt, 16)
          Atomics.store(i32, 0, 1) // PACKET_READY
          Atomics.notify(i32, 0, 1) // wake blocked poll/recvfrom
          this.packetCount++
          this.dispatchLog({
            level: 'info',
            text: `[ROUTE] pkt #${this.packetCount} → ${target} (${destIpStr}) len=${pkt.length}`,
          })
          break
        }
      }
    }

    worker.postMessage({ type: 'INIT', payload: { configs, sab: pkcs11Sab, netSab, role } })
    return worker
  }

  public setKeySpec(algType: number, slot0Size: number, slot1Size: number) {
    this._keySpec = { algType, slot0Size, slot1Size }
  }

  public init(initConfigs: Record<string, string>, respConfigs: Record<string, string>) {
    if (this.initWorker) return

    this._epoch++
    this.setState('LOADING')
    this._readyCount = 0
    this._keysReadyCount = 0
    this.packetCount = 0

    this.initPkcs11Sab = new SharedArrayBuffer(65536)
    this.respPkcs11Sab = new SharedArrayBuffer(65536)
    this.initNetSab = new SharedArrayBuffer(65536)
    this.respNetSab = new SharedArrayBuffer(65536)

    this.initWorker = this._spawnWorker(
      initConfigs,
      this.initPkcs11Sab,
      this.initNetSab,
      'initiator'
    )
    this.respWorker = this._spawnWorker(
      respConfigs,
      this.respPkcs11Sab,
      this.respNetSab,
      'responder'
    )
  }

  public destroy() {
    if (this.initWorker) {
      this.initWorker.terminate()
      this.initWorker = null
    }
    if (this.respWorker) {
      this.respWorker.terminate()
      this.respWorker = null
    }
    this.initPkcs11Sab = null
    this.respPkcs11Sab = null
    this.initNetSab = null
    this.respNetSab = null
    this.setState('UNINITIALIZED')
  }
}

export const strongSwanEngine = new StrongSwanEngine()

// SPDX-License-Identifier: GPL-3.0-only

export interface StrongSwanLog {
  level: 'info' | 'error'
  text: string
}

export type StrongSwanState = 'UNINITIALIZED' | 'LOADING' | 'READY' | 'RUNNING' | 'ERROR'

export interface Pkcs11RpcCallback {
  (sab: SharedArrayBuffer, role: 'initiator' | 'responder'): void
}

export interface Pkcs11TraceEvent {
  role: 'initiator' | 'responder'
  op: string
  sess: number
  mech: number
  inA: number
  inB: number
  rv: number
  outA: number
  outB: number
}

// 192.168.0.2 in NETWORK-byte-order LE u32 form: bytes [LSB..MSB] = 0xC0,
// 0xA8, 0x00, 0x02. Matches what the C-side passes via wasm_net_send (memcpy
// from sin_addr.s_addr, which is network order per POSIX). The destIp comparison
// + destIpStr formatting below both use this convention.
const RESPONDER_IP_U32 = 0x0200a8c0 // 192.168.0.2 (network-LE)

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
  private pkcs11TraceListeners = new Set<(ev: Pkcs11TraceEvent) => void>()
  private panelPkcs11ReqId = 0
  private panelPkcs11Pending = new Map<
    number,
    {
      resolve: (r: { rv: number; data: Record<string, unknown> }) => void
      reject: (e: Error) => void
    }
  >()
  private state: StrongSwanState = 'UNINITIALIZED'
  private _readyCount = 0
  private _keysReadyCount = 0
  private _epoch = 0 // Guards against late messages from terminated workers
  private _phase: 'full' | 'spawn-only' = 'full'
  private _authMode: 'psk' | 'dual' = 'psk'
  private _keysReadyResolve: (() => void) | null = null
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

  public addPkcs11TraceListener(fn: (ev: Pkcs11TraceEvent) => void) {
    this.pkcs11TraceListeners.add(fn)
  }

  public removePkcs11TraceListener(fn: (ev: Pkcs11TraceEvent) => void) {
    this.pkcs11TraceListeners.delete(fn)
  }

  /**
   * Drive a PKCS#11 op against the specified worker's softhsmv3 instance.
   * Used by VPN cert provisioning so ML-DSA keys + cert signing happen in
   * the worker's IN-PROCESS softhsm — where charon's strongswan-pkcs11 plugin
   * actually looks at IKE_AUTH time (the panel softhsm is unreachable to charon
   * because pkcs11_wasm_rpc_function_list is currently a stub).
   */
  public pkcs11(
    role: 'initiator' | 'responder',
    op: string,
    args: Record<string, unknown> = {}
  ): Promise<{ rv: number; data: Record<string, unknown> }> {
    const worker = role === 'initiator' ? this.initWorker : this.respWorker
    if (!worker) {
      return Promise.reject(new Error(`pkcs11(${op}): ${role} worker not initialized`))
    }
    const reqId = ++this.panelPkcs11ReqId
    return new Promise((resolve, reject) => {
      this.panelPkcs11Pending.set(reqId, { resolve, reject })
      worker.postMessage({ type: 'PANEL_PKCS11', payload: { reqId, op, args } })
      // Safety timeout — softhsm ops in WASM should complete in < 1s; ML-DSA
      // keygen may take a few seconds. Fail loudly if no reply in 30s.
      setTimeout(() => {
        if (this.panelPkcs11Pending.has(reqId)) {
          this.panelPkcs11Pending.delete(reqId)
          reject(new Error(`pkcs11(${op}) timeout after 30s`))
        }
      }, 30000)
    })
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
    role: 'initiator' | 'responder',
    psk: string,
    rpcMode: boolean,
    proposalMode: number,
    authMode: 'psk' | 'dual',
    localKeyId?: string,
    remoteKeyId?: string
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
        case 'PKCS11_LOG': {
          // Option-B trace tap: charon.wasm executes the call locally
          // (statically-linked softhsmv3); the C-side shim posts these
          // observation events. Format human-readable per op.
          const p = payload as {
            op: string
            sess: number
            mech: number
            inA: number
            inB: number
            rv: number
            outA: number
            outB: number
          }
          const tag = role === 'initiator' ? 'INIT' : 'RESP'
          const rvHex = `0x${p.rv.toString(16).toUpperCase().padStart(2, '0')}`
          const rvName = p.rv === 0 ? 'CKR_OK' : rvHex
          const sessStr = p.sess ? `sess=${p.sess}` : ''
          const mechMap: Record<number, string> = {
            0x00000000: 'CKM_RSA_PKCS_KEY_PAIR_GEN',
            0x00000001: 'CKM_RSA_PKCS',
            0x00000006: 'CKM_SHA1_RSA_PKCS',
            0x00000040: 'CKM_SHA256_RSA_PKCS',
            0x00000041: 'CKM_SHA384_RSA_PKCS',
            0x00000042: 'CKM_SHA512_RSA_PKCS',
            0x00000220: 'CKM_SHA_1',
            0x00000250: 'CKM_SHA256',
            0x00000260: 'CKM_SHA384',
            0x00000270: 'CKM_SHA512',
            0x000002f0: 'CKM_HMAC_SHA1',
            0x000002f1: 'CKM_HMAC_SHA224',
            0x000002f2: 'CKM_HMAC_SHA256',
            0x000002f3: 'CKM_HMAC_SHA384',
            0x000002f4: 'CKM_HMAC_SHA512',
            0x00000300: 'CKM_GENERIC_SECRET_KEY_GEN',
            0x00001080: 'CKM_AES_KEY_GEN',
            0x00001082: 'CKM_AES_CBC',
            0x00001087: 'CKM_AES_CTR',
            0x00001088: 'CKM_AES_GCM',
            // softhsmv3 vendor codes (verified against
            // pqctoday-hsm/strongswan-pkcs11/pkcs11.h):
            0x0000000f: 'CKM_ML_KEM_KEY_PAIR_GEN',
            0x00000017: 'CKM_ML_KEM',
            0x0000001c: 'CKM_ML_DSA_KEY_PAIR_GEN',
            0x0000001d: 'CKM_ML_DSA',
          }
          const mechStr = p.mech
            ? `mech=${mechMap[p.mech] || `0x${p.mech.toString(16).toUpperCase()}`}`
            : ''
          let detail = ''
          switch (p.op) {
            case 'C_GenerateKeyPair':
              detail = `${sessStr} ${mechStr} pubAttrs=${p.inA} priAttrs=${p.inB} → ${rvName}, hPub=${p.outA} hPri=${p.outB}`
              break
            case 'C_GenerateKey':
              detail = `${sessStr} ${mechStr} attrs=${p.inA} → ${rvName}, hKey=${p.outA}`
              break
            case 'C_SignInit':
            case 'C_VerifyInit':
            case 'C_EncryptInit':
            case 'C_DecryptInit':
              detail = `${sessStr} ${mechStr} hKey=${p.inA} → ${rvName}`
              break
            case 'C_Sign':
              detail = `${sessStr} dataLen=${p.inA} → ${rvName}, sigLen=${p.outA}`
              break
            case 'C_Verify':
              detail = `${sessStr} dataLen=${p.inA} sigLen=${p.inB} → ${rvName}`
              break
            case 'C_DigestInit':
              detail = `${sessStr} ${mechStr} → ${rvName}`
              break
            case 'C_Digest':
              detail = `${sessStr} dataLen=${p.inA} → ${rvName}, digestLen=${p.outA}`
              break
            case 'C_DeriveKey':
              detail = `${sessStr} ${mechStr} hBaseKey=${p.inA} attrs=${p.inB} → ${rvName}, hKey=${p.outA}`
              break
            case 'C_Encrypt':
              detail = `${sessStr} dataLen=${p.inA} → ${rvName}, encLen=${p.outA}`
              break
            case 'C_Decrypt':
              detail = `${sessStr} encLen=${p.inA} → ${rvName}, dataLen=${p.outA}`
              break
            case 'C_GenerateRandom':
              detail = `${sessStr} len=${p.inA} → ${rvName}`
              break
            case 'C_EncapsulateKey':
            case 'C_EncapsulateKey(size)':
              detail = `${sessStr} ${mechStr} hPub=${p.inA} → ${rvName}, ct_len=${p.outA}${p.outB ? ` hSecret=${p.outB}` : ''}`
              break
            case 'C_DecapsulateKey':
              detail = `${sessStr} ${mechStr} hPri=${p.inA} ct_len=${p.inB} → ${rvName}, hSecret=${p.outA}`
              break
            default:
              detail = `${sessStr} ${mechStr} a=${p.inA} b=${p.inB} → ${rvName}, oa=${p.outA} ob=${p.outB}`
          }
          this.dispatchLog({
            level: p.rv === 0 ? 'info' : 'error',
            text: `[PKCS#11 ${tag}] ${p.op}  ${detail}`,
          })
          this.pkcs11TraceListeners.forEach((fn) =>
            fn({
              role,
              op: p.op,
              sess: p.sess >>> 0,
              mech: p.mech >>> 0,
              inA: p.inA,
              inB: p.inB,
              rv: p.rv,
              outA: p.outA,
              outB: p.outB,
            })
          )
          break
        }
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
            if (this._phase === 'full') {
              this.dispatchLog({ level: 'info', text: '[BRIDGE] Starting charon daemons...' })
              this.initWorker?.postMessage({ type: 'START' })
              this.respWorker?.postMessage({ type: 'START' })
              this.setState('RUNNING')
            } else {
              this.dispatchLog({
                level: 'info',
                text: '[BRIDGE] Workers ready (spawn-only). Awaiting panel provisioning before START.',
              })
              this.setState('READY')
              if (this._keysReadyResolve) {
                this._keysReadyResolve()
                this._keysReadyResolve = null
              }
            }
          }
          break
        case 'ERROR':
          this.setState('ERROR')
          this.dispatchLog({ level: 'error', text: payload })
          break
        case 'PANEL_PKCS11_RESULT': {
          const { reqId, rv, data } = e.data.payload as {
            reqId: number
            rv: number
            data: Record<string, unknown>
          }
          const pending = this.panelPkcs11Pending.get(reqId)
          if (pending) {
            this.panelPkcs11Pending.delete(reqId)
            pending.resolve({ rv, data: data || {} })
          }
          break
        }
        case 'PACKET_OUT': {
          const { srcIp, srcPort, destIp, data } = payload
          const destIsResponder = destIp >>> 0 === RESPONDER_IP_U32
          const targetSab = destIsResponder ? this.respNetSab : this.initNetSab
          const target = destIsResponder ? 'responder' : 'initiator'
          // destIp is network-byte-order LE u32: byte 0 (LSB) is the first
          // octet (e.g. 192 in 192.168.0.2). Format LSB→MSB.
          const destIpStr = `${destIp & 0xff}.${(destIp >>> 8) & 0xff}.${(destIp >>> 16) & 0xff}.${(destIp >>> 24) & 0xff}`
          if (!targetSab) {
            this.dispatchLog({
              level: 'error',
              text: `[ROUTE] PACKET_OUT → ${destIpStr} but ${target} SAB is null — dropping`,
            })
            break
          }

          const i32 = new Int32Array(targetSab, 0, 6)
          const bytes = new Uint8Array(targetSab)
          const pkt = new Uint8Array(data)

          i32[1] = pkt.length
          i32[2] = srcIp
          i32[3] = srcPort
          i32[4] = destIp
          i32[5] = payload.destPort || 500
          bytes.set(pkt, 24)
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

    worker.postMessage({
      type: 'INIT',
      payload: {
        configs,
        sab: pkcs11Sab,
        netSab,
        role,
        psk,
        rpcMode,
        proposalMode,
        auth: authMode,
        localKeyId,
        remoteKeyId,
      },
    })
    return worker
  }

  public setKeySpec(algType: number, slot0Size: number, slot1Size: number) {
    this._keySpec = { algType, slot0Size, slot1Size }
  }

  public init(
    initConfigs: Record<string, string>,
    respConfigs: Record<string, string>,
    pskOpts?: { initPsk: string; respPsk: string },
    rpcMode?: boolean,
    proposalMode?: number,
    options?: {
      phase?: 'full' | 'spawn-only'
      authMode?: 'psk' | 'dual'
      keyIds?: { initKeyId: string; respKeyId: string }
    }
  ): Promise<void> {
    if (this.initWorker) return Promise.resolve()

    this._epoch++
    this._phase = options?.phase ?? 'full'
    this.setState('LOADING')
    this._readyCount = 0
    this._keysReadyCount = 0
    this.packetCount = 0

    const initPsk = pskOpts?.initPsk ?? 'pqc-wasm-demo-key-2026'
    const respPsk = pskOpts?.respPsk ?? 'pqc-wasm-demo-key-2026'

    this.initPkcs11Sab = new SharedArrayBuffer(65536)
    this.respPkcs11Sab = new SharedArrayBuffer(65536)
    this.initNetSab = new SharedArrayBuffer(65536)
    this.respNetSab = new SharedArrayBuffer(65536)

    const useRpcMode = rpcMode ?? false
    const usePropMode = proposalMode ?? 0
    this._authMode = options?.authMode ?? 'psk'

    const readyPromise =
      this._phase === 'spawn-only'
        ? new Promise<void>((resolve) => {
            this._keysReadyResolve = resolve
          })
        : Promise.resolve()

    const initKeyId = options?.keyIds?.initKeyId
    const respKeyId = options?.keyIds?.respKeyId

    this.initWorker = this._spawnWorker(
      initConfigs,
      this.initPkcs11Sab,
      this.initNetSab,
      'initiator',
      initPsk,
      useRpcMode,
      usePropMode,
      this._authMode,
      initKeyId, // local for initiator
      respKeyId // remote for initiator
    )
    this.respWorker = this._spawnWorker(
      respConfigs,
      this.respPkcs11Sab,
      this.respNetSab,
      'responder',
      respPsk,
      useRpcMode,
      usePropMode,
      this._authMode,
      respKeyId, // local for responder
      initKeyId // remote for responder
    )
    return readyPromise
  }

  /**
   * Post START to both workers — used after spawn-only init + panel-driven
   * provisioning to actually run charon.
   * keyIds: required for ML-DSA dual auth so wasm_setup_config builds
   * ID_KEY_ID identities (env vars WASM_LOCAL_KEYID/REMOTE_KEYID).
   */
  public start(keyIds?: { initKeyId: string; respKeyId: string }) {
    if (!this.initWorker || !this.respWorker) {
      this.dispatchLog({ level: 'error', text: '[BRIDGE] start() called before init()' })
      return
    }
    if (this.state === 'RUNNING') return
    this.dispatchLog({ level: 'info', text: '[BRIDGE] Starting charon daemons (deferred)...' })
    this.initWorker.postMessage({
      type: 'START',
      payload: keyIds ? { localKeyId: keyIds.initKeyId, remoteKeyId: keyIds.respKeyId } : undefined,
    })
    this.respWorker.postMessage({
      type: 'START',
      payload: keyIds ? { localKeyId: keyIds.respKeyId, remoteKeyId: keyIds.initKeyId } : undefined,
    })
    this.setState('RUNNING')
  }

  /**
   * Write files into a worker's WASM filesystem post-INIT. Used by the
   * worker-driven cert provisioning flow to land cert PEMs at
   * /etc/ipsec.d/certs/<role>.crt before charon starts.
   */
  public writeFiles(role: 'initiator' | 'responder', files: Record<string, string>) {
    const worker = role === 'initiator' ? this.initWorker : this.respWorker
    if (!worker) {
      this.dispatchLog({
        level: 'error',
        text: `[BRIDGE] writeFiles(${role}): worker not initialized`,
      })
      return
    }
    worker.postMessage({ type: 'WRITE_FILES', payload: { files } })
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

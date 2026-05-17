// SPDX-License-Identifier: GPL-3.0-only
/**
 * CMSSigningService — TypeScript wrapper around the CMS Web Worker.
 *
 * Owns one Worker instance, dispatches request-id-tagged postMessage
 * commands, and resolves promises when matching response events arrive.
 *
 * Today this drives software-key flows (`openssl genpkey -algorithm
 * ML-DSA-65` → `req -x509` → `cms -sign / -verify`). Phase 3 will swap
 * the keys for `pkcs11:` URIs once the openssl.wasm rebuild lands the
 * `pqctoday_cms_init` symbol — the service surface here doesn't need
 * to change for that transition.
 *
 * Mirrors HybridSignatureHsmService.ts in shape (one class per workshop
 * module, instance owned by the React component that mounts it).
 */

export type CmsAlg =
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
  // LAMPS draft-19 composite signature OIDs (require HSM mode — only
  // pkcs11-provider's composite.c implements these algorithms).
  | 'id-MLDSA44-RSA2048-PSS-SHA256'
  | 'id-MLDSA65-ECDSA-P256-SHA512'
  | 'id-MLDSA87-ECDSA-P384-SHA512'

/** Returns true for any LAMPS draft-19 composite OID. The UI uses this to
 *  force useHsm = true and disable the toggle (composite isn't in stock
 *  OpenSSL). */
export function isCompositeAlg(alg: CmsAlg): boolean {
  return alg.startsWith('id-MLDSA')
}

/** Returns true if the algorithm's keys cannot produce a signature
 *  (so the cert can't be self-signed; you need a CA). */
export function isKemOnlyAlg(alg: CmsAlg): boolean {
  return alg === 'ML-KEM-512' || alg === 'ML-KEM-768' || alg === 'ML-KEM-1024' || alg === 'X25519'
}

export type CmsCipher = 'aes-128-gcm' | 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305'

export type InitStatus = 'ok' | 'already' | 'provider_missing' | 'provider_error'

export interface InitResult {
  status: InitStatus
  code: number
  detail?: string
}

export interface GenKeyResult {
  keyPem: string
  pubPem: string
}

export interface MkCertResult {
  certPem: string
}

export interface SignResult {
  signedP7m: Uint8Array
}

export interface VerifyResult {
  ok: boolean
  payload?: Uint8Array
  stderrTail: string
}

export interface EncryptResult {
  enveloped: Uint8Array
}

export interface DecryptResult {
  ok: boolean
  payload?: Uint8Array
  stderrTail: string
}

export interface DualSignResult {
  signedP7m: Uint8Array
}

export interface DualVerifyResult {
  /** True iff every SignerInfo's signature math passed (`cms -verify -noverify`).
   *  Multi-SignerInfo CMS is all-or-nothing across signers in OpenSSL — true
   *  per-signer atomicity is a LAMPS draft-19 composite property, not a CMS
   *  property. See the WIP chip in the DualSignDemo. */
  ok: boolean
  /** How many SignerInfo entries the verifier processed. */
  signerCount: number
  /** Recovered payload bytes when ok=true. */
  payload?: Uint8Array
  /** Trailing stderr lines from `cms -verify` — diagnostic. */
  stderr: string
}

type WorkerOutbound =
  | { type: 'READY' }
  | { type: 'INIT_DONE'; status: InitStatus; code: number; detail?: string; requestId?: string }
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
      ok: boolean
      signerCount: number
      payload?: Uint8Array
      stderr: string
      requestId?: string
    }

/**
 * One service instance per workshop mount. Caller is responsible for
 * `dispose()` on unmount to terminate the underlying Worker.
 */
export class CMSSigningService {
  private worker: Worker
  private readyPromise: Promise<void>
  private logHandlers = new Set<(line: { stream: 'stdout' | 'stderr'; message: string }) => void>()
  private pending = new Map<
    string,
    { resolve: (v: unknown) => void; reject: (e: Error) => void; expect: WorkerOutbound['type'] }
  >()
  private idCounter = 0

  constructor() {
    this.worker = new Worker(new URL('../worker/cms.worker.ts', import.meta.url), {
      type: 'classic',
    })
    this.readyPromise = new Promise<void>((resolve) => {
      const handler = (e: MessageEvent<WorkerOutbound>) => {
        if (e.data.type === 'READY') {
          this.worker.removeEventListener('message', handler)
          resolve()
        }
      }
      this.worker.addEventListener('message', handler)
    })
    this.worker.addEventListener('message', this.handleMessage)
  }

  dispose(): void {
    this.worker.removeEventListener('message', this.handleMessage)
    this.worker.terminate()
    this.pending.clear()
    this.logHandlers.clear()
  }

  onLog(fn: (line: { stream: 'stdout' | 'stderr'; message: string }) => void): () => void {
    this.logHandlers.add(fn)
    return () => this.logHandlers.delete(fn)
  }

  async waitReady(): Promise<void> {
    return this.readyPromise
  }

  async initProvider(): Promise<InitResult> {
    await this.readyPromise
    return this.request('INIT_DONE', { type: 'LOAD_AND_INIT' }, (msg) => ({
      status: msg.status,
      code: msg.code,
      detail: msg.detail,
    }))
  }

  async genKey(alg: CmsAlg, keyId: string, useHsm = false): Promise<GenKeyResult> {
    await this.readyPromise
    return this.request('CMS_GENKEY_RESULT', { type: 'CMS_GENKEY', alg, keyId, useHsm }, (msg) => ({
      keyPem: msg.keyPem,
      pubPem: msg.pubPem,
    }))
  }

  async mkCert(opts: {
    keyId: string
    certId: string
    subject: string
    days?: number
    useHsm?: boolean
    /** Optional CA key. When set, the cert is signed by this key instead
     *  of being self-signed. Required for KEM-only subject keys (ML-KEM,
     *  X25519) that can't produce a self-signature. */
    issuerKeyId?: string
    /** Subject key algorithm. The worker uses this to route LAMPS
     *  composite OIDs through the dedicated composite mkcert shim. */
    alg?: CmsAlg
  }): Promise<MkCertResult> {
    await this.readyPromise
    return this.request('CMS_MKCERT_RESULT', { type: 'CMS_MKCERT', ...opts }, (msg) => ({
      certPem: msg.certPem,
    }))
  }

  async sign(opts: {
    keyId: string
    certId: string
    payload: Uint8Array
    useHsm?: boolean
    /** Algorithm of the signing key — needed for composite OID routing. */
    alg?: CmsAlg
  }): Promise<SignResult> {
    await this.readyPromise
    return this.request('CMS_SIGN_RESULT', { type: 'CMS_SIGN', ...opts }, (msg) => ({
      signedP7m: msg.signedP7m,
    }))
  }

  async verify(opts: {
    signedP7m: Uint8Array
    certId: string
    useHsm?: boolean
    /** Cert's signature algorithm — needed for composite OID routing.
     *  When omitted, the worker assumes a non-composite cert and uses
     *  `openssl cms -verify`. */
    alg?: CmsAlg
  }): Promise<VerifyResult> {
    await this.readyPromise
    return this.request('CMS_VERIFY_RESULT', { type: 'CMS_VERIFY', ...opts }, (msg) => ({
      ok: msg.ok,
      payload: msg.payload,
      stderrTail: msg.stderrTail,
    }))
  }

  async encrypt(opts: {
    recipientCertId: string
    payload: Uint8Array
    cipher?: CmsCipher
  }): Promise<EncryptResult> {
    await this.readyPromise
    return this.request('CMS_ENCRYPT_RESULT', { type: 'CMS_ENCRYPT', ...opts }, (msg) => ({
      enveloped: msg.enveloped,
    }))
  }

  async decrypt(opts: {
    enveloped: Uint8Array
    recipientCertId: string
    recipientKeyId: string
    useHsm?: boolean
  }): Promise<DecryptResult> {
    await this.readyPromise
    return this.request('CMS_DECRYPT_RESULT', { type: 'CMS_DECRYPT', ...opts }, (msg) => ({
      ok: msg.ok,
      payload: msg.payload,
      stderrTail: msg.stderrTail,
    }))
  }

  async dualSign(opts: {
    payload: Uint8Array
    pqKeyId: string
    pqCertId: string
    classicalKeyId: string
    classicalCertId: string
    useHsm?: boolean
  }): Promise<DualSignResult> {
    await this.readyPromise
    return this.request('CMS_DUAL_SIGN_RESULT', { type: 'CMS_DUAL_SIGN', ...opts }, (msg) => ({
      signedP7m: msg.signedP7m,
    }))
  }

  async dualVerify(opts: {
    signedP7m: Uint8Array
    pqCertId: string
    classicalCertId: string
    useHsm?: boolean
  }): Promise<DualVerifyResult> {
    await this.readyPromise
    return this.request('CMS_DUAL_VERIFY_RESULT', { type: 'CMS_DUAL_VERIFY', ...opts }, (msg) => ({
      ok: msg.ok,
      signerCount: msg.signerCount,
      payload: msg.payload,
      stderr: msg.stderr,
    }))
  }

  // ── Internals ─────────────────────────────────────────────────────────
  private handleMessage = (e: MessageEvent<WorkerOutbound>): void => {
    const msg = e.data
    if (msg.type === 'LOG') {
      for (const fn of this.logHandlers) fn({ stream: msg.stream, message: msg.message })
      return
    }
    const reqId = (msg as { requestId?: string }).requestId
    if (!reqId) return
    const slot = this.pending.get(reqId)
    if (!slot) return
    if (msg.type === 'ERROR') {
      this.pending.delete(reqId)
      slot.reject(new Error((msg as { error: string }).error))
      return
    }
    if (msg.type === slot.expect) {
      this.pending.delete(reqId)
      slot.resolve(msg)
    }
  }

  private request<E extends WorkerOutbound['type'], T>(
    expect: E,
    body: Record<string, unknown>,
    pick: (msg: Extract<WorkerOutbound, { type: E }>) => T
  ): Promise<T> {
    const requestId = `cms-${++this.idCounter}`
    return new Promise<T>((resolve, reject) => {
      this.pending.set(requestId, {
        expect,
        resolve: (m: unknown) => resolve(pick(m as Extract<WorkerOutbound, { type: E }>)),
        reject,
      })
      try {
        this.worker.postMessage({ ...body, requestId })
      } catch (err) {
        this.pending.delete(requestId)
        reject(new Error(`postMessage failed: ${String(err)}`))
      }
    })
  }
}

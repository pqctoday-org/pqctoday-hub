// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { openSSLService } from './OpenSSLService'

// Mirror the worker mock used by OpenSSLService.test.ts so we can drive the
// service from outside without a real WASM build.
const mockPostMessage = vi.fn()
const mockTerminate = vi.fn()

class MockWorker {
  postMessage = mockPostMessage
  terminate = mockTerminate
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null
  onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null
  onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null = null
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_scriptURL: string | URL, _options?: WorkerOptions) {}
}

;(global as any).Worker = MockWorker

/** Drive the service to a READY state with a stub worker, return that worker. */
async function readyService() {
  ;(openSSLService as any).isReady = false
  ;(openSSLService as any).readyPromise = null
  ;(openSSLService as any).worker = null
  ;(openSSLService as any).pendingRequests = new Map()

  const initPromise = openSSLService.init()
  // The MockWorker is created synchronously inside init().
  const worker = (openSSLService as any).worker as MockWorker
  // Drain microtasks so the worker handle is attached.
  await Promise.resolve()
  worker.onmessage?.({ data: { type: 'READY' } } as MessageEvent)
  await initPromise
  return worker
}

/** Send the standard LOG / FILE_CREATED / DONE sequence used by both
 *  simulateCmp and generateCaRoot for a successful result. */
function sendWorkerResult(
  worker: MockWorker,
  requestId: string,
  resultMarker: string,
  resultObj: unknown,
  files: { name: string; data: Uint8Array }[] = []
) {
  worker.onmessage?.({
    data: {
      type: 'LOG',
      stream: 'stdout',
      message: `${resultMarker}:${JSON.stringify(resultObj)}`,
      requestId,
    },
  } as MessageEvent)
  for (const f of files) {
    worker.onmessage?.({
      data: { type: 'FILE_CREATED', name: f.name, data: f.data, requestId },
    } as MessageEvent)
  }
  worker.onmessage?.({ data: { type: 'DONE', requestId } } as MessageEvent)
}

describe('OpenSSLService.simulateCmp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts a CMP_SIMULATE message with all expected fields', async () => {
    const worker = await readyService()
    const promise = openSSLService.simulateCmp({
      eeKeyPath: '/ee.key.pem',
      subjectDn: '/CN=Test',
      reference: 'ref-1',
      secret: 'secret-1',
      caCertPath: '/ca.cert.pem',
      caKeyPath: '/ca.key.pem',
      outCertPath: '/ee.cert.pem',
      files: [],
    })
    // Resolve the in-flight promise so it doesn't reject by timeout in test
    // simulateCmp awaits this.init() internally — let microtasks flush
    // so the actual CMP_SIMULATE postMessage fires before we read it.
    await new Promise((r) => setTimeout(r, 0))
    const lastPost = mockPostMessage.mock.calls.at(-1)?.[0]
    expect(lastPost.type).toBe('CMP_SIMULATE')
    expect(lastPost.eeKeyPath).toBe('/ee.key.pem')
    expect(lastPost.subjectDn).toBe('/CN=Test')
    expect(lastPost.reference).toBe('ref-1')
    expect(lastPost.secret).toBe('secret-1')
    expect(lastPost.caCertPath).toBe('/ca.cert.pem')
    expect(lastPost.caKeyPath).toBe('/ca.key.pem')
    expect(lastPost.outCertPath).toBe('/ee.cert.pem')
    expect(typeof lastPost.requestId).toBe('string')

    // Finish so the promise resolves cleanly
    sendWorkerResult(
      worker,
      lastPost.requestId,
      'CMP_SIMULATION_RESULT',
      { ok: true, certPath: '/ee.cert.pem', transcript: [] },
      [{ name: 'ee.cert.pem', data: new Uint8Array([0xaa, 0xbb]) }]
    )
    await promise
  })

  it('parses a successful result and returns the issued cert bytes + transcript', async () => {
    const worker = await readyService()
    const promise = openSSLService.simulateCmp({
      eeKeyPath: '/k.pem',
      subjectDn: '/CN=X',
      reference: 'r',
      secret: 's',
      caCertPath: '/ca.cert.pem',
      caKeyPath: '/ca.key.pem',
      outCertPath: '/ee.cert.pem',
      files: [],
    })
    await new Promise((r) => setTimeout(r, 0))
    const requestId = mockPostMessage.mock.calls.at(-1)?.[0].requestId as string
    const certBytes = new Uint8Array([1, 2, 3, 4, 5])
    sendWorkerResult(
      worker,
      requestId,
      'CMP_SIMULATION_RESULT',
      {
        ok: true,
        certPath: '/ee.cert.pem',
        transcript: [
          { side: 'client', event: 'start', detail: 'in-process CMP IR' },
          { side: 'server', event: 'signed', detail: 'issued cert signed' },
        ],
      },
      [{ name: 'ee.cert.pem', data: certBytes }]
    )
    const result = await promise
    expect(result.ok).toBe(true)
    expect(result.certPem).toEqual(certBytes)
    expect(result.certPath).toBe('/ee.cert.pem')
    expect(result.transcript).toHaveLength(2)
    expect(result.transcript[0]).toMatchObject({ side: 'client', event: 'start' })
    expect(result.transcript[1]).toMatchObject({ side: 'server', event: 'signed' })
  })

  it('returns ok:false and the error string when shim reports failure', async () => {
    const worker = await readyService()
    const promise = openSSLService.simulateCmp({
      eeKeyPath: '/k.pem',
      subjectDn: '/CN=X',
      reference: 'r',
      secret: 's',
      caCertPath: '/ca.cert.pem',
      caKeyPath: '/ca.key.pem',
      outCertPath: '/ee.cert.pem',
      files: [],
    })
    await new Promise((r) => setTimeout(r, 0))
    const requestId = mockPostMessage.mock.calls.at(-1)?.[0].requestId as string
    sendWorkerResult(worker, requestId, 'CMP_SIMULATION_RESULT', {
      ok: false,
      error: 'missing protection',
      transcript: [{ side: 'client', event: 'error', detail: 'missing protection' }],
    })
    const result = await promise
    expect(result.ok).toBe(false)
    expect(result.error).toBe('missing protection')
    expect(result.certPem).toBeUndefined()
    expect(result.transcript).toHaveLength(1)
  })

  it('rejects when no CMP_SIMULATION_RESULT line is emitted', async () => {
    const worker = await readyService()
    const promise = openSSLService.simulateCmp({
      eeKeyPath: '/k.pem',
      subjectDn: '/CN=X',
      reference: 'r',
      secret: 's',
      caCertPath: '/ca.cert.pem',
      caKeyPath: '/ca.key.pem',
      outCertPath: '/ee.cert.pem',
      files: [],
    })
    await new Promise((r) => setTimeout(r, 0))
    const requestId = mockPostMessage.mock.calls.at(-1)?.[0].requestId as string
    // Send stderr noise then DONE — no CMP_SIMULATION_RESULT marker.
    worker.onmessage?.({
      data: {
        type: 'LOG',
        stream: 'stderr',
        message: 'something went sideways',
        requestId,
      },
    } as MessageEvent)
    worker.onmessage?.({ data: { type: 'DONE', requestId } } as MessageEvent)
    await expect(promise).rejects.toThrow(/no result line/i)
  })
})

describe('OpenSSLService.generateCaRoot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts a GEN_CA_ROOT message with all expected fields', async () => {
    const worker = await readyService()
    const promise = openSSLService.generateCaRoot({
      algorithm: 'ML-DSA-65',
      subjectDn: '/CN=Test_CA',
      keyOutPath: '/ca.key.pem',
      certOutPath: '/ca.cert.pem',
      days: 3650,
    })
    // simulateCmp awaits this.init() internally — let microtasks flush
    // so the actual CMP_SIMULATE postMessage fires before we read it.
    await new Promise((r) => setTimeout(r, 0))
    const lastPost = mockPostMessage.mock.calls.at(-1)?.[0]
    expect(lastPost.type).toBe('GEN_CA_ROOT')
    expect(lastPost.algorithm).toBe('ML-DSA-65')
    expect(lastPost.subjectDn).toBe('/CN=Test_CA')
    expect(lastPost.keyOutPath).toBe('/ca.key.pem')
    expect(lastPost.certOutPath).toBe('/ca.cert.pem')
    expect(lastPost.days).toBe(3650)

    sendWorkerResult(worker, lastPost.requestId, 'CA_ROOT_RESULT', { ok: true }, [
      { name: 'ca.key.pem', data: new Uint8Array([0x10]) },
      { name: 'ca.cert.pem', data: new Uint8Array([0x20]) },
    ])
    await promise
  })

  it('returns key + cert bytes on success', async () => {
    const worker = await readyService()
    const promise = openSSLService.generateCaRoot({
      algorithm: 'ML-DSA-65',
      subjectDn: '/CN=CA',
      keyOutPath: '/ca.key.pem',
      certOutPath: '/ca.cert.pem',
      days: 365,
    })
    await new Promise((r) => setTimeout(r, 0))
    const requestId = mockPostMessage.mock.calls.at(-1)?.[0].requestId as string
    const keyBytes = new Uint8Array([0xa1, 0xa2])
    const certBytes = new Uint8Array([0xb1, 0xb2, 0xb3])
    sendWorkerResult(worker, requestId, 'CA_ROOT_RESULT', { ok: true }, [
      { name: 'ca.key.pem', data: keyBytes },
      { name: 'ca.cert.pem', data: certBytes },
    ])
    const result = await promise
    expect(result.ok).toBe(true)
    expect(result.keyPem).toEqual(keyBytes)
    expect(result.certPem).toEqual(certBytes)
  })

  it('surfaces shim-side errors via the ok/error fields', async () => {
    const worker = await readyService()
    const promise = openSSLService.generateCaRoot({
      algorithm: 'ML-DSA-65',
      subjectDn: '/CN=CA',
      keyOutPath: '/ca.key.pem',
      certOutPath: '/ca.cert.pem',
      days: 365,
    })
    await new Promise((r) => setTimeout(r, 0))
    const requestId = mockPostMessage.mock.calls.at(-1)?.[0].requestId as string
    sendWorkerResult(worker, requestId, 'CA_ROOT_RESULT', {
      ok: false,
      error: 'EVP_PKEY_Q_keygen failed',
    })
    const result = await promise
    expect(result.ok).toBe(false)
    expect(result.error).toBe('EVP_PKEY_Q_keygen failed')
    expect(result.keyPem).toBeUndefined()
    expect(result.certPem).toBeUndefined()
  })
})

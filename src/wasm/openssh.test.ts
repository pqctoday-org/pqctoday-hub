// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Minimal Worker class mock — captures instances for per-test inspection
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
}
const workerInstances: MockWorker[] = []
global.Worker = class extends MockWorker {
  constructor(_url: string) {
    super()
    workerInstances.push(this)
  }
} as unknown as typeof Worker

global.SharedArrayBuffer = class FakeSAB {
  byteLength: number
  constructor(byteLength: number) {
    this.byteLength = byteLength
  }
} as unknown as typeof SharedArrayBuffer

import { SshEngine } from './openssh'

describe('SshEngine', () => {
  let engine: SshEngine

  beforeEach(() => {
    vi.clearAllMocks()
    workerInstances.length = 0
    engine = new SshEngine()
  })

  it('starts in UNINITIALIZED state', () => {
    const states: string[] = []
    engine.addStateListener((s) => states.push(s))
    expect(states).toContain('UNINITIALIZED')
  })

  it('transitions to LOADING when runHandshake is called', async () => {
    const states: string[] = []
    engine.addStateListener((s) => states.push(s))

    const promise = engine.runHandshake('pqc')
    await new Promise((r) => setTimeout(r, 0))

    expect(states).toContain('LOADING')

    // Two workers should have been created: server (index 0) + client (index 1)
    const serverWorker = workerInstances[0]
    const clientWorker = workerInstances[1]
    expect(serverWorker).toBeDefined()
    expect(clientWorker).toBeDefined()

    serverWorker.onmessage?.({ data: { type: 'READY' } } as MessageEvent)
    clientWorker.onmessage?.({ data: { type: 'READY' } } as MessageEvent)
    await new Promise((r) => setTimeout(r, 0))

    serverWorker.onmessage?.({
      data: {
        type: 'EVENT',
        payload: {
          type: 'done',
          payload: JSON.stringify({
            connection_ok: true,
            host_key_algorithm: 'ssh-mldsa-65',
            client_auth_algorithm: 'ssh-mldsa-65',
            kex_algorithm: 'mlkem768x25519-sha256',
            host_pubkey_bytes: 1952,
            client_pubkey_bytes: 1952,
            host_sig_bytes: 3309,
            client_sig_bytes: 3309,
            auth_ms: 42,
            pkcs11_host_backed: true,
            pkcs11_client_backed: true,
            token_module: 'softhsmv3 (WASM)',
            wire_packets: [],
          }),
        },
      },
    } as MessageEvent)

    const result = await promise
    expect(result.connection_ok).toBe(true)
    expect(result.host_key_algorithm).toBe('ssh-mldsa-65')
    expect(result.host_sig_bytes).toBe(3309)
  })

  it('resolves with error defaults when payload is malformed JSON', async () => {
    const promise = engine.runHandshake('classical')
    await new Promise((r) => setTimeout(r, 0))

    const serverWorker = workerInstances[0]
    const clientWorker = workerInstances[1]
    serverWorker.onmessage?.({ data: { type: 'READY' } } as MessageEvent)
    clientWorker.onmessage?.({ data: { type: 'READY' } } as MessageEvent)
    await new Promise((r) => setTimeout(r, 0))

    serverWorker.onmessage?.({
      data: { type: 'EVENT', payload: { type: 'done', payload: 'not-json' } },
    } as MessageEvent)

    const result = await promise
    expect(result.connection_ok).toBe(false)
    expect(result.error).toMatch(/Failed to parse/)
  })

  it('rejects on server worker error event', async () => {
    const promise = engine.runHandshake('pqc')
    await new Promise((r) => setTimeout(r, 0))

    const serverWorker = workerInstances[0]
    serverWorker.onerror?.({ message: 'WASM trap' } as ErrorEvent)

    await expect(promise).rejects.toThrow('sshd worker error')
  })

  it('terminate() cancels in-flight workers', async () => {
    engine.runHandshake('pqc')
    await new Promise((r) => setTimeout(r, 0))
    engine.terminate()
    expect(workerInstances[0].terminate).toHaveBeenCalled()
    expect(workerInstances[1].terminate).toHaveBeenCalled()
  })
})

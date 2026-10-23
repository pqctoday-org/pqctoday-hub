// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StrongSwanEngine, STRONGSWAN_LOAD_TIMEOUT_MS, type StrongSwanState } from './bridge'

class FakeWorker {
  static instances: FakeWorker[] = []
  onmessage: ((e: { data: unknown }) => void) | null = null
  onerror: ((e: Partial<ErrorEvent> & { preventDefault: () => void }) => void) | null = null
  onmessageerror: (() => void) | null = null
  terminated = false
  url: string
  constructor(url: string) {
    this.url = url
    FakeWorker.instances.push(this)
  }
  postMessage() {}
  terminate() {
    this.terminated = true
  }
  emit(data: unknown) {
    this.onmessage?.({ data })
  }
}

const spawnOnly = (engine: StrongSwanEngine) =>
  engine.init({}, {}, undefined, false, 0, { phase: 'spawn-only', authMode: 'dual' })

describe('StrongSwanEngine failure paths', () => {
  let states: StrongSwanState[]
  let engine: StrongSwanEngine

  beforeEach(() => {
    FakeWorker.instances = []
    vi.stubGlobal('Worker', FakeWorker)
    engine = new StrongSwanEngine()
    states = []
    engine.addStateListener((s) => states.push(s))
  })

  afterEach(() => {
    engine.destroy()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts idle and only enters LOADING once init() is called', () => {
    expect(engine.getState()).toBe('UNINITIALIZED')
    expect(FakeWorker.instances).toHaveLength(0)
    void spawnOnly(engine).catch(() => {})
    expect(engine.getState()).toBe('LOADING')
    expect(FakeWorker.instances).toHaveLength(2)
  })

  it('a worker script error moves to ERROR and rejects the spawn-only promise', async () => {
    const ready = spawnOnly(engine)
    FakeWorker.instances[0].onerror?.({
      message: 'Uncaught SyntaxError: Unexpected token',
      filename: 'strongswan_worker.js',
      lineno: 12,
      preventDefault: () => {},
    })
    await expect(ready).rejects.toThrow(/initiator worker failed: Uncaught SyntaxError/)
    expect(engine.getState()).toBe('ERROR')
    expect(engine.lastError).toMatch(/strongswan_worker\.js:12/)
  })

  it('a messageerror moves to ERROR', async () => {
    const ready = spawnOnly(engine)
    FakeWorker.instances[1].onmessageerror?.()
    await expect(ready).rejects.toThrow(/responder worker sent a message/)
    expect(engine.getState()).toBe('ERROR')
  })

  it("the worker's ERROR message (e.g. HTTP 404 on the WASM) rejects the spawn-only promise", async () => {
    const ready = spawnOnly(engine)
    FakeWorker.instances[0].emit({
      type: 'ERROR',
      payload: 'WASM setup failed: Error: fetching /wasm/strongswan.wasm returned HTTP 404',
    })
    await expect(ready).rejects.toThrow(/HTTP 404/)
    expect(states.at(-1)).toBe('ERROR')
  })

  it('gives up after the LOADING time limit and names what was still loading', async () => {
    vi.useFakeTimers()
    const ready = spawnOnly(engine)
    const settled = ready.catch((e: Error) => e)
    FakeWorker.instances[0].emit({ type: 'READY' })
    vi.advanceTimersByTime(STRONGSWAN_LOAD_TIMEOUT_MS - 1)
    expect(engine.getState()).toBe('LOADING')
    vi.advanceTimersByTime(1)
    expect(engine.getState()).toBe('ERROR')
    const err = await settled
    expect(String(err)).toMatch(/did not finish loading within 150 s/)
    expect(String(err)).toMatch(/strongswan\.wasm \(1 of 2 workers ready\)/)
  })

  it('does not time out once the workers are ready, nor after destroy()', () => {
    vi.useFakeTimers()
    void spawnOnly(engine)
    for (const w of FakeWorker.instances) w.emit({ type: 'KEYS_READY' })
    expect(engine.getState()).toBe('READY')
    vi.advanceTimersByTime(STRONGSWAN_LOAD_TIMEOUT_MS * 2)
    expect(engine.getState()).toBe('READY')

    engine.destroy()
    void spawnOnly(engine)
    engine.destroy()
    vi.advanceTimersByTime(STRONGSWAN_LOAD_TIMEOUT_MS * 2)
    expect(engine.getState()).toBe('UNINITIALIZED')
  })

  it('ignores errors from workers terminated by destroy()', () => {
    void spawnOnly(engine).catch(() => {})
    const stale = FakeWorker.instances[0]
    engine.destroy()
    stale.onerror?.({ message: 'late', preventDefault: () => {} })
    expect(engine.getState()).toBe('UNINITIALIZED')
  })
})

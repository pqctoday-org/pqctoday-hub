// SPDX-License-Identifier: AGPL-3.0-only
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOpenSSL } from './useOpenSSL'

type Posted = { type: string; requestId?: string }
class OwnedWorker {
  static instances: OwnedWorker[] = []
  onmessage: ((event: MessageEvent) => void) | null = null
  postMessage = vi.fn<(message: Posted) => void>()
  terminate = vi.fn()
  constructor() {
    OwnedWorker.instances.push(this)
  }
  send(data: object) {
    this.onmessage?.({ data } as MessageEvent)
  }
  lastId() {
    return this.postMessage.mock.calls.at(-1)![0].requestId!
  }
}
beforeEach(() => {
  OwnedWorker.instances = []
  vi.stubGlobal('Worker', OwnedWorker)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('OpenSSL owned worker promise lifetime', () => {
  it('rejects its three private pending request types on termination and clears stale worker access', async () => {
    const { result, unmount } = renderHook(useOpenSSL)
    const api = result.current
    let command!: Promise<unknown>, keygen!: Promise<unknown>, objects!: Promise<unknown>
    act(() => {
      command = api.runCommand('version').catch((e) => e)
      keygen = api.hsmKeygen('ML-DSA-65', 'sample').catch((e) => e)
      objects = api.hsmListObjects().catch((e) => e)
    })
    unmount()
    for (const promise of [command, keygen, objects]) {
      const outcome = await promise
      expect(outcome).toBeInstanceOf(Error)
      if (!(outcome instanceof Error)) throw new Error('Request unexpectedly succeeded')
      expect(outcome.message).toBe('OpenSSL worker closed before the request completed.')
    }
    expect(OwnedWorker.instances[0].terminate).toHaveBeenCalledTimes(1)
    await expect(api.runCommand('version')).rejects.toThrow('not ready')
    await expect(api.hsmKeygen('ML-DSA-65', 'sample')).rejects.toThrow('not ready')
    await expect(api.hsmListObjects()).rejects.toThrow('not ready')
  })
  it('preserves normal DONE and genuine stderr ERROR outcomes', async () => {
    const { result } = renderHook(useOpenSSL)
    const worker = OwnedWorker.instances[0]
    let good!: Promise<{ stdout: string }>
    act(() => {
      good = result.current.runCommand('version')
    })
    const id = worker.lastId()
    act(() => {
      worker.send({ type: 'LOG', requestId: id, stream: 'stdout', message: 'OpenSSL sample' })
      worker.send({ type: 'DONE', requestId: id })
    })
    await expect(good).resolves.toEqual({ stdout: 'OpenSSL sample' })
    let bad!: Promise<unknown>
    act(() => {
      bad = result.current.runCommand('bad').catch((e) => e)
    })
    const badId = worker.lastId()
    act(() => {
      worker.send({ type: 'LOG', requestId: badId, stream: 'stderr', message: 'specific failure' })
      worker.send({ type: 'ERROR', requestId: badId, error: 'exit 1' })
    })
    expect(((await bad) as Error).message).toBe('specific failure')
  })
  it('preserves ordinary key-generation and list resolution and errors', async () => {
    const { result } = renderHook(useOpenSSL)
    const worker = OwnedWorker.instances[0]
    let key!: Promise<{ uri: string }>
    act(() => {
      key = result.current.hsmKeygen('ML-DSA-65', 'sample')
    })
    const keyId = worker.lastId()
    act(() =>
      worker.send({ type: 'HSM_KEY_CREATED', requestId: keyId, uri: 'pkcs11:object=sample' })
    )
    await expect(key).resolves.toEqual({ uri: 'pkcs11:object=sample' })
    for (const kind of ['key', 'list']) {
      let error!: Promise<unknown>
      act(() => {
        error = (
          kind === 'key'
            ? result.current.hsmKeygen('ML-DSA-65', 'sample')
            : result.current.hsmListObjects()
        ).catch((e) => e)
      })
      const id = worker.lastId()
      act(() => worker.send({ type: 'ERROR', requestId: id, error: 'sample operation error' }))
      expect(((await error) as Error).message).toBe('sample operation error')
    }
  })
  it('does not reject another hook instance’s private request or accept late old-worker messages', async () => {
    const view = renderHook(useOpenSSL)
    const utils = renderHook(useOpenSSL)
    const old = OwnedWorker.instances[0]
    const active = OwnedWorker.instances[1]
    let retired!: Promise<unknown>, live!: Promise<unknown>
    let settled = false
    act(() => {
      retired = view.result.current.runCommand('version').catch((e) => e)
      live = utils.result.current.hsmListObjects().then((value) => {
        settled = true
        return value
      })
    })
    const id = active.lastId()
    view.unmount()
    await retired
    await Promise.resolve()
    expect(settled).toBe(false)
    act(() => old.send({ type: 'HSM_OBJECTS', requestId: id, objects: [{ handle: 999 }] }))
    expect(settled).toBe(false)
    act(() => active.send({ type: 'HSM_OBJECTS', requestId: id, objects: [] }))
    await expect(live).resolves.toEqual([])
  })
})

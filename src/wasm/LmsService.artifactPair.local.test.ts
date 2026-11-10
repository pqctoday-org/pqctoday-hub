// SPDX-License-Identifier: AGPL-3.0-only
import { webcrypto } from 'node:crypto'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { LmsService } from './LmsService'
// jsdom has no browser SRI property. This fixture models only capability presence;
// actual hash enforcement is checked by the separate native-browser cohort.
const integrityDescriptor = Object.getOwnPropertyDescriptor(
  HTMLScriptElement.prototype,
  'integrity'
)
vi.mock('./lmsArtifact.generated', () => ({
  LMS_ARTIFACT: {
    abiVersion: 1,
    buildId: 'test',
    pairId: 'test',
    factoryName: 'testLmsFactory',
    jsUrl: '/wasm/lms/test.js',
    jsIntegrity: 'sha256-test',
    wasmUrl: '/wasm/lms/test.wasm',
    wasmSha256: '6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d',
  },
}))
const factory = vi.fn(),
  old = vi.fn(),
  fetcher = vi.fn()
let script: HTMLScriptElement
const module = {
  HEAPU8: new Uint8Array(4096),
  _malloc: vi.fn(),
  _free: vi.fn(),
  _get_signature_length_wasm: vi.fn(),
  _sign_message_bounded_wasm: vi.fn(),
  _generate_keypair_wasm: vi.fn(),
  _verify_wasm: vi.fn(),
}
beforeEach(() => {
  Object.defineProperty(HTMLScriptElement.prototype, 'integrity', {
    configurable: true,
    writable: true,
    value: '',
  })
  vi.clearAllMocks()
  vi.stubGlobal('crypto', webcrypto)
  fetcher.mockResolvedValue({ ok: true, arrayBuffer: async () => Uint8Array.of(0).buffer })
  vi.stubGlobal('fetch', fetcher)
  factory.mockResolvedValue(module)
  Reflect.set(window, 'createLmsModule', old)
  Reflect.set(window, 'testLmsFactory', old)
  vi.spyOn(document.body, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    script = node as unknown as HTMLScriptElement
    queueMicrotask(() => {
      Reflect.set(window, 'testLmsFactory', factory)
      script.dispatchEvent(new Event('load'))
    })
    return node
  })
})
afterEach(() => {
  if (integrityDescriptor)
    Object.defineProperty(HTMLScriptElement.prototype, 'integrity', integrityDescriptor)
  else Reflect.deleteProperty(HTMLScriptElement.prototype, 'integrity')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(window, 'testLmsFactory')
  Reflect.deleteProperty(window, 'createLmsModule')
})
describe('Content-pair initialization program flow; actual browser SRI separately required', () => {
  it('verifies WASM before loading captured factory and supplies only verified bytes', async () => {
    const service = new LmsService()
    await Promise.all([service.init(), service.init()])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(factory).toHaveBeenCalledTimes(1)
    expect(old).not.toHaveBeenCalled()
    expect(script.integrity).toBe('sha256-test')
    expect(script.crossOrigin).toBe('anonymous')
    expect(new Uint8Array(factory.mock.calls[0][0].wasmBinary)).toEqual(Uint8Array.of(0))
    expect(factory.mock.calls[0][0].locateFile('test.wasm')).toBe('/wasm/lms/test.wasm')
    expect(() => factory.mock.calls[0][0].locateFile('lms.wasm')).toThrow('Unexpected')
    expect(script.onload).toBeNull()
    expect(script.onerror).toBeNull()
  })
  it('rejects an old200 WASM body before any script/factory invocation', async () => {
    fetcher.mockResolvedValue({ ok: true, arrayBuffer: async () => Uint8Array.of(1).buffer })
    await expect(new LmsService().init()).rejects.toThrow('integrity mismatch')
    expect(document.body.appendChild).not.toHaveBeenCalled()
    expect(factory).not.toHaveBeenCalled()
    expect(old).not.toHaveBeenCalled()
  })
  it('rejects a missing immutable WASM without fallback', async () => {
    fetcher.mockResolvedValue({ ok: false })
    await expect(new LmsService().init()).rejects.toThrow('missing')
    expect(document.body.appendChild).not.toHaveBeenCalled()
    expect(factory).not.toHaveBeenCalled()
    expect(old).not.toHaveBeenCalled()
  })
  it('propagates script integrity/load error without trusting a preexisting global', async () => {
    vi.mocked(document.body.appendChild).mockImplementation(<T extends Node>(node: T): T => {
      script = node as unknown as HTMLScriptElement
      queueMicrotask(() => script.dispatchEvent(new Event('error')))
      return node
    })
    await expect(new LmsService().init()).rejects.toThrow('integrity/loading')
    expect(factory).not.toHaveBeenCalled()
    expect(old).not.toHaveBeenCalled()
    expect(script.onload).toBeNull()
    expect(script.onerror).toBeNull()
  })
  it('rejects unchanged stale global even after an onload signal', async () => {
    vi.mocked(document.body.appendChild).mockImplementation(<T extends Node>(node: T): T => {
      queueMicrotask(() => node.dispatchEvent(new Event('load')))
      return node
    })
    await expect(new LmsService().init()).rejects.toThrow('not newly published')
    expect(old).not.toHaveBeenCalled()
  })
  it('releases failed initialization so an explicit retry validates again', async () => {
    fetcher.mockResolvedValueOnce({ ok: false })
    const service = new LmsService()
    const answers = await Promise.allSettled([service.init(), service.init()])
    expect(answers.every((x) => x.status === 'rejected')).toBe(true)
    expect(factory).not.toHaveBeenCalled()
    await service.init()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(factory).toHaveBeenCalledTimes(1)
  })
})

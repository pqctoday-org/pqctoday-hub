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
// Controlled network/module fixtures test byte transport and cleanup only.
// Actual engine/reference crypto evidence is a separate private test cohort.
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
let heap: Uint8Array<ArrayBuffer>, next: number
const module = {
  HEAPU8: new Uint8Array(4096),
  _malloc: vi.fn<(size: number) => number>(),
  _free: vi.fn(),
  _get_signature_length_wasm: vi.fn(),
  _sign_message_bounded_wasm: vi.fn(),
  _generate_keypair_wasm: vi.fn(),
  _verify_wasm: vi.fn(),
  _sign_message_wasm: vi.fn(),
}
beforeEach(() => {
  Object.defineProperty(HTMLScriptElement.prototype, 'integrity', {
    configurable: true,
    writable: true,
    value: '',
  })
  vi.clearAllMocks()
  heap = new Uint8Array(4096)
  next = 256
  module.HEAPU8 = heap
  module._malloc.mockImplementation((n) => {
    const p = next
    next += n + 8
    return p
  })
  module._get_signature_length_wasm.mockReturnValue(3)
  module._sign_message_bounded_wasm.mockImplementation(
    (p: number, _pc: number, _m: number, _ml: number, s: number, c: number, w: number) => {
      expect(c).toBe(3)
      heap.set([0x31, 0, 0], s)
      heap[p]++
      new DataView(heap.buffer).setUint32(w, 3, true)
      return 0
    }
  )
  module._sign_message_wasm.mockImplementation(() => {
    throw Error('Unsafe old ABI called')
  })
  vi.stubGlobal('crypto', webcrypto)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => Uint8Array.of(0).buffer })
  )
  Reflect.deleteProperty(window, 'testLmsFactory')
  vi.spyOn(document.body, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    queueMicrotask(() => {
      Reflect.set(window, 'testLmsFactory', async () => module)
      node.dispatchEvent(new Event('load'))
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
})
describe('Exact-count LMS caller transport with controlled module, not crypto proof', () => {
  it('preserves ending00 bytes, exact offered capacity, message and updated state', async () => {
    const service = new LmsService()
    const key = Uint8Array.of(9, 8, 7),
      message = Uint8Array.of(4, 5)
    const result = await service.sign(key, message)
    expect(result.signature).toEqual(Uint8Array.of(0x31, 0, 0))
    expect(result.updatedPrivateKey).toEqual(Uint8Array.of(10, 8, 7))
    expect(key).toEqual(Uint8Array.of(9, 8, 7))
    expect(module._sign_message_bounded_wasm).toHaveBeenCalledTimes(1)
    const call = module._sign_message_bounded_wasm.mock.calls[0]
    expect(call[1]).toBe(3)
    expect(call[3]).toBe(2)
    expect(heap.slice(call[2], call[2] + 2)).toEqual(message)
    expect(module._free).toHaveBeenCalledTimes(4)
    expect(module._sign_message_wasm).not.toHaveBeenCalled()
  })
  it('does not sign a zero required length and frees the private allocation', async () => {
    module._get_signature_length_wasm.mockReturnValue(0)
    await expect(new LmsService().sign(Uint8Array.of(1), Uint8Array.of(2))).rejects.toThrow(
      'required signature length'
    )
    expect(module._sign_message_bounded_wasm).not.toHaveBeenCalled()
    expect(module._free).toHaveBeenCalledTimes(1)
  })
  it.each([-1, -2])('does not publish a signature on bounded failure%s', async (code) => {
    module._sign_message_bounded_wasm.mockReturnValue(code)
    await expect(new LmsService().sign(Uint8Array.of(1), Uint8Array.of(2))).rejects.toThrow(
      code === -2 ? 'capacity' : 'did not complete'
    )
    expect(module._free).toHaveBeenCalledTimes(4)
    expect(module._sign_message_wasm).not.toHaveBeenCalled()
  })
  it.each([0, 2, 4])('rejects inconsistent reported exact count%s', async (count) => {
    module._sign_message_bounded_wasm.mockImplementation(
      (_p: number, _pc: number, _m: number, _ml: number, _s: number, _c: number, w: number) => {
        new DataView(heap.buffer).setUint32(w, count, true)
        return 0
      }
    )
    await expect(new LmsService().sign(Uint8Array.of(1), Uint8Array.of(2))).rejects.toThrow(
      'invalid exact signature length'
    )
    expect(module._free).toHaveBeenCalledTimes(4)
  })
  it('frees earlier allocations when a later malloc fails', async () => {
    module._malloc.mockImplementationOnce(() => 256).mockReturnValueOnce(0)
    await expect(new LmsService().sign(Uint8Array.of(1), Uint8Array.of(2))).rejects.toThrow(
      'allocation'
    )
    expect(module._sign_message_bounded_wasm).not.toHaveBeenCalled()
    expect(module._free).toHaveBeenCalledExactlyOnceWith(256)
  })
})

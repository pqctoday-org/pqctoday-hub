// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import { checkWebGPUBufferCapability } from './WebLLMService'

function stubAdapter(features: string[], storageMB = 1024) {
  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    gpu: {
      requestAdapter: async () => ({
        features: new Set(features),
        limits: {
          maxStorageBufferBindingSize: storageMB * 1024 * 1024,
          maxBufferSize: storageMB * 1024 * 1024,
        },
      }),
    },
  })
}

describe('checkWebGPUBufferCapability shader-f16', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is ok when buffers suffice and shader-f16 is present', async () => {
    stubAdapter(['shader-f16'])
    const cap = await checkWebGPUBufferCapability()
    expect(cap).toMatchObject({ ok: true, shaderF16: true })
  })

  it('is not ok without shader-f16, even with large buffers', async () => {
    stubAdapter([])
    const cap = await checkWebGPUBufferCapability()
    expect(cap).toMatchObject({ ok: false, shaderF16: false })
  })

  it('still reports small buffers as not ok', async () => {
    stubAdapter(['shader-f16'], 64)
    const cap = await checkWebGPUBufferCapability()
    expect(cap).toMatchObject({ ok: false, shaderF16: true })
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isModelAssistantFallback, MODEL_ASSISTANT_STORAGE_KEY } from './featureFlags'

afterEach(() => {
  vi.unstubAllEnvs()
  localStorage.removeItem(MODEL_ASSISTANT_STORAGE_KEY)
})

describe('hidden rollback switch to the old model chat', () => {
  it('is off by default', () => {
    expect(isModelAssistantFallback()).toBe(false)
  })

  it('uses the documented names: a build setting and a browser key', () => {
    expect(MODEL_ASSISTANT_STORAGE_KEY).toBe('pqc-feature-model-assistant')
  })

  it('turns on with the browser key set to 1', () => {
    localStorage.setItem(MODEL_ASSISTANT_STORAGE_KEY, '1')
    expect(isModelAssistantFallback()).toBe(true)
  })

  it('ignores any other value of the browser key', () => {
    for (const v of ['0', 'true', 'yes', '']) {
      localStorage.setItem(MODEL_ASSISTANT_STORAGE_KEY, v)
      expect(isModelAssistantFallback()).toBe(false)
    }
  })

  it('turns on with the build setting VITE_FEATURE_MODEL_ASSISTANT=1', () => {
    vi.stubEnv('VITE_FEATURE_MODEL_ASSISTANT', '1')
    expect(isModelAssistantFallback()).toBe(true)
  })

  it('lets the build setting win: 0 keeps it off even when the browser key says 1', () => {
    vi.stubEnv('VITE_FEATURE_MODEL_ASSISTANT', '0')
    localStorage.setItem(MODEL_ASSISTANT_STORAGE_KEY, '1')
    expect(isModelAssistantFallback()).toBe(false)
  })

  it('stays off when storage cannot be read', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(isModelAssistantFallback()).toBe(false)
    get.mockRestore()
  })
})

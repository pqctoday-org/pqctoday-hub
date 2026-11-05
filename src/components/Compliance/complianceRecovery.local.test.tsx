// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import {
  COMPLIANCE_META_URL,
  fetchStaticComplianceData,
  resetComplianceMetaCache,
} from './complianceDataLoader'
import { fetchComplianceData, useComplianceRefresh } from './services'
vi.mock('localforage', () => ({
  default: { config: vi.fn(), keys: vi.fn().mockResolvedValue([]), removeItem: vi.fn() },
}))
const sample = {
  id: 'sample-cert',
  type: 'FIPS 140-3',
  date: '2026-01-01',
  productName: 'Sample module',
}
const fetched = vi.fn()
beforeEach(() => {
  resetComplianceMetaCache()
  vi.stubGlobal('fetch', fetched)
  fetched.mockReset()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
const respond = (body: unknown) =>
  fetched.mockImplementation(async (url: string) => ({
    ok: url !== COMPLIANCE_META_URL,
    json: async () => body,
  }))
describe('Certification snapshot unavailable versus successful empty publication', () => {
  it('preserves HTTP and network failures rather than returning zero records', async () => {
    fetched.mockResolvedValueOnce({ ok: false })
    await expect(fetchStaticComplianceData()).rejects.toThrow('snapshot')
    fetched.mockRejectedValueOnce(new Error('Sample network failure'))
    await expect(fetchComplianceData()).rejects.toThrow('Sample network failure')
  })
  it('rejects malformed JSON and a non-array envelope', async () => {
    fetched.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError('Sample invalid JSON')
      },
    })
    await expect(fetchStaticComplianceData()).rejects.toThrow('Sample invalid JSON')
    respond({ records: [] })
    await expect(fetchComplianceData()).rejects.toThrow('invalid format')
  })
  it('keeps a genuine successful empty publication distinct from failure', async () => {
    respond([])
    expect(await fetchComplianceData()).toEqual([])
    const { result } = renderHook(() => useComplianceRefresh())
    await waitFor(() => expect(fetched).toHaveBeenCalledTimes(3))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.data).toEqual([])
  })
  it('preserves optional metadata fallback and existing record filtering', async () => {
    respond([sample, { id: 'older-sample', type: 'FIPS 140-2' }])
    expect(await fetchComplianceData()).toEqual([sample])
  })
  it('exposes the existing refresh error and recovers through retry without treating failure as an empty result', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetched.mockImplementation(async (url: string) => {
      if (url === COMPLIANCE_META_URL) return { ok: false }
      throw new Error('Sample offline source')
    })
    const { result } = renderHook(() => useComplianceRefresh())
    await waitFor(() =>
      expect(result.current.error).toBe('Failed to refresh data. Please try again.')
    )
    expect(result.current.loading).toBe(false)
    expect(result.current.lastUpdated).toBeNull()
    expect(logged).toHaveBeenCalled()
    respond([sample])
    await act(async () => {
      await result.current.refresh()
    })
    expect(result.current.error).toBeNull()
    expect(result.current.data).toEqual([sample])
    expect(result.current.lastUpdated).not.toBeNull()
  })
})

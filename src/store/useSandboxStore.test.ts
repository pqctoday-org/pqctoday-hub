// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useSandboxStore, isSandboxAvailable } from './useSandboxStore'

describe('useSandboxStore', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    useSandboxStore.setState({
      status: 'idle',
      lastChecked: null,
      error: null,
      baseUrl: 'http://localhost:4000',
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('marks status online when /api/status responds', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    const result = await useSandboxStore.getState().probe()
    expect(result).toBe('online')
    expect(useSandboxStore.getState().status).toBe('online')
    expect(useSandboxStore.getState().lastChecked).not.toBeNull()
  })

  it('marks status offline when fetch rejects', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    const result = await useSandboxStore.getState().probe()
    expect(result).toBe('offline')
    expect(useSandboxStore.getState().status).toBe('offline')
    expect(useSandboxStore.getState().error).toMatch(/ECONNREFUSED|aborted/i)
  })

  it('isSandboxAvailable only returns true for online status', () => {
    expect(isSandboxAvailable('online')).toBe(true)
    expect(isSandboxAvailable('offline')).toBe(false)
    expect(isSandboxAvailable('checking')).toBe(false)
    expect(isSandboxAvailable('idle')).toBe(false)
  })
})

// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  useSandboxStore,
  isSandboxAvailable,
  filterToolsBySandboxAvailability,
  availableCategoriesForSandboxStatus,
  SANDBOX_CATEGORY,
  type SandboxStatus,
} from './useSandboxStore'
import { WORKSHOP_TOOLS, CATEGORIES } from '@/components/Playground/workshopRegistry'

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

  it('marks status offline when /api/status responds non-2xx (upstream down)', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
    const result = await useSandboxStore.getState().probe()
    expect(result).toBe('offline')
    expect(useSandboxStore.getState().status).toBe('offline')
    expect(useSandboxStore.getState().error).toMatch(/503/)
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

describe('sandbox catalog gating — invariants against the real registry', () => {
  const NON_ONLINE: SandboxStatus[] = ['idle', 'checking', 'offline']

  it('precondition: registry actually contains at least one Sandbox-category tool + the Sandbox category', () => {
    expect(WORKSHOP_TOOLS.some((t) => t.category === SANDBOX_CATEGORY)).toBe(true)
    expect(CATEGORIES).toContain(SANDBOX_CATEGORY)
  })

  it.each(NON_ONLINE)(
    'filterToolsBySandboxAvailability strips every Sandbox tool when status=%s',
    (status) => {
      const filtered = filterToolsBySandboxAvailability(WORKSHOP_TOOLS, status)
      expect(filtered.some((t) => t.category === SANDBOX_CATEGORY)).toBe(false)
      expect(filtered.length).toBeLessThan(WORKSHOP_TOOLS.length)
    }
  )

  it('filterToolsBySandboxAvailability returns the full catalog when online', () => {
    const filtered = filterToolsBySandboxAvailability(WORKSHOP_TOOLS, 'online')
    expect(filtered).toEqual(WORKSHOP_TOOLS)
  })

  it.each(NON_ONLINE)(
    'availableCategoriesForSandboxStatus omits the Sandbox category when status=%s',
    (status) => {
      const cats = availableCategoriesForSandboxStatus(CATEGORIES, status)
      expect(cats).not.toContain(SANDBOX_CATEGORY)
      expect(cats.length).toBe(CATEGORIES.length - 1)
    }
  )

  it('availableCategoriesForSandboxStatus returns the full list when online', () => {
    const cats = availableCategoriesForSandboxStatus(CATEGORIES, 'online')
    expect(cats).toEqual(CATEGORIES)
  })
})

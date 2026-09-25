// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useEffect } from 'react'
import { render, act } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import { CrossOriginIsolationGuard } from './CrossOriginIsolationGuard'
import { COI_RELOAD_KEY } from '@/utils/crossOriginIsolation'

let navigateRef: ReturnType<typeof useNavigate> | null = null
function NavigateProbe() {
  const navigate = useNavigate()
  useEffect(() => {
    navigateRef = navigate
  }, [navigate])
  return null
}

function stubBrowser(opts: { isolated: boolean; controller: boolean }) {
  Object.defineProperty(window, 'crossOriginIsolated', {
    value: opts.isolated,
    configurable: true,
  })
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { controller: opts.controller ? {} : null },
    configurable: true,
  })
}

describe('CrossOriginIsolationGuard (in-app navigation into an isolation route)', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => {
    // jsdom has neither; remove the stubs so other tests see the default.
    delete (window as { crossOriginIsolated?: boolean }).crossOriginIsolated
    delete (navigator as { serviceWorker?: unknown }).serviceWorker
    sessionStorage.clear()
  })

  function renderAt(url: string, navigateTo: (u: string) => void) {
    render(
      <MemoryRouter initialEntries={[url]}>
        <CrossOriginIsolationGuard navigateTo={navigateTo} />
        <NavigateProbe />
      </MemoryRouter>
    )
  }

  it('leaves a non-isolation page alone (no reload on /threats)', () => {
    stubBrowser({ isolated: false, controller: true })
    const navigateTo = vi.fn()
    renderAt('/threats?id=AERO-003', navigateTo)
    expect(navigateTo).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(COI_RELOAD_KEY)).toBeNull()
  })

  it('turns a client-side move into /playground into ONE full navigation, then never again', () => {
    stubBrowser({ isolated: false, controller: true })
    const navigateTo = vi.fn()
    renderAt('/threats', navigateTo)
    act(() => navigateRef?.('/playground?tab=x'))
    expect(navigateTo).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenCalledWith('/playground?tab=x')
    expect(sessionStorage.getItem(COI_RELOAD_KEY)).toBe('1')
    // Still not isolated (e.g. the browser can't be) — the guard must not loop.
    act(() => navigateRef?.('/playground/vpn-sim'))
    expect(navigateTo).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the page is already isolated', () => {
    stubBrowser({ isolated: true, controller: true })
    const navigateTo = vi.fn()
    renderAt('/playground', navigateTo)
    expect(navigateTo).not.toHaveBeenCalled()
  })
})

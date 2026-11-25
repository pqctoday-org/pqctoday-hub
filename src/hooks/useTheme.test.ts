// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme, useEffectiveTheme, getSystemTheme } from '../hooks/useTheme'
import { useThemeStore } from '../store/useThemeStore'

type Listener = () => void

/** A controllable `prefers-color-scheme: dark` query. */
function mockDeviceScheme(initial: 'dark' | 'light') {
  let dark = initial === 'dark'
  const listeners = new Set<Listener>()
  const mql = {
    get matches() {
      return dark
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql)
  )
  return {
    set(next: 'dark' | 'light') {
      dark = next === 'dark'
      listeners.forEach((l) => l())
    },
    listenerCount: () => listeners.size,
  }
}

const rootHas = (cls: string) => document.documentElement.classList.contains(cls)

describe('useTheme', () => {
  beforeEach(() => {
    // A visitor who has never chosen a theme.
    useThemeStore.setState({ theme: 'light', hasSetPreference: false })
    document.documentElement.className = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('follows a light device when the visitor has not chosen', () => {
    mockDeviceScheme('light')
    renderHook(() => useTheme())
    expect(rootHas('light')).toBe(true)
    expect(rootHas('dark')).toBe(false)
  })

  it('follows a dark device when the visitor has not chosen', () => {
    mockDeviceScheme('dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(rootHas('dark')).toBe(true)
    expect(rootHas('light')).toBe(false)
    // following the device is not a saved choice
    expect(useThemeStore.getState().hasSetPreference).toBe(false)
  })

  it('falls back to light when the browser has no colour-scheme query', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(getSystemTheme()).toBe('light')
    renderHook(() => useTheme())
    expect(rootHas('light')).toBe(true)
  })

  it('switches with the device while no choice has been made', () => {
    const device = mockDeviceScheme('light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    act(() => device.set('dark'))
    expect(result.current.theme).toBe('dark')
    expect(rootHas('dark')).toBe(true)
    act(() => device.set('light'))
    expect(rootHas('light')).toBe(true)
  })

  it('an explicit choice beats the device, in both directions', () => {
    const device = mockDeviceScheme('dark')
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('light'))
    expect(rootHas('light')).toBe(true)
    expect(rootHas('dark')).toBe(false)
    expect(useThemeStore.getState()).toMatchObject({ theme: 'light', hasSetPreference: true })
    // the device changing later does not override the choice
    act(() => device.set('light'))
    act(() => device.set('dark'))
    expect(rootHas('light')).toBe(true)

    act(() => result.current.setTheme('dark'))
    act(() => device.set('light'))
    expect(rootHas('dark')).toBe(true)
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('a stored explicit choice wins on a fresh load', () => {
    mockDeviceScheme('dark')
    useThemeStore.setState({ theme: 'light', hasSetPreference: true })
    renderHook(() => useTheme())
    expect(rootHas('light')).toBe(true)
  })

  it('stops listening to the device when unmounted', () => {
    const device = mockDeviceScheme('light')
    const { unmount } = renderHook(() => useEffectiveTheme())
    expect(device.listenerCount()).toBe(1)
    unmount()
    expect(device.listenerCount()).toBe(0)
  })
})

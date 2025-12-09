import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../hooks/useTheme'
import { useThemeStore } from '../store/useThemeStore'

// Mock matchMedia
// matchMedia mock is no longer needed since we removed system theme support

describe('useTheme', () => {
  beforeEach(() => {
    // Reset store - default to light
    useThemeStore.setState({ theme: 'light' })

    // Clear classList
    document.documentElement.className = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default light theme', () => {
    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('switches to explicit dark mode', async () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('switches to explicit light mode', async () => {
    // Start dark
    useThemeStore.setState({ theme: 'dark' })
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('light')
    })

    expect(document.documentElement.classList.contains('light')).toBe(true)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../hooks/useTheme'
import { useThemeStore } from '../store/useThemeStore'

// Mock matchMedia
const matchMediaMock = vi.fn()

describe('useTheme', () => {
  beforeEach(() => {
    // Reset store
    useThemeStore.setState({ theme: 'system' })

    // Setup matchMedia mock
    matchMediaMock.mockReturnValue({
      matches: false, // Default light
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    window.matchMedia = matchMediaMock

    // Clear classList
    document.documentElement.className = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with system theme (light default)', () => {
    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('initializes with system theme (dark preference)', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
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

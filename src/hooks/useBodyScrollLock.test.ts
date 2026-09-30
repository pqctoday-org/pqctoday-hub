// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBodyScrollLock, bodyScrollLockCount } from './useBodyScrollLock'

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    // Every earlier test's hooks were unmounted: no lock may leak between tests.
    expect(bodyScrollLockCount()).toBe(0)
    document.body.style.overflow = 'scroll'
    document.body.style.paddingRight = '3px'
  })
  afterEach(() => {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  it('locks while active and restores the original inline overflow', () => {
    const { rerender } = renderHook(({ on }) => useBodyScrollLock(on), {
      initialProps: { on: false },
    })
    expect(document.body.style.overflow).toBe('scroll')
    rerender({ on: true })
    expect(document.body.style.overflow).toBe('hidden')
    rerender({ on: false })
    expect(document.body.style.overflow).toBe('scroll')
    expect(document.body.style.paddingRight).toBe('3px')
  })

  it('nested locks are ref-counted: closing the top overlay keeps the page locked', () => {
    const { unmount: unmountOuter } = renderHook(() => useBodyScrollLock(true))
    const { unmount: unmountInner } = renderHook(() => useBodyScrollLock(true))
    expect(bodyScrollLockCount()).toBe(2)
    unmountInner()
    expect(document.body.style.overflow).toBe('hidden')
    unmountOuter()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('pads the body by the scrollbar width so the layout does not shift', () => {
    const innerWidth = window.innerWidth
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      get: () => innerWidth - 15,
    })
    try {
      const { unmount } = renderHook(() => useBodyScrollLock(true))
      expect(document.body.style.paddingRight).toBe('18px')
      unmount()
      expect(document.body.style.paddingRight).toBe('3px')
    } finally {
      // Drop the own-property override; the prototype getter takes over again.
      delete (document.documentElement as unknown as Record<string, unknown>).clientWidth
    }
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSyncDeepLink } from './useModuleDeepLink'

describe('useSyncDeepLink on a module whose workshop steps were reordered', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('writes the step numbering (sv) next to a workshop step of Hybrid Cryptography', () => {
    window.history.replaceState(null, '', '/learn/hybrid-crypto')
    renderHook(() => useSyncDeepLink('workshop', 3))
    expect(new URLSearchParams(window.location.search).get('sv')).toBe('2')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('3')
  })

  it('does not write sv on the first step, on another tab, or for another module', () => {
    window.history.replaceState(null, '', '/learn/hybrid-crypto')
    renderHook(() => useSyncDeepLink('workshop', 0))
    expect(new URLSearchParams(window.location.search).has('sv')).toBe(false)

    window.history.replaceState(null, '', '/learn/hybrid-crypto')
    renderHook(() => useSyncDeepLink('learn', 3))
    expect(new URLSearchParams(window.location.search).has('sv')).toBe(false)

    window.history.replaceState(null, '', '/learn/pki-workshop')
    renderHook(() => useSyncDeepLink('workshop', 3))
    expect(new URLSearchParams(window.location.search).has('sv')).toBe(false)
  })
})

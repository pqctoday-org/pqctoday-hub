// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { getModuleDeepLink } from './useModuleDeepLink'

describe('getModuleDeepLink', () => {
  beforeEach(() => {
    // Reset URL to bare path before each test
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '' },
      writable: true,
    })
  })

  function setSearch(search: string) {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search },
      writable: true,
    })
  }

  it('returns defaults when no URL params', () => {
    const result = getModuleDeepLink()
    expect(result).toEqual({ initialTab: 'learn', initialStep: 0, initialFlow: null })
  })

  it('parses ?tab=workshop', () => {
    setSearch('?tab=workshop')
    expect(getModuleDeepLink()).toEqual({
      initialTab: 'workshop',
      initialStep: 0,
      initialFlow: null,
    })
  })

  it('parses ?tab=workshop&step=3', () => {
    setSearch('?tab=workshop&step=3')
    expect(getModuleDeepLink()).toEqual({
      initialTab: 'workshop',
      initialStep: 3,
      initialFlow: null,
    })
  })

  it('ignores invalid tab values', () => {
    setSearch('?tab=invalid')
    expect(getModuleDeepLink()).toEqual({ initialTab: 'learn', initialStep: 0, initialFlow: null })
  })

  it('clamps negative step to 0', () => {
    setSearch('?step=-1')
    expect(getModuleDeepLink()).toEqual({ initialTab: 'learn', initialStep: 0, initialFlow: null })
  })

  it('ignores non-numeric step', () => {
    setSearch('?step=abc')
    expect(getModuleDeepLink()).toEqual({ initialTab: 'learn', initialStep: 0, initialFlow: null })
  })

  it('clamps step to maxStep', () => {
    setSearch('?step=99')
    expect(getModuleDeepLink({ maxStep: 4 })).toEqual({
      initialTab: 'learn',
      initialStep: 4,
      initialFlow: null,
    })
  })

  it('allows step within bounds', () => {
    setSearch('?step=2')
    expect(getModuleDeepLink({ maxStep: 4 })).toEqual({
      initialTab: 'learn',
      initialStep: 2,
      initialFlow: null,
    })
  })

  it('accepts custom validTabs', () => {
    setSearch('?tab=simulate')
    expect(getModuleDeepLink({ validTabs: ['learn', 'workshop', 'simulate'] })).toEqual({
      initialTab: 'simulate',
      initialStep: 0,
      initialFlow: null,
    })
  })

  it('uses custom defaultTab', () => {
    const result = getModuleDeepLink({ defaultTab: 'workshop' })
    expect(result).toEqual({ initialTab: 'workshop', initialStep: 0, initialFlow: null })
  })

  it('handles step=0 explicitly', () => {
    setSearch('?step=0')
    expect(getModuleDeepLink()).toEqual({ initialTab: 'learn', initialStep: 0, initialFlow: null })
  })

  it('parses ?flow=btc', () => {
    setSearch('?flow=btc')
    expect(getModuleDeepLink()).toEqual({ initialTab: 'learn', initialStep: 0, initialFlow: 'btc' })
  })
})

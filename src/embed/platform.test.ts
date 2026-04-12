// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { detectPlatform, isNativeApp, isIframeEmbed, isEmbedContext } from './platform'

describe('platform detection', () => {
  const originalCapacitor = window.Capacitor

  beforeEach(() => {
    // Reset Capacitor global
    delete (window as unknown as Record<string, unknown>).Capacitor
  })

  afterEach(() => {
    // Restore original state
    if (originalCapacitor) {
      ;(window as unknown as Record<string, unknown>).Capacitor = originalCapacitor
    } else {
      delete (window as unknown as Record<string, unknown>).Capacitor
    }
  })

  describe('detectPlatform', () => {
    it('returns "capacitor" when Capacitor native platform is detected', () => {
      ;(window as unknown as Record<string, unknown>).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios' as const,
      }
      expect(detectPlatform()).toBe('capacitor')
    })

    it('returns "iframe" when pathname starts with /embed/', () => {
      // jsdom default pathname is '/', so mock it
      const locationSpy = vi.spyOn(window, 'location', 'get')
      locationSpy.mockReturnValue({
        ...window.location,
        pathname: '/embed/learn',
      })
      expect(detectPlatform()).toBe('iframe')
      locationSpy.mockRestore()
    })

    it('returns "none" for standard web context', () => {
      // No Capacitor, no /embed/ path (jsdom default is '/')
      expect(detectPlatform()).toBe('none')
    })

    it('returns "capacitor" over "iframe" when both are present', () => {
      ;(window as unknown as Record<string, unknown>).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'android' as const,
      }
      const locationSpy = vi.spyOn(window, 'location', 'get')
      locationSpy.mockReturnValue({
        ...window.location,
        pathname: '/embed/learn',
      })
      // Capacitor takes priority over pathname check
      expect(detectPlatform()).toBe('capacitor')
      locationSpy.mockRestore()
    })

    it('returns "none" when Capacitor exists but isNativePlatform returns false', () => {
      ;(window as unknown as Record<string, unknown>).Capacitor = {
        isNativePlatform: () => false,
        getPlatform: () => 'web' as const,
      }
      expect(detectPlatform()).toBe('none')
    })
  })

  describe('convenience functions', () => {
    it('isNativeApp returns true only for capacitor', () => {
      ;(window as unknown as Record<string, unknown>).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios' as const,
      }
      expect(isNativeApp()).toBe(true)
    })

    it('isNativeApp returns false for standard web', () => {
      expect(isNativeApp()).toBe(false)
    })

    it('isIframeEmbed returns true only for /embed/ paths', () => {
      const locationSpy = vi.spyOn(window, 'location', 'get')
      locationSpy.mockReturnValue({
        ...window.location,
        pathname: '/embed/playground',
      })
      expect(isIframeEmbed()).toBe(true)
      locationSpy.mockRestore()
    })

    it('isIframeEmbed returns false for standard paths', () => {
      expect(isIframeEmbed()).toBe(false)
    })

    it('isEmbedContext returns true for iframe', () => {
      const locationSpy = vi.spyOn(window, 'location', 'get')
      locationSpy.mockReturnValue({
        ...window.location,
        pathname: '/embed/',
      })
      expect(isEmbedContext()).toBe(true)
      locationSpy.mockRestore()
    })

    it('isEmbedContext returns true for capacitor', () => {
      ;(window as unknown as Record<string, unknown>).Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'android' as const,
      }
      expect(isEmbedContext()).toBe(true)
    })

    it('isEmbedContext returns false for standard web', () => {
      expect(isEmbedContext()).toBe(false)
    })
  })
})

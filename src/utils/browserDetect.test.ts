// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { detectBrowser } from './browserDetect'

const UA = {
  chromeDesktop:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  edgeDesktop:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  firefoxDesktop: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
  safariDesktop:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  safariIOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  chromeIOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
  edgeIOS:
    'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1',
  unknown: 'SomeBot/1.0',
}

describe('detectBrowser', () => {
  it('supports Chromium-family desktop browsers', () => {
    expect(detectBrowser(UA.chromeDesktop)).toMatchObject({ supported: true, name: 'Chromium' })
    expect(detectBrowser(UA.edgeDesktop)).toMatchObject({ supported: true, name: 'Chromium' })
  })

  it('flags desktop Firefox and Safari as unsupported with a browser-switch suggestion', () => {
    const firefox = detectBrowser(UA.firefoxDesktop)
    expect(firefox.supported).toBe(false)
    expect(firefox.isIOS).toBeFalsy()
    expect(firefox.reason).toMatch(/Chrome, Edge, or Brave/)

    const safari = detectBrowser(UA.safariDesktop)
    expect(safari.supported).toBe(false)
    expect(safari.isIOS).toBeFalsy()
    expect(safari.reason).toMatch(/Chrome, Edge, or Brave/)
  })

  it('flags iOS as unsupported REGARDLESS of which browser brand the UA reports, and never suggests switching browsers', () => {
    for (const ua of [UA.safariIOS, UA.chromeIOS, UA.edgeIOS]) {
      const result = detectBrowser(ua)
      expect(result.supported).toBe(false)
      expect(result.isIOS).toBe(true)
      expect(result.name).toBe('iOS')
      // The whole point of this branch: don't tell an iOS user to "use Chrome"
      // when Chrome-for-iOS has the exact same WebKit engine limitation.
      expect(result.reason).not.toMatch(/use Chrome|open this page in Chrome/i)
      expect(result.reason).toMatch(/desktop/i)
    }
  })

  it('falls back to the generic unknown-browser message off-platform', () => {
    const result = detectBrowser(UA.unknown)
    expect(result.supported).toBe(false)
    expect(result.name).toBe('Unknown')
  })

  it('defaults to supported when no UA string is available (SSR/early render)', () => {
    expect(detectBrowser('')).toEqual({ supported: true, name: 'Unknown' })
  })
})

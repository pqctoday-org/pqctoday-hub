// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS8b — the device-fitness resolution, driven by explicit capability matrices
 * rather than by whatever the test runner's jsdom happens to expose.
 *
 * The point of these cases is that the honest answer differs from the naive one
 * in two places: SharedArrayBuffer existing as a symbol does not mean it is
 * usable (cross-origin isolation is the other half), and a container scenario is
 * not a capability *failure* — it runs somewhere else.
 */
import { describe, it, expect } from 'vitest'
import {
  resolveCapabilities,
  toolFitness,
  unmetRequirements,
  REQUIREMENT_LABELS,
  type DeviceCapabilities,
} from './useDeviceCapabilities'
import type { BrowserSupport } from '@/utils/browserDetect'

const chromium: BrowserSupport = { supported: true, name: 'Chromium' }
const safari: BrowserSupport = { supported: false, name: 'Safari', reason: 'WebKit', isIOS: false }
const iosSafari: BrowserSupport = {
  supported: false,
  name: 'Safari',
  reason: 'WebKit',
  isIOS: true,
}

const caps = (over: Partial<Parameters<typeof resolveCapabilities>[0]> = {}) =>
  resolveCapabilities({
    hasSAB: true,
    crossOriginIsolated: true,
    hasWasm: true,
    browser: chromium,
    ...over,
  })

describe('resolveCapabilities', () => {
  it('treats an unreported deviceMemory as unknown, not as low', () => {
    // Most platforms (all of iOS) never report it. Absence must not read as
    // "constrained device" — that is how you end up hiding working tools.
    expect(caps().lowMemory).toBe(false)
    expect(caps({ deviceMemory: 1 }).lowMemory).toBe(true)
    expect(caps({ deviceMemory: 8 }).lowMemory).toBe(false)
  })

  it('carries the full browser verdict through, including the iOS flag', () => {
    expect(caps({ browser: iosSafari }).browser.isIOS).toBe(true)
    expect(caps({ browser: iosSafari }).chromium).toBe(false)
  })
})

describe('toolFitness', () => {
  it('runs a tool that declares nothing, on any device', () => {
    expect(toolFitness([], caps())).toBe('runs')
    expect(toolFitness([], caps({ hasSAB: false, crossOriginIsolated: false }))).toBe('runs')
    expect(toolFitness([], caps({ browser: safari }))).toBe('runs')
  })

  it('requires BOTH SharedArrayBuffer and cross-origin isolation for sab', () => {
    // The subtle one: the symbol can exist while the page is not isolated, and
    // the tool still cannot use it. Checking only `typeof SharedArrayBuffer`
    // would badge such a device as "runs here".
    expect(toolFitness(['sab'], caps())).toBe('runs')
    expect(toolFitness(['sab'], caps({ hasSAB: false }))).toBe('unmet')
    expect(toolFitness(['sab'], caps({ crossOriginIsolated: false }))).toBe('unmet')
  })

  it('treats threads the same way as sab', () => {
    expect(toolFitness(['threads'], caps({ crossOriginIsolated: false }))).toBe('unmet')
  })

  it('fails a chromium-gated tool on Safari and Firefox, on desktop too', () => {
    // Not a mobile concern: a desktop Safari user would otherwise be told
    // "Runs here" and then meet the ChromiumGateBanner.
    expect(toolFitness(['chromium'], caps({ browser: safari }))).toBe('unmet')
    expect(toolFitness(['chromium'], caps())).toBe('runs')
  })

  it('reports container scenarios as container, never as unmet', () => {
    // A Docker scenario is not failing a capability check — it runs elsewhere.
    // Conflating the two would show a capability error for something that has
    // no capability problem.
    expect(toolFitness(['container'], caps())).toBe('container')
    expect(toolFitness(['container'], caps({ hasSAB: false, browser: safari }))).toBe('container')
  })

  it('ignores wide-viewport until something actually measures it', () => {
    expect(toolFitness(['wide-viewport'], caps())).toBe('runs')
  })

  it('is unmet if ANY declared requirement is missing', () => {
    const vpnSim = ['sab', 'threads', 'chromium'] as const
    expect(toolFitness(vpnSim, caps())).toBe('runs')
    expect(toolFitness(vpnSim, caps({ browser: safari }))).toBe('unmet')
    expect(toolFitness(vpnSim, caps({ hasSAB: false }))).toBe('unmet')
  })
})

describe('unmetRequirements', () => {
  it('names every missing capability so the UI can explain why', () => {
    const onIosSafari: DeviceCapabilities = caps({
      hasSAB: false,
      crossOriginIsolated: false,
      browser: iosSafari,
    })
    expect(unmetRequirements(['sab', 'threads', 'chromium'], onIosSafari)).toEqual([
      'sab',
      'threads',
      'chromium',
    ])
  })

  it('returns nothing when the device is capable', () => {
    expect(unmetRequirements(['sab', 'threads', 'chromium'], caps())).toEqual([])
  })

  it('has a human-readable label for every requirement', () => {
    // A missing label would render an empty "you need " sentence.
    for (const req of ['sab', 'threads', 'wasm-simd', 'wide-viewport', 'chromium', 'container']) {
      expect(REQUIREMENT_LABELS[req as keyof typeof REQUIREMENT_LABELS]).toBeTruthy()
    }
  })
})

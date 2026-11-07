// SPDX-License-Identifier: AGPL-3.0-only
/**
 * WS8b — the device-fitness resolution, driven by explicit capability matrices
 * rather than by whatever the test runner's jsdom happens to expose.
 *
 * The point of these cases is that the honest answer differs from the naive one
 * in two places: SharedArrayBuffer existing as a symbol does not mean it is
 * usable (cross-origin isolation is the other half), and a container scenario is
 * not a capability *failure* — it runs somewhere else.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  resolveCapabilities,
  detectWasmSimd,
  useDeviceCapabilities,
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
    hasWasmSimd: true,
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

describe('WebAssembly SIMD is tested, not inferred from WebAssembly existing', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not badge a SIMD-requiring tool as runnable on WASM without SIMD', () => {
    const wasmNoSimd = caps({ hasWasm: true, hasWasmSimd: false })
    expect(wasmNoSimd.wasm).toBe(true)
    expect(wasmNoSimd.wasmSimd).toBe(false)
    expect(toolFitness(['wasm-simd'], wasmNoSimd)).toBe('unmet')
    expect(unmetRequirements(['wasm-simd'], wasmNoSimd)).toEqual(['wasm-simd'])
  })

  it('runs a SIMD-requiring tool where the SIMD probe succeeds, and not without WASM at all', () => {
    expect(toolFitness(['wasm-simd'], caps({ hasWasm: true, hasWasmSimd: true }))).toBe('runs')
    expect(toolFitness(['wasm-simd'], caps({ hasWasm: false, hasWasmSimd: true }))).toBe('unmet')
  })

  it('leaves a tool that needs only basic WASM runnable when SIMD is missing', () => {
    // A device without SIMD is still a fine WASM host; only SIMD-declaring tools are affected.
    expect(toolFitness([], caps({ hasWasmSimd: false }))).toBe('runs')
    expect(toolFitness(['sab'], caps({ hasWasmSimd: false }))).toBe('runs')
  })

  it('the probe module is a valid fixed-width SIMD module on an engine that supports SIMD', () => {
    // Guards the probe bytes themselves: a typo would make every device look SIMD-less.
    expect(detectWasmSimd()).toBe(true)
  })

  it('reports no SIMD when the engine has WebAssembly but rejects the SIMD probe', () => {
    vi.spyOn(WebAssembly, 'validate').mockReturnValue(false)
    expect(typeof WebAssembly).toBe('object')
    expect(detectWasmSimd()).toBe(false)
  })

  it('reports no SIMD when validation throws instead of answering', () => {
    vi.spyOn(WebAssembly, 'validate').mockImplementation(() => {
      throw new TypeError('unsupported')
    })
    expect(detectWasmSimd()).toBe(false)
  })

  it('the hook exposes WASM and SIMD separately on a WASM-without-SIMD device', () => {
    vi.spyOn(WebAssembly, 'validate').mockReturnValue(false)
    const { result } = renderHook(() => useDeviceCapabilities())
    expect(result.current.wasm).toBe(true)
    expect(result.current.wasmSimd).toBe(false)
    expect(toolFitness(['wasm-simd'], result.current)).toBe('unmet')
  })
})

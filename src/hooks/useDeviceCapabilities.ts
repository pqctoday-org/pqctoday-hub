// SPDX-License-Identifier: GPL-3.0-only
/**
 * One place that answers "can this device run this tool?" (WS8b, 2026-08-02).
 *
 * Before this the answer was spread across four surfaces that did not know about
 * each other:
 *
 *   1. MobilePlaygroundOps.tsx — a SharedArrayBuffer + navigator.deviceMemory
 *      probe with a four-state machine, an honest warning panel and a
 *      *Continue Anyway* escape. Correct, but per-page: it could only fire
 *      after the visitor had already chosen a tool and started loading it.
 *   2. utils/browserDetect.ts + ChromiumGateBanner — a UA-based engine gate that
 *      disables live crypto on Safari and Firefox for the strongSwan/SSH paths.
 *   3. components/ui/WasmFallback.tsx — a crossOriginIsolated gate that was
 *      never imported anywhere. Dead code that looked live.
 *   4. The catalogue itself — which declared nothing, so it could not filter or
 *      badge on any of the above.
 *
 * This hook is the shared read for (1)–(3), and `WorkshopTool.requires` is the
 * declaration side. Nothing here changes MobilePlaygroundOps' behaviour: the
 * probe still runs, the warning still appears, *Continue Anyway* still works.
 *
 * Deliberately NOT probed:
 *   - iOS memory. The platform does not expose anything trustworthy, so memory
 *     stays a *warning* and never a filter — `sab` is the only hard gate. See
 *     the risk note in the WS8 work order.
 *   - Viewport width. That belongs to the caller's own media query, not to a
 *     capability probe; a device does not stop being able to run WASM because
 *     the window is narrow.
 */
import { useMemo } from 'react'
import { detectBrowser, type BrowserSupport } from '@/utils/browserDetect'
import type { ToolRuntimeRequirement } from '@/components/Playground/workshopRegistry'

export interface DeviceCapabilities {
  /** SharedArrayBuffer is present. The hard gate for threaded WASM. */
  sab: boolean
  /** `window.crossOriginIsolated` — what makes SAB usable on GitHub Pages. */
  crossOriginIsolated: boolean
  /** WebAssembly is available at all. */
  wasm: boolean
  /** Chromium-family engine, per utils/browserDetect.ts. */
  chromium: boolean
  /** Full browser-support verdict, including the iOS-specific messaging. */
  browser: BrowserSupport
  /**
   * navigator.deviceMemory < 2 where the browser reports it. A warning signal
   * only — never used to gate or hide a tool, because most platforms (all of
   * iOS) do not report it and absence is not evidence of plenty.
   */
  lowMemory: boolean
}

/** How a tool's `requires` resolves against the current device. */
export type ToolFitness =
  /** Everything the tool declares is available. */
  | 'runs'
  /** A declared capability is missing — offer the read-only path if there is one. */
  | 'unmet'
  /** Not browser-runnable at all (`container`) — a different runtime, not a failure. */
  | 'container'

/** Pure, testable form: resolve capabilities without touching globals. */
export function resolveCapabilities(env: {
  hasSAB: boolean
  crossOriginIsolated: boolean
  hasWasm: boolean
  browser: BrowserSupport
  deviceMemory?: number
}): DeviceCapabilities {
  return {
    sab: env.hasSAB,
    crossOriginIsolated: env.crossOriginIsolated,
    wasm: env.hasWasm,
    chromium: env.browser.supported,
    browser: env.browser,
    lowMemory: env.deviceMemory !== undefined && env.deviceMemory < 2,
  }
}

/**
 * Does this device satisfy a tool's declared requirements?
 *
 * `wide-viewport` is intentionally ignored here: no tool declares it yet (no
 * real-browser measurement has been made — that is WS0's job), and treating an
 * undeclared axis as satisfied is the honest default. When measurements land,
 * this is the function that grows a viewport argument.
 */
export function toolFitness(
  requires: readonly ToolRuntimeRequirement[],
  caps: DeviceCapabilities
): ToolFitness {
  if (requires.includes('container')) return 'container'
  for (const req of requires) {
    switch (req) {
      case 'sab':
        // Both halves matter: SAB can exist as a symbol and still be unusable
        // without cross-origin isolation.
        if (!caps.sab || !caps.crossOriginIsolated) return 'unmet'
        break
      case 'threads':
        if (!caps.sab || !caps.crossOriginIsolated) return 'unmet'
        break
      case 'wasm-simd':
        if (!caps.wasm) return 'unmet'
        break
      case 'chromium':
        if (!caps.chromium) return 'unmet'
        break
      case 'wide-viewport':
      case 'container':
        break
    }
  }
  return 'runs'
}

/** Which declared requirements this device does not satisfy. */
export function unmetRequirements(
  requires: readonly ToolRuntimeRequirement[],
  caps: DeviceCapabilities
): ToolRuntimeRequirement[] {
  return requires.filter((req) => toolFitness([req], caps) === 'unmet')
}

/** Human-readable reason, for the "why can't I run this?" explanation. */
export const REQUIREMENT_LABELS: Record<ToolRuntimeRequirement, string> = {
  sab: 'SharedArrayBuffer (cross-origin isolation)',
  threads: 'WebAssembly threads',
  'wasm-simd': 'WebAssembly SIMD',
  'wide-viewport': 'a wider screen',
  chromium: 'a Chromium-based browser (Chrome, Edge, Brave, Arc)',
  container: 'the Docker sandbox runtime',
}

export function useDeviceCapabilities(): DeviceCapabilities {
  const browser = detectBrowser()
  // The UA string and these globals do not change for a tab's lifetime, so one
  // read per mount is correct — and it keeps this cheap enough to call from
  // every card in a 58-card grid.
  return useMemo(
    () =>
      resolveCapabilities({
        hasSAB: typeof SharedArrayBuffer !== 'undefined',
        crossOriginIsolated:
          typeof window !== 'undefined' && typeof window.crossOriginIsolated === 'boolean'
            ? window.crossOriginIsolated
            : false,
        hasWasm: typeof WebAssembly !== 'undefined',
        browser,
        deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
      }),
    [browser]
  )
}

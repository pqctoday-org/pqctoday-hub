// SPDX-License-Identifier: GPL-3.0-only
/**
 * Runtime browser detection for the VPN / SSH simulators.
 *
 * The strongSwan WASM + cross-Worker KEM handshake + SharedArrayBuffer
 * workers were all engineered and tested on Chromium (Chrome, Edge,
 * Brave, Opera, Arc). Safari and Firefox have divergent support for:
 *   - `SharedArrayBuffer` gating by COEP/COOP headers (works but with
 *     different quirks)
 *   - `Atomics.waitAsync`
 *   - `importScripts` inside module workers
 *   - Emscripten's MODULARIZE / ASYNCIFY runtime behaviour
 *
 * Rather than adopt a maintenance burden we can't verify, we detect
 * non-Chromium browsers and disable the live crypto buttons. The
 * panel's educational content still renders — only the buttons that
 * actually run WASM handshakes are gated.
 */

export interface BrowserSupport {
  /** True if we consider the current browser supported for live crypto. */
  supported: boolean
  /** Short label for UI ("Chromium", "Firefox", "Safari", "Unknown"). */
  name: string
  /** Per-user-agent reason shown in tooltips / banners. */
  reason?: string
}

/** Pure detection, safe to call in SSR/non-browser environments. */
export function detectBrowser(userAgent?: string): BrowserSupport {
  const ua =
    userAgent ??
    (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string'
      ? navigator.userAgent
      : '')

  if (!ua) {
    // No UA string available (SSR, early render) — default to supported so
    // the panel doesn't flash a banner before hydration; runtime re-render
    // on the client will correct any mismatch.
    return { supported: true, name: 'Unknown' }
  }

  const isChromiumLike =
    /\bChrome\//.test(ua) || /\bEdg\//.test(ua) || /\bOPR\//.test(ua) || /\bBrave\//.test(ua)
  const isFirefox = /\bFirefox\//.test(ua)
  // Safari UA contains "Safari" but also "Version/XX.Y" and *not* "Chrome".
  const isSafari = /\bSafari\//.test(ua) && !/\bChrome\//.test(ua)

  if (isChromiumLike) {
    return { supported: true, name: 'Chromium' }
  }
  if (isFirefox) {
    return {
      supported: false,
      name: 'Firefox',
      reason:
        'Firefox has divergent SharedArrayBuffer + COEP/COOP behaviour that we have not verified against the strongSwan WASM build. Please use Chrome, Edge, or Brave.',
    }
  }
  if (isSafari) {
    return {
      supported: false,
      name: 'Safari',
      reason:
        'Safari does not currently support the full COEP/COOP + Worker + WASM ASYNCIFY combination the simulator relies on. Please use Chrome, Edge, or Brave.',
    }
  }
  return {
    supported: false,
    name: 'Unknown',
    reason:
      'We could not identify a Chromium-family browser in your user agent. The simulator is verified on Chrome, Edge, and Brave.',
  }
}

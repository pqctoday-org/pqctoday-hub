// SPDX-License-Identifier: GPL-3.0-only

/**
 * Platform detection for the embed system.
 * Determines whether the SPA is running inside an iframe, a Capacitor
 * native shell, or as a standard web page. Imported by embed modules
 * to replace scattered `window.parent !== window` checks.
 */

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean
      getPlatform: () => 'ios' | 'android' | 'web'
    }
  }
}

export type EmbedPlatform = 'iframe' | 'capacitor' | 'none'
export type NativePlatform = 'ios' | 'android'

export function detectPlatform(): EmbedPlatform {
  if (window.Capacitor?.isNativePlatform()) return 'capacitor'
  if (window.location.pathname.startsWith('/embed/')) return 'iframe'
  return 'none'
}

/** Returns the specific native OS when running in Capacitor, or null on web. */
export function getNativePlatform(): NativePlatform | null {
  const p = window.Capacitor?.getPlatform()
  if (p === 'ios' || p === 'android') return p
  return null
}

export function isNativeApp(): boolean {
  return detectPlatform() === 'capacitor'
}

export function isIframeEmbed(): boolean {
  return detectPlatform() === 'iframe'
}

export function isEmbedContext(): boolean {
  return detectPlatform() !== 'none'
}

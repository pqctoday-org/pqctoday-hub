// SPDX-License-Identifier: GPL-3.0-only
import { isNativeApp } from './platform'

interface ShareOptions {
  title: string
  text?: string
  url?: string
}

/**
 * Share content using the native share sheet (Capacitor) or web share API (browser).
 * Falls through to navigator.share() if not running in Capacitor.
 *
 * Capacitor's @capacitor/share is dynamically imported via capacitorShare()
 * to avoid Vite's static import analysis (package isn't installed until the
 * Capacitor scaffold phase).
 */
export async function shareContent(options: ShareOptions): Promise<void> {
  if (isNativeApp()) {
    try {
      const shared = await capacitorShare(options)
      if (shared) return
    } catch {
      // Fall through to web share
    }
  }

  // Web fallback
  if (navigator.share) {
    await navigator.share({
      title: options.title,
      text: options.text,
      url: options.url,
    })
  }
}

/**
 * Attempt to share using Capacitor's native share plugin.
 * Returns true if share was triggered, false if plugin unavailable.
 */
async function capacitorShare(options: ShareOptions): Promise<boolean> {
  try {
    // globalThis.__capacitorShare is set by the Capacitor boot path (setupNativeBridge).
    // This avoids static import of @capacitor/share which Vite/Vitest would fail to resolve
    // when the package is not installed.
    if (typeof globalThis.__pqcCapacitorShare === 'function') {
      await globalThis.__pqcCapacitorShare(options)
      return true
    }
    return false
  } catch {
    return false
  }
}

// Type declaration for the global share function set by nativeBridge
declare global {
  var __pqcCapacitorShare: ((options: ShareOptions) => Promise<void>) | undefined
}

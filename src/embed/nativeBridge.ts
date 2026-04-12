// SPDX-License-Identifier: GPL-3.0-only
import { isNativeApp } from './platform'
import { navigateRef, currentPathRef } from './nativeNavState'

// Re-export so callers that imported from nativeBridge still compile
export { registerNavigate, updateCurrentRoute } from './nativeNavState'

/**
 * Navigate to a path. Called by native shell via:
 *   webView.evaluateJavaScript("window.pqcNavigate('/learn')")
 */
function pqcNavigate(path: string): void {
  if (!navigateRef) {
    console.warn('[PQC Bridge] Navigate called before router registered')
    return
  }
  const embedPath = path.startsWith('/embed') ? path : `/embed${path}`
  navigateRef(embedPath)
}

/**
 * Get the current route (stripped path). Called by native shell via:
 *   webView.evaluateJavaScript("window.pqcGetCurrentRoute()")
 */
function pqcGetCurrentRoute(): string {
  return currentPathRef
}

/**
 * Set up global functions and platform handlers for native shell access.
 * Only exposes globals when running in Capacitor.
 *
 * This file is ONLY dynamically imported from the Capacitor boot path in main.tsx.
 * Never statically import it — @capacitor/* dynamic imports break Vite's analysis
 * for any file in the static import graph.
 */
export function setupNativeBridge(): void {
  if (!isNativeApp()) return
  ;(window as unknown as Record<string, unknown>).pqcNavigate = pqcNavigate
  ;(window as unknown as Record<string, unknown>).pqcGetCurrentRoute = pqcGetCurrentRoute

  // Register native share function for share.ts (avoids static Capacitor import in ShareButton)
  import(/* @vite-ignore */ '@capacitor/share').then(({ Share }) => {
    globalThis.__pqcCapacitorShare = async (options: {
      title: string
      text?: string
      url?: string
    }) => {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.title,
      })
    }
  })

  // Android back button — navigate React Router history or exit app at root
  // Also flushes persistence on app background (beforeunload doesn't fire in WebViews)
  import(/* @vite-ignore */ '@capacitor/app').then(({ App }) => {
    App.addListener('backButton', () => {
      const atRoot = currentPathRef === '/' || currentPathRef === '/learn'
      if (atRoot) {
        App.exitApp()
      } else {
        window.history.back()
      }
    })

    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        window.dispatchEvent(new CustomEvent('pqc:flush-state'))
      }
    })
  })
}

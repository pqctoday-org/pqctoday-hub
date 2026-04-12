// SPDX-License-Identifier: GPL-3.0-only
import { isNativeApp } from './platform'

/**
 * Shared navigation state for the native bridge.
 *
 * Extracted into its own module so EmbedNavigationGuard can import
 * registerNavigate / updateCurrentRoute without pulling in nativeBridge.ts
 * (which has dynamic @capacitor/* imports that break Vite's static analysis).
 */

type NavigateFn = (path: string) => void

export let navigateRef: NavigateFn | null = null
export let currentPathRef: string = '/'

/**
 * Register the React Router navigate function.
 * Called once from EmbedNavigationGuard (inside BrowserRouter).
 */
export function registerNavigate(fn: NavigateFn): void {
  navigateRef = fn
}

/**
 * Update the current route path (stripped of /embed prefix).
 * Called on every React Router location change.
 */
export function updateCurrentRoute(path: string): void {
  currentPathRef = path
  // Notify native shell of route change
  if (isNativeApp() && window.Capacitor) {
    try {
      window.dispatchEvent(new CustomEvent('pqc:routeChange', { detail: { path } }))
    } catch {
      // Ignore — native listener may not be registered yet
    }
  }
}

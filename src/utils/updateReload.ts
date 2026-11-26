// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Recovery from a split file that no longer exists.
 *
 * Right after a release, a visitor can hold the previous release's page while the
 * server already has the new release. The old page then asks for a lazily loaded
 * file the new release removed, and the server answers with an HTML 404. Reloading
 * fetches the new page, which asks for files that exist.
 *
 * This module owns the single "reload once" guard for that situation, shared by
 * the `vite:preloadError` listener, the route error boundary and `lazyWithRetry`.
 * One session-scoped marker means at most one reload per failure window, so a
 * file that is missing for a reason a reload cannot fix shows the message instead
 * of looping.
 */

export const UPDATED_MESSAGE = 'The Hub was updated. Reload to get the new version.'
export const OFFLINE_MESSAGE =
  'This page is not saved on this device yet. Reconnect, then reload to open it.'

/** sessionStorage key for the marker: JSON `{ url, build, at }`. */
export const UPDATE_RELOAD_KEY = 'hub-update-reload'

/** A second reload within this window is refused; the message is shown instead. */
export const UPDATE_RELOAD_WINDOW_MS = 5 * 60 * 1000

interface Marker {
  url: string
  build: string
  at: number
}

/** Identifies the build this page was served from. */
export function currentBuildId(): string {
  if (typeof __BUILD_COMMIT__ === 'string' && __BUILD_COMMIT__) return __BUILD_COMMIT__
  if (typeof __BUILD_TIMESTAMP__ === 'string') return __BUILD_TIMESTAMP__
  return ''
}

/**
 * Browser wording for "a split file could not be loaded" (Chrome, Firefox, Safari,
 * Vite CSS). A bare "Failed to fetch" is NOT one: that is any failed network
 * request (a data file, a sample download), and a new release is not its cause.
 */
export function isStaleBuildError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const msg = message.toLowerCase()
  return (
    msg.includes('dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('unable to preload css')
  )
}

/** A failed network request that is not a split file: retrying needs a fresh page load. */
export function isNetworkFetchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  return !isStaleBuildError(error) && message.toLowerCase().includes('failed to fetch')
}

/** The URL named by a load failure, when the message carries one. */
export function failingUrlOf(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const m = message.match(/https?:\/\/[^\s"')]+/)
  return m ? m[0] : ''
}

function readMarker(): Marker | null {
  try {
    const raw = sessionStorage.getItem(UPDATE_RELOAD_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Marker>
    if (typeof parsed.at !== 'number') return { url: '', build: '', at: 0 }
    return { url: parsed.url ?? '', build: parsed.build ?? '', at: parsed.at }
  } catch {
    return null
  }
}

/** True when a reload for an update has already been made in this window. */
export function hasReloadedForUpdate(now: number = Date.now()): boolean {
  const marker = readMarker()
  return !!marker && now - marker.at < UPDATE_RELOAD_WINDOW_MS
}

/**
 * Reload the page once for a failed split-file load.
 *
 * Returns true when it started a reload. Returns false when the guard refuses (a
 * reload was already made in this window, or the marker cannot be stored, which
 * would make a loop impossible to stop) and when the browser is offline, where a
 * reload cannot fetch anything new.
 */
export function reloadOnceForUpdate(error?: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
  if (hasReloadedForUpdate()) return false
  try {
    const marker: Marker = { url: failingUrlOf(error), build: currentBuildId(), at: Date.now() }
    sessionStorage.setItem(UPDATE_RELOAD_KEY, JSON.stringify(marker))
    if (sessionStorage.getItem(UPDATE_RELOAD_KEY) === null) return false
  } catch {
    return false
  }
  window.location.reload()
  return true
}

/** A real reload of the page, asking the server for the document again. */
export function reloadPage(): void {
  window.location.reload()
}

/**
 * Listen for Vite's `vite:preloadError`, fired when a lazily loaded file (or the
 * styles it needs) cannot be fetched. The first one reloads the page; the event is
 * left alone so the original error still reaches the route error boundary, which
 * shows the message if the reload did not help.
 */
export function installPreloadErrorReload(target: Window = window): () => void {
  const onError = (event: Event) => {
    reloadOnceForUpdate((event as Event & { payload?: unknown }).payload)
  }
  target.addEventListener('vite:preloadError', onError)
  return () => target.removeEventListener('vite:preloadError', onError)
}

// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  failingUrlOf,
  hasReloadedForUpdate,
  installPreloadErrorReload,
  isNetworkFetchError,
  isStaleBuildError,
  reloadOnceForUpdate,
  UPDATE_RELOAD_KEY,
  UPDATE_RELOAD_WINDOW_MS,
} from './updateReload'

let reloads = 0

beforeEach(() => {
  sessionStorage.clear()
  reloads = 0
  Object.defineProperty(window, 'location', {
    value: { ...window.location, reload: () => reloads++ },
    writable: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const MISSING = new Error(
  'Failed to fetch dynamically imported module: https://www.pqctoday.com/assets/WorkshopOverlayHost-Bt8-dkI5.js'
)

function firePreloadError(error: Error = MISSING): Event {
  const event = new Event('vite:preloadError', { cancelable: true }) as Event & {
    payload?: unknown
  }
  event.payload = error
  window.dispatchEvent(event)
  return event
}

describe('isStaleBuildError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://x/assets/a.js',
    'error loading dynamically imported module: https://x/assets/a.js',
    'Importing a module script failed.',
    'Loading chunk 12 failed.',
    'Unable to preload CSS for /assets/a.css',
  ])('treats "%s" as a missing split file', (message) => {
    expect(isStaleBuildError(new Error(message))).toBe(true)
  })

  it('does not treat an ordinary error as one', () => {
    expect(isStaleBuildError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isStaleBuildError(undefined)).toBe(false)
  })

  it('does not treat a failed data request as a missing split file', () => {
    expect(isStaleBuildError(new TypeError('Failed to fetch'))).toBe(false)
    expect(isStaleBuildError(new Error('Failed to fetch snapshots: drafts=503'))).toBe(false)
    expect(isNetworkFetchError(new TypeError('Failed to fetch'))).toBe(true)
    expect(
      isNetworkFetchError(new Error('Failed to fetch dynamically imported module: https://x/a.js'))
    ).toBe(false)
  })

  it('reads the failing URL out of the message', () => {
    expect(failingUrlOf(MISSING)).toBe(
      'https://www.pqctoday.com/assets/WorkshopOverlayHost-Bt8-dkI5.js'
    )
    expect(failingUrlOf(new Error('nothing here'))).toBe('')
  })
})

describe('reloadOnceForUpdate', () => {
  it('reloads once and records the failing URL and build', () => {
    expect(reloadOnceForUpdate(MISSING)).toBe(true)
    expect(reloads).toBe(1)
    const marker = JSON.parse(sessionStorage.getItem(UPDATE_RELOAD_KEY) ?? '{}')
    expect(marker.url).toBe('https://www.pqctoday.com/assets/WorkshopOverlayHost-Bt8-dkI5.js')
    expect(typeof marker.at).toBe('number')
    expect('build' in marker).toBe(true)
  })

  it('refuses a second reload within the window (no loop)', () => {
    expect(reloadOnceForUpdate(MISSING)).toBe(true)
    expect(reloadOnceForUpdate(MISSING)).toBe(false)
    expect(reloadOnceForUpdate(new Error('Importing a module script failed.'))).toBe(false)
    expect(reloads).toBe(1)
    expect(hasReloadedForUpdate()).toBe(true)
  })

  it('allows another reload once the window has passed', () => {
    vi.useFakeTimers()
    expect(reloadOnceForUpdate(MISSING)).toBe(true)
    vi.advanceTimersByTime(UPDATE_RELOAD_WINDOW_MS + 1000)
    expect(hasReloadedForUpdate()).toBe(false)
    expect(reloadOnceForUpdate(MISSING)).toBe(true)
    expect(reloads).toBe(2)
  })

  it('does not reload when the marker cannot be stored (a loop could not be stopped)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(reloadOnceForUpdate(MISSING)).toBe(false)
    expect(reloads).toBe(0)
  })

  it('does not reload while offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(reloadOnceForUpdate(MISSING)).toBe(false)
    expect(reloads).toBe(0)
  })
})

describe('vite:preloadError listener', () => {
  it('reloads on the first failure and leaves the error for the boundary', () => {
    const remove = installPreloadErrorReload()
    const event = firePreloadError()
    expect(reloads).toBe(1)
    // Not prevented: Vite rethrows, so the route error boundary still sees it.
    expect(event.defaultPrevented).toBe(false)
    remove()
  })

  it('does not reload a second time after the page came back with the same failure', () => {
    const remove = installPreloadErrorReload()
    firePreloadError()
    firePreloadError()
    firePreloadError(new Error('Unable to preload CSS for /assets/x.css'))
    expect(reloads).toBe(1)
    remove()
  })

  it('stops listening once removed', () => {
    const remove = installPreloadErrorReload()
    remove()
    firePreloadError()
    expect(reloads).toBe(0)
  })
})

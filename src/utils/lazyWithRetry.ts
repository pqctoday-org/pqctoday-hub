// SPDX-License-Identifier: AGPL-3.0-only
import { lazy, type ComponentType } from 'react'
import { reloadOnceForUpdate } from './updateReload'

const RELOAD_KEY = 'chunk-reload-attempted'

function retryImport<T>(importFn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  return importFn()
    .then((result) => {
      // Only a genuine successful import clears the flag. Clearing it on
      // every page 'load' event (the previous behavior) fired on the reload
      // triggered below too, so a chunk that fails for a reason a reload
      // can't fix (not just a stale-deploy cache miss) reloaded forever —
      // reproduced 5 times in 12s against a real build before this fix.
      sessionStorage.removeItem(RELOAD_KEY)
      return result
    })
    .catch((error: unknown) => {
      if (retries <= 0) {
        // Last resort: reload page once to get fresh chunks. Guarded so this
        // fires at most once per session until an import actually succeeds —
        // a chunk that still fails after the reload throws instead of
        // looping, which reaches the ErrorBoundary.
        // The shared guard (updateReload.ts) also covers the vite:preloadError
        // listener and the route error boundary, so the three together reload
        // the page at most once per failure window.
        if (!sessionStorage.getItem(RELOAD_KEY) && reloadOnceForUpdate(error)) {
          sessionStorage.setItem(RELOAD_KEY, '1')
        }
        throw error
      }
      return new Promise<T>((resolve) =>
        setTimeout(() => resolve(retryImport(importFn, retries - 1, delay * 2)), delay)
      )
    })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(() => retryImport(importFn))
}

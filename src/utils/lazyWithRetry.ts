import { lazy, type ComponentType } from 'react'

const RELOAD_KEY = 'chunk-reload-attempted'

function retryImport<T>(importFn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  return importFn().catch((error: unknown) => {
    if (retries <= 0) {
      // Last resort: reload page once to get fresh chunks (prevents infinite loop via sessionStorage)
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, '1')
        window.location.reload()
      }
      throw error
    }
    return new Promise<T>((resolve) =>
      setTimeout(() => resolve(retryImport(importFn, retries - 1, delay * 2)), delay)
    )
  })
}

// Clear the reload flag on successful page load so future failures can trigger a reload
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    sessionStorage.removeItem(RELOAD_KEY)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(() => retryImport(importFn))
}

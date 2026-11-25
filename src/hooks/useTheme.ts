// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useSyncExternalStore } from 'react'
import { useThemeStore } from '../store/useThemeStore'

type Theme = 'dark' | 'light'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function darkQuery(): MediaQueryList | null {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(DARK_QUERY)
      : null
  } catch {
    return null
  }
}

/** The device's colour scheme; light when the browser cannot say. */
export function getSystemTheme(): Theme {
  return darkQuery()?.matches ? 'dark' : 'light'
}

function subscribeSystemTheme(onChange: () => void): () => void {
  const mq = darkQuery()
  if (!mq || typeof mq.addEventListener !== 'function') return () => {}
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

/**
 * The theme in effect: the visitor's explicit choice when they have made one,
 * otherwise the device's colour scheme (and it follows the device if that changes).
 * Read-only; `useTheme` also applies the DOM class.
 */
export function useEffectiveTheme(): Theme {
  const theme = useThemeStore((s) => s.theme)
  const hasSetPreference = useThemeStore((s) => s.hasSetPreference)
  const system = useSyncExternalStore(subscribeSystemTheme, getSystemTheme, () => 'light' as Theme)
  return hasSetPreference ? theme : system
}

export function useTheme() {
  const setTheme = useThemeStore((s) => s.setTheme)
  const effectiveTheme = useEffectiveTheme()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(effectiveTheme)
  }, [effectiveTheme])

  return { theme: effectiveTheme, setTheme }
}

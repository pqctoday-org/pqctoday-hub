// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { useThemeStore } from '../store/useThemeStore'

type Theme = 'dark' | 'light'

export function useTheme() {
  const { theme, hasSetPreference, setTheme } = useThemeStore()

  // If the user has never explicitly chosen a theme, always start in light mode.
  const effectiveTheme: Theme = hasSetPreference ? theme : 'light'

  useEffect(() => {
    const root = window.document.documentElement

    const applyTheme = (t: Theme) => {
      root.classList.remove('light', 'dark')
      root.classList.add(t)
    }

    applyTheme(effectiveTheme)
  }, [effectiveTheme])

  return { theme: effectiveTheme, setTheme }
}

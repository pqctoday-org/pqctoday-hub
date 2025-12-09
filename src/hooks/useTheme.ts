import { useEffect } from 'react'
import { useThemeStore } from '../store/useThemeStore'

type Theme = 'dark' | 'light'

export function useTheme() {
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    const root = window.document.documentElement

    const applyTheme = (t: Theme) => {
      root.classList.remove('light', 'dark')
      root.classList.add(t)
    }

    applyTheme(theme)
  }, [theme])

  return { theme, setTheme }
}

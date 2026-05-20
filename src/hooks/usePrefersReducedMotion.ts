// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'

/**
 * Returns true when the OS prefers reduced motion (prefers-reduced-motion: reduce).
 * Use to gate Framer Motion animations per ux-standard.md §S9.5.
 *
 * Usage:
 *   const reduced = usePrefersReducedMotion()
 *   <motion.div
 *     initial={{ y: reduced ? 0 : 20, opacity: 0 }}
 *     animate={{ y: 0, opacity: 1 }}
 *     transition={{ duration: reduced ? 0 : 0.3 }}
 *     layout={!reduced}
 *   />
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}

// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'

/** Tailwind's `md` breakpoint (`--breakpoint-md: 48rem`): below it is a phone. */
const BELOW_MD_QUERY = '(max-width: 767px)'

/**
 * True when the viewport is below Tailwind's `md` breakpoint (768px). For a page that has a phone
 * version and a desktop version and must not put both in the page: with CSS alone (`md:hidden` and
 * `hidden md:block`) both stay in the document, and so do both of their headings.
 * Same pattern as useIsBelowLgViewport.
 */
export function useIsBelowMdViewport(): boolean {
  const [isBelowMd, setIsBelowMd] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(BELOW_MD_QUERY).matches
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(BELOW_MD_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsBelowMd(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isBelowMd
}

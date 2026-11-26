// SPDX-License-Identifier: AGPL-3.0-only
import { createContext, useContext, useEffect, useRef, useState, type RefObject } from 'react'

/**
 * How much of its own words the desktop top bar shows, chosen from the bar's own width (not the
 * window's), because the side drawer changes how much room the bar has.
 *   0  every button shows its label
 *   1  the page's action buttons (Info, Export, Endorse, Flag, Share) show icons only
 *   2  the drawer buttons and Search show icons only too
 *   3  icons only, and the bar's two groups wrap onto a second row
 * No button is ever dropped or left behind a scroll: when the labels do not fit they go first, then
 * the bar wraps.
 */
export type TopBarDensity = 0 | 1 | 2 | 3

const TopBarDensityContext = createContext<TopBarDensity>(0)

/** The density the surrounding top bar is using (0, with all labels, outside a bar). */
export function useTopBarDensity(): TopBarDensity {
  return useContext(TopBarDensityContext)
}

export const TopBarDensityProvider = TopBarDensityContext.Provider

/** The room between the bar's groups. */
const GAP_PX = 8

/**
 * Measures the bar (`ref`: the element that holds its groups as direct children) and returns the
 * density at which its groups fit. `resetKey` changes when the buttons present change (a different
 * page), so widths measured earlier are forgotten.
 */
export function useTopBarDensityFor(
  ref: RefObject<HTMLElement | null>,
  resetKey: string
): TopBarDensity {
  const [density, setDensity] = useState<TopBarDensity>(0)
  const needed = useRef<Partial<Record<TopBarDensity, number>>>({})
  const lastKey = useRef(resetKey)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const evaluate = () => {
      if (lastKey.current !== resetKey) {
        lastKey.current = resetKey
        needed.current = {}
      }
      const groups = Array.from(el.children) as HTMLElement[]
      const natural =
        groups.reduce((sum, g) => sum + g.offsetWidth, 0) + GAP_PX * Math.max(0, groups.length - 1)
      const room = el.clientWidth
      if (density < 3) needed.current[density] = natural
      if (density < 3 && natural > room + 1) {
        setDensity((d) => (d < 3 ? ((d + 1) as TopBarDensity) : d))
        return
      }
      // More room than before: go back to the fullest density known to fit.
      for (const d of [0, 1, 2] as const) {
        if (d >= density) break
        const w = needed.current[d]
        if (w !== undefined && w <= room) {
          setDensity(d)
          return
        }
      }
      // From the wrapped stage, step back once the icon-only row fits in one line.
      if (density === 3) {
        const w = needed.current[2]
        if (w !== undefined && w <= room) setDensity(2)
      }
    }
    // The observer reports once when it starts, which is the first measurement.
    const observer = new ResizeObserver(evaluate)
    observer.observe(el)
    Array.from(el.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [ref, density, resetKey])

  return density
}

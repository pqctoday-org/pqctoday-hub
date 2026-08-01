// SPDX-License-Identifier: GPL-3.0-only
import * as React from 'react'

import { cn } from '@/lib/utils'

interface ScrollFadeContainerProps {
  children: React.ReactNode
  /** Applied to the outer `relative w-full` wrapper (use for md:hidden, pb-*, etc.) */
  className?: string
  /** Applied to the inner `overflow-x-auto` scroll div */
  scrollClassName?: string
  /** Extra attributes spread onto the inner scroll div (e.g. `role="tablist"`,
   * `data-tour`) when wrapping an existing tab bar / toolbar that already
   * carries its own semantics or hooks. */
  scrollProps?: React.HTMLAttributes<HTMLDivElement>
}

/**
 * Wraps horizontally-scrolling content and shows a right-edge fade gradient
 * whenever the content overflows. The fade disappears once the user has scrolled
 * to the end. Uses a ResizeObserver so the hint updates on viewport resize.
 *
 * Ported from the TabsList component in tabs.tsx.
 */
const ScrollFadeContainer = React.forwardRef<HTMLDivElement, ScrollFadeContainerProps>(
  ({ className, scrollClassName, scrollProps, children }, ref) => {
    const internalRef = React.useRef<HTMLDivElement>(null)
    const [showFade, setShowFade] = React.useState(false)

    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      },
      [ref]
    )

    React.useEffect(() => {
      const el = internalRef.current
      if (!el) return
      const update = () => {
        setShowFade(
          el.scrollWidth > el.clientWidth + 1 && el.scrollLeft < el.scrollWidth - el.clientWidth - 1
        )
      }
      update()
      el.addEventListener('scroll', update, { passive: true })
      const ro = new ResizeObserver(update)
      ro.observe(el)
      return () => {
        el.removeEventListener('scroll', update)
        ro.disconnect()
      }
    }, [])

    return (
      <div className={cn('relative w-full', className)}>
        <div
          ref={setRef}
          className={cn('overflow-x-auto no-scrollbar', scrollClassName)}
          {...scrollProps}
        >
          {children}
        </div>
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 h-full w-10',
            'bg-gradient-to-l from-background to-transparent',
            'transition-opacity duration-200',
            showFade ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        />
      </div>
    )
  }
)
ScrollFadeContainer.displayName = 'ScrollFadeContainer'

export { ScrollFadeContainer }

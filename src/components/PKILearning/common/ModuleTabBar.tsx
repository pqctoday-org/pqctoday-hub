// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TabsTrigger } from '@/components/ui/tabs'

interface TabItem {
  value: string
  label: string
  hasDot?: boolean
}

interface ModuleTabBarProps {
  tabs: TabItem[]
  value: string
  onValueChange: (value: string) => void
  visibleOnMobile?: number
}

/**
 * Responsive tab bar for module pages — ux-standard.md §S4.14.
 *
 * Shows the first `visibleOnMobile` tabs inline on mobile; remaining tabs
 * collapse into a ··· overflow popover. All tabs are visible on desktop.
 * When `hasDot` is true on a tab, a primary-coloured dot appears on the
 * trigger to indicate in-progress content (Workshop, Visual tabs only).
 */
export const ModuleTabBar = ({
  tabs,
  value,
  onValueChange,
  visibleOnMobile = 3,
}: ModuleTabBarProps) => {
  const [overflowOpen, setOverflowOpen] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: Event) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false)
      }
    }
    if (overflowOpen) {
      document.addEventListener('mousedown', handle)
      document.addEventListener('touchstart', handle)
    }
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [overflowOpen])

  const overflowTabs = tabs.slice(visibleOnMobile)
  const hasOverflow = overflowTabs.length > 0
  const overflowActive = overflowTabs.some((t) => t.value === value)
  const overflowHasDot = overflowTabs.some((t) => t.hasDot)

  return (
    <div className="inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground w-full">
      {tabs.map((tab, i) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className={cn('relative', i >= visibleOnMobile ? 'hidden sm:inline-flex' : 'inline-flex')}
        >
          {tab.label}
          {tab.hasDot && (
            <span
              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
          )}
        </TabsTrigger>
      ))}

      {/* Overflow trigger — mobile only */}
      {hasOverflow && (
        <div className="relative sm:hidden" ref={overflowRef}>
          <Button
            variant="ghost"
            size="sm"
            aria-label="More tabs"
            aria-expanded={overflowOpen}
            aria-haspopup="true"
            onClick={() => setOverflowOpen((v) => !v)}
            className={cn(
              'relative h-8 px-2.5 text-sm rounded-sm shrink-0',
              overflowActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            ···
            {overflowHasDot && (
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
          </Button>

          {overflowOpen && (
            <div className="absolute top-full left-0 mt-1 min-w-[140px] bg-popover border border-border rounded-lg shadow-xl z-50 p-1">
              {overflowTabs.map((tab) => (
                <Button
                  key={tab.value}
                  variant="ghost"
                  onClick={() => {
                    onValueChange(tab.value)
                    setOverflowOpen(false)
                  }}
                  className={cn(
                    'w-full justify-start text-sm px-3 py-1.5 h-auto rounded-sm',
                    tab.value === value ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {tab.label}
                  {tab.hasDot && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

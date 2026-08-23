// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  TabsTrigger,
  useTabsContext,
  handleTabListKeyDown,
  tabTriggerId,
  tabPanelId,
} from '@/components/ui/tabs'
import { useEmbeddedLearn } from '../embeddedLearnContext'

interface TabItem {
  value: string
  label: string
  hasDot?: boolean
}

// When a module is embedded in the Simulation, keep only Learn / Visual / Workshop.
const HIDE_IN_SIM = new Set(['exercises', 'references', 'tools'])

/** Tailwind's `sm` breakpoint — the exact width the inline/overflow split below
 *  uses (`hidden sm:inline-flex` on the trigger, `sm:hidden` on the ··· menu). */
const SM_UP_QUERY = '(min-width: 640px)'

const readSmUp = () =>
  typeof window === 'undefined' || typeof window.matchMedia !== 'function'
    ? true // jsdom / SSR: no layout, treat every tab as rendered
    : window.matchMedia(SM_UP_QUERY).matches

/**
 * True at or above Tailwind's `sm` breakpoint. Needed because the roving
 * tabindex has to know which triggers are actually rendered: below `sm` the
 * tabs past `visibleOnMobile` are `display:none`, so putting the single
 * tab-stop on one of them would leave the whole tab bar unreachable by keyboard.
 */
function useIsSmUp(): boolean {
  const [smUp, setSmUp] = useState(readSmUp)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(SM_UP_QUERY)
    const handler = (e: MediaQueryListEvent) => setSmUp(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return smUp
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
 *
 * Accessibility (WS7): the trigger row is a real `role="tablist"` and the
 * overflow popover is a second, vertical `role="tablist"` — the popover items
 * are the ONLY interactive element for those tabs below `sm`, so they carry
 * the same `role="tab"` / `aria-selected` / roving-focus contract as the
 * inline triggers rather than being bare buttons. The ··· disclosure button is
 * deliberately a sibling of the tablist, not a child: `tablist` may only own
 * `tab` children, so nesting a plain button inside it is an ARIA violation.
 */
export const ModuleTabBar = ({
  tabs: allTabs,
  value,
  onValueChange,
  visibleOnMobile = 3,
}: ModuleTabBarProps) => {
  const [overflowOpen, setOverflowOpen] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)
  const overflowButtonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const smUp = useIsSmUp()
  const tabsCtx = useTabsContext()
  // hide Exercises / References / Tools & Products when embedded in the simulation
  const embedded = useEmbeddedLearn()
  const tabs = embedded ? allTabs.filter((t) => !HIDE_IN_SIM.has(t.value)) : allTabs

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

  // Roving tabindex — exactly one tab stop per tablist, and never on a tab the
  // current breakpoint has hidden.
  const inlineTabs = smUp ? tabs : tabs.slice(0, visibleOnMobile)
  const inlineTabbable = inlineTabs.some((t) => t.value === value)
    ? value
    : (inlineTabs[0]?.value ?? '')
  const overflowTabbable = overflowActive ? value : (overflowTabs[0]?.value ?? '')

  // Opening the ··· menu with the keyboard should land focus inside it.
  useEffect(() => {
    if (!overflowOpen) return
    popoverRef.current?.querySelector<HTMLElement>('[role="tab"][tabindex="0"]')?.focus()
  }, [overflowOpen])

  const closeOverflow = useCallback((returnFocus: boolean) => {
    setOverflowOpen(false)
    if (returnFocus) overflowButtonRef.current?.focus()
  }, [])

  return (
    <div className="inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground w-full">
      <div
        role="tablist"
        aria-label="Module sections"
        // APG: the tablist itself is not a tab stop (the roving tabindex on the
        // tabs is), but it must be programmatically focusable — same shape as
        // InteractivePlayground.tsx's reference tablist.
        tabIndex={-1}
        className="inline-flex items-center min-w-0"
        onKeyDown={(e) => handleTabListKeyDown(e, 'horizontal')}
      >
        {tabs.map((tab, i) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            tabIndex={tab.value === inlineTabbable ? 0 : -1}
            className={cn(
              'relative',
              i >= visibleOnMobile ? 'hidden sm:inline-flex' : 'inline-flex'
            )}
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
      </div>

      {/* Overflow trigger — mobile only */}
      {hasOverflow && (
        <div className="relative sm:hidden" ref={overflowRef}>
          <Button
            ref={overflowButtonRef}
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
            <div
              ref={popoverRef}
              role="tablist"
              aria-orientation="vertical"
              aria-label="More module sections"
              tabIndex={-1}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  closeOverflow(true)
                  return
                }
                // Manual activation: arrowing should not dismiss the menu it is
                // navigating. Enter/Space on the focused item selects (native button).
                handleTabListKeyDown(e, 'vertical', false)
              }}
              className="absolute top-full left-0 mt-1 min-w-[140px] bg-popover border border-border rounded-lg shadow-xl z-50 p-1"
            >
              {overflowTabs.map((tab) => {
                const isActive = tab.value === value
                return (
                  <Button
                    key={tab.value}
                    role="tab"
                    id={tabsCtx ? `${tabTriggerId(tabsCtx.baseId, tab.value)}-more` : undefined}
                    aria-selected={isActive}
                    aria-controls={
                      tabsCtx && isActive ? tabPanelId(tabsCtx.baseId, tab.value) : undefined
                    }
                    tabIndex={tab.value === overflowTabbable ? 0 : -1}
                    data-state={isActive ? 'active' : 'inactive'}
                    variant="ghost"
                    onClick={() => {
                      onValueChange(tab.value)
                      setOverflowOpen(false)
                    }}
                    className={cn(
                      'w-full justify-start text-sm px-3 py-1.5 h-auto rounded-sm',
                      isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {tab.label}
                    {tab.hasDot && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

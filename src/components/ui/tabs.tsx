// SPDX-License-Identifier: GPL-3.0-only
import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
  /** Per-`<Tabs>` id namespace so trigger/panel ids never collide between two
   *  tab bars on the same page (e.g. a module's ModuleTabBar and a nested
   *  workshop TabsList). */
  baseId: string
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

/** Read the enclosing `<Tabs>` context. Exported so a component that renders
 *  its own tab markup (ModuleTabBar's mobile overflow popover) can produce the
 *  same ids / selected state as `TabsTrigger` does. */
const useTabsContext = () => React.useContext(TabsContext)

/** Stable, id-safe slug for a tab value. */
const tabSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')

/** id of the `role="tab"` element for `value` in the `baseId` namespace. */
const tabTriggerId = (baseId: string, value: string) => `${baseId}-tab-${tabSlug(value)}`

/** id of the `role="tabpanel"` element for `value` in the `baseId` namespace. */
const tabPanelId = (baseId: string, value: string) => `${baseId}-panel-${tabSlug(value)}`

/**
 * jsdom has no layout engine, so every element there reports zero boxes and
 * `offsetParent === null`. Use computed style instead, which jsdom does
 * implement — untailwinded elements resolve to their default display, so the
 * unit-test DOM behaves as "everything visible" while a real browser correctly
 * skips `hidden`/`sm:hidden` tabs.
 */
const isRenderedTab = (el: HTMLElement) => {
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return true
  const cs = window.getComputedStyle(el)
  return cs.display !== 'none' && cs.visibility !== 'hidden'
}

/**
 * WAI-ARIA APG roving-focus handler for a `role="tablist"` container
 * (Left/Right — or Up/Down when vertical — plus Home/End). Ported from the
 * proven implementation in `Playground/InteractivePlayground.tsx` so every tab
 * bar in the app behaves identically.
 *
 * `activate` selects between the APG's two documented modes. Automatic
 * activation (default) selects the tab focus lands on — right for a normal
 * horizontal bar. Manual activation only moves focus, leaving Enter/Space to
 * select; that is what a disclosure-menu tablist needs, since auto-selecting
 * would dismiss the very menu the user is arrowing through.
 */
function handleTabListKeyDown(
  e: React.KeyboardEvent<HTMLElement>,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  activate = true
) {
  const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
  const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
  if (e.key !== nextKey && e.key !== prevKey && e.key !== 'Home' && e.key !== 'End') return

  const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')).filter(
    (t) => !t.hasAttribute('disabled') && isRenderedTab(t)
  )
  if (tabs.length === 0) return

  const idx = tabs.findIndex((t) => t === document.activeElement)
  let next = idx
  if (e.key === nextKey) next = idx === -1 ? 0 : (idx + 1) % tabs.length
  else if (e.key === prevKey)
    next = idx === -1 ? tabs.length - 1 : (idx - 1 + tabs.length) % tabs.length
  else if (e.key === 'Home') next = 0
  else next = tabs.length - 1

  e.preventDefault()
  tabs[next].focus()
  if (activate) tabs[next].click()
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, value, onValueChange, ...props }, ref) => {
    const [stateValue, setStateValue] = React.useState(defaultValue || '')
    const currentValue = value !== undefined ? value : stateValue
    const reactId = React.useId()
    // React's useId emits ':r0:'-style ids, which are not valid CSS selectors —
    // strip the colons so the derived ids stay queryable.
    const baseId = React.useMemo(() => `tabs-${reactId.replace(/:/g, '')}`, [reactId])
    const handleValueChange = React.useCallback(
      (newValue: string) => {
        setStateValue(newValue)
        onValueChange?.(newValue)
      },
      [onValueChange]
    )

    const ctx = React.useMemo(
      () => ({ value: currentValue, onValueChange: handleValueChange, baseId }),
      [currentValue, handleValueChange, baseId]
    )

    return (
      <TabsContext.Provider value={ctx}>
        <div ref={ref} className={cn('w-full', className)} {...props} />
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, onKeyDown, ...props }, ref) => {
    const internalRef = React.useRef<HTMLDivElement>(null)
    const [showFade, setShowFade] = React.useState(false)
    const [showLeftFade, setShowLeftFade] = React.useState(false)
    // Tracks whether the tab list's content is wider than its scroll
    // container. justify-center on an overflowing flex row clamps
    // scrollLeft at 0, permanently hiding the start-side content — so we
    // only switch to justify-start in that overflow case (narrow
    // viewports / more tabs than fit). When content already fits
    // (desktop, or any page's mobile view with few tabs), this stays
    // false and rendering is unchanged.
    const [isOverflowing, setIsOverflowing] = React.useState(false)

    // Merge forwarded ref with internal ref so we can track scroll state
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
        const overflowing = el.scrollWidth > el.clientWidth + 1
        setIsOverflowing(overflowing)
        setShowFade(overflowing && el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
        setShowLeftFade(overflowing && el.scrollLeft > 1)
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
      <div className="relative w-full">
        <div
          ref={setRef}
          role="tablist"
          // Not a tab stop itself (the tabs carry the roving tabindex), but
          // programmatically focusable, matching InteractivePlayground.tsx.
          tabIndex={-1}
          onKeyDown={(e) => {
            handleTabListKeyDown(e, 'horizontal')
            onKeyDown?.(e)
          }}
          className={cn(
            'inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto no-scrollbar w-full',
            isOverflowing ? 'justify-start' : 'justify-center',
            className
          )}
          {...props}
        />
        {/* Left-edge scroll hint — mobile only, fades in once scrolled right of 0 */}
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 flex h-10 w-10 items-center justify-start bg-gradient-to-r from-muted to-transparent rounded-l-md transition-opacity duration-200 sm:hidden',
            showLeftFade ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        >
          <ChevronLeft size={14} className="text-muted-foreground" />
        </div>
        {/* Right-edge scroll hint — mobile only, fades out when scrolled to end */}
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 flex h-10 w-10 items-center justify-end bg-gradient-to-l from-muted to-transparent rounded-r-md transition-opacity duration-200 sm:hidden',
            showFade ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        >
          <ChevronRight size={14} className="text-muted-foreground" />
        </div>
      </div>
    )
  }
)
TabsList.displayName = 'TabsList'

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, onClick, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    const isActive = context?.value === value

    // Auto-derive a stable workshop selector slug from the tab value so cues
    // can target tabs without per-callsite instrumentation. Cues use either:
    //   `data-workshop-target="tab-<slug>"`  OR  `select-tab` cue with the visible name.
    const workshopSlug = `tab-${value.toLowerCase().replace(/\s+/g, '-')}`

    return (
      // eslint-disable-next-line no-restricted-syntax
      <button
        ref={ref}
        type="button"
        role="tab"
        // APG: only one tab in a tablist is in the page tab order; arrow keys
        // move between the rest (see handleTabListKeyDown). Without a Tabs
        // provider there is no selected state to rove against, so stay tabbable.
        tabIndex={context ? (isActive ? 0 : -1) : 0}
        id={context ? tabTriggerId(context.baseId, value) : undefined}
        aria-selected={isActive}
        // TabsContent unmounts inactive panels, so only the selected tab has a
        // panel to point at. axe skips aria-controls validation when
        // aria-selected="false", so the dangling-reference case never arises.
        aria-controls={context && isActive ? tabPanelId(context.baseId, value) : undefined}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap shrink-0 rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm min-h-[44px] md:min-h-0',
          className
        )}
        data-state={isActive ? 'active' : 'inactive'}
        data-workshop-target={workshopSlug}
        onClick={(e) => {
          context?.onValueChange(value)
          onClick?.(e)
        }}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    if (context?.value !== value) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={context ? tabPanelId(context.baseId, value) : undefined}
        aria-labelledby={context ? tabTriggerId(context.baseId, value) : undefined}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = 'TabsContent'

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  useTabsContext,
  handleTabListKeyDown,
  tabTriggerId,
  tabPanelId,
}

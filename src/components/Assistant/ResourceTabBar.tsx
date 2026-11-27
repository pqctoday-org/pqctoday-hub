// SPDX-License-Identifier: AGPL-3.0-only
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { COPY } from './copy'
import type { ResourceTab, ResourceTabKey } from './resourceTabs'

export interface ResourceTabBarProps {
  tabs: readonly ResourceTab[]
  selected: ResourceTabKey
  onSelect: (key: ResourceTabKey) => void
  /** The id of the stepper panel the tabs control. */
  panelId: string
  /** Builds the id of a tab, so the panel can name the tab that labels it. */
  tabId: (key: ResourceTabKey) => string
  /** The phone: smaller tabs, and no name of the selected type at the end of the row. */
  compact?: boolean
}

/**
 * The resource types of an answer as icons with counts. The name of a type is in the tooltip, the
 * accessible name and the stepper's footer. Left and Right move and select, Home and End go to the
 * first and last tab, and focus stays on the tab.
 */
export function ResourceTabBar({
  tabs,
  selected,
  onSelect,
  panelId,
  tabId,
  compact = false,
}: ResourceTabBarProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const selectedTab = tabs.find((t) => t.key === selected) ?? tabs[0]

  const move = (to: number) => {
    const target = tabs[(to + tabs.length) % tabs.length]
    if (!target) return
    onSelect(target.key)
    refs.current[target.key]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') move(index + 1)
    else if (e.key === 'ArrowLeft') move(index - 1)
    else if (e.key === 'Home') move(0)
    else if (e.key === 'End') move(tabs.length - 1)
    else return
    e.preventDefault()
  }

  return (
    <div className="flex items-center gap-2">
      <div
        role="tablist"
        aria-label={COPY.resourceTypes}
        className={cn('flex min-w-0 flex-wrap items-center', compact ? 'gap-[3px]' : 'gap-1.5')}
      >
        {tabs.map((tab, i) => {
          const Icon = tab.icon
          const isSelected = tab.key === selectedTab?.key
          const edge =
            i === 0 ? 'left-0' : i === tabs.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'
          return (
            // eslint-disable-next-line no-restricted-syntax -- a tab with its own roving tabindex and a tooltip child, as ui/tabs.tsx
            <button
              key={tab.key}
              ref={(el) => {
                refs.current[tab.key] = el
              }}
              type="button"
              role="tab"
              id={tabId(tab.key)}
              aria-selected={isSelected}
              aria-controls={panelId}
              aria-label={COPY.tabAria(tab.label, tab.rows.length)}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelect(tab.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'group relative inline-flex min-h-[36px] items-center justify-center gap-1 rounded-xl text-xs font-bold text-card-foreground',
                'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid',
                compact ? 'min-w-[34px] gap-0.5 px-1' : 'min-w-[40px] px-2',
                isSelected
                  ? 'border-2 border-highlight-border bg-highlight text-heading'
                  : 'border border-border bg-card'
              )}
            >
              <Icon size={compact ? 15 : 17} aria-hidden="true" />
              <span aria-hidden="true">{tab.rows.length}</span>
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute bottom-full z-20 mb-1 whitespace-nowrap rounded-lg border-2 border-ink bg-card px-2 py-1 text-xs font-bold text-card-foreground opacity-0 transition-opacity group-focus-visible:opacity-100',
                  // A phone has no hover; the name still shows on keyboard focus.
                  compact ? '' : 'group-hover:opacity-100',
                  edge
                )}
              >
                {COPY.tabTip(tab.label, tab.rows.length)}
              </span>
            </button>
          )
        })}
      </div>
      {!compact && selectedTab && (
        <span className="ml-auto shrink-0 text-xs font-bold text-heading">{selectedTab.label}</span>
      )}
    </div>
  )
}

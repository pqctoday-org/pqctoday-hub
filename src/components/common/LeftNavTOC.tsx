// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

export interface LeftNavTOCItem {
  id: string
  label: string
  /** Optional secondary line (e.g. country flag, criticality, vendor) */
  hint?: string
}

export interface LeftNavTOCGroup {
  /** Stable group id; appears in `data-workshop-target="<targetPrefix>-group-<id>"`. */
  id: string
  label: string
  items: LeftNavTOCItem[]
}

interface LeftNavTOCProps {
  /** Groups of items. If only one group, label is hidden. */
  groups: LeftNavTOCGroup[]
  /** Currently-highlighted item id (single-select). */
  activeItemId: string | null
  /** Click handler — receives the item id. */
  onSelect: (itemId: string) => void
  /**
   * Slug prefix used for `data-workshop-target` on each item.
   * Convention: `<page>-toc` (e.g. `threats-toc`, `timeline-toc`).
   * Each item button gets `data-workshop-target="<targetPrefix>-<itemId>"`.
   */
  targetPrefix: string
  /** Optional title shown at the top of the rail. */
  title?: string
  /** Optional accessible name for the nav region. Defaults to title or "Page contents". */
  ariaLabel?: string
  /** Empty-state message when groups have no items (e.g. all filtered out). */
  emptyMessage?: string
  className?: string
}

/**
 * Left-rail table of contents shared by `/threats`, `/timeline`, `/compliance`,
 * `/migrate`, and `/about`. Filter-independent (reflects whatever the page
 * passes in). Workshop cues target each item via the auto-derived
 * `data-workshop-target` attribute, so cue selectors stay stable across
 * Tailwind / refactor churn.
 */
export const LeftNavTOC: React.FC<LeftNavTOCProps> = ({
  groups,
  activeItemId,
  onSelect,
  targetPrefix,
  title,
  ariaLabel,
  emptyMessage = 'No items match the current filters.',
  className,
}) => {
  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0)
  const hasGroupLabels = groups.length > 1

  return (
    <nav
      aria-label={ariaLabel ?? title ?? 'Page contents'}
      className={`flex flex-col gap-3 ${className ?? ''}`}
      data-workshop-target={`${targetPrefix}-rail`}
    >
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
          {title}
        </h3>
      )}

      {totalItems === 0 ? (
        <p className="text-xs text-muted-foreground px-2 py-1">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="space-y-1">
              {hasGroupLabels && (
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2"
                  data-workshop-target={`${targetPrefix}-group-${group.id}`}
                >
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeItemId === item.id
                  return (
                    <li key={item.id}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelect(item.id)}
                        aria-current={isActive ? 'true' : undefined}
                        data-workshop-target={`${targetPrefix}-${item.id}`}
                        className={`w-full h-auto justify-start px-2 py-1.5 rounded-md font-normal text-left whitespace-normal items-start ${
                          isActive
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0 w-full">
                          <span
                            className={`block w-1 h-4 rounded-full shrink-0 transition-colors ${
                              isActive ? 'bg-primary' : 'bg-transparent'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs leading-tight">{item.label}</span>
                            {item.hint && (
                              <span className="block text-[10px] text-muted-foreground/80 mt-0.5">
                                {item.hint}
                              </span>
                            )}
                          </span>
                        </span>
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </nav>
  )
}

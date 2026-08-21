// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OptionTileProps {
  id: string
  label: string
  description?: string
  selected: boolean
  onSelect: (id: string) => void
  icon?: React.ReactNode
  className?: string
}

/**
 * Reusable card-style option tile for Business Center tool pickers
 * (policy type, artifact type, template type, etc.). Uses the `tile`
 * Button size variant so a block-layout multi-line label + description
 * renders correctly without the `whitespace-nowrap` base from Button.
 */
export const OptionTile: React.FC<OptionTileProps> = ({
  id,
  label,
  description,
  selected,
  onSelect,
  icon,
  className,
}) => (
  <Button
    variant="ghost"
    size="tile"
    onClick={() => onSelect(id)}
    aria-pressed={selected}
    className={cn(
      'border',
      selected
        ? 'border-primary bg-primary/10 text-foreground'
        : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground',
      className
    )}
  >
    <div className="flex items-center gap-2 w-full">
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </div>
    {/* a11y (WS14, 2026-08-21): the description used to carry `opacity-70`. On the
        unselected tile the inherited colour is already `text-muted-foreground`, so
        dimming it a second time rendered 12px text at #7e8894 on #f6f9fb — 3.4:1,
        below WCAG AA's 4.5:1 (axe `color-contrast`, serious, 3 nodes on
        /business/tools/policy-generator). Dropping the extra opacity leaves the
        semantic token to do the job and measures ~6.9:1. */}
    {description && <p className="text-xs leading-snug break-words">{description}</p>}
  </Button>
)

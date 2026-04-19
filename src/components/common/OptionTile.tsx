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
    {description && <p className="text-xs leading-snug opacity-70 break-words">{description}</p>}
  </Button>
)

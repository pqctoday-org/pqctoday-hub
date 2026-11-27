// SPDX-License-Identifier: AGPL-3.0-only
import { Chip as ToggleChip } from '@/components/storybook'
import { cn } from '@/lib/utils'

export interface FacetPillProps {
  label: string
  /** Whether this facet is on. A facet pill is always a toggle: it is never a plain button. */
  pressed: boolean
  onToggle: (next: boolean) => void
  /** How many records it would show, written after the label: "High 12". */
  count?: number
  className?: string
}

/**
 * A filter facet (handoff 2.2): a toggle button with `aria-pressed`, never a Button. It reuses the
 * shared interactive chip (2 px ink outline, selected fill) and grows to 44 px on phones.
 */
export function FacetPill({ label, pressed, onToggle, count, className }: FacetPillProps) {
  return (
    <ToggleChip
      pressed={pressed}
      onClick={() => onToggle(!pressed)}
      className={cn('max-md:min-h-[44px]', className)}
    >
      {label}
      {count !== undefined && (
        <span className="font-semibold opacity-80" data-facet-count>
          {count}
        </span>
      )}
    </ToggleChip>
  )
}

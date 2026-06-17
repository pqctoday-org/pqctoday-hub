// SPDX-License-Identifier: GPL-3.0-only
import { Layers, LayoutGrid, Network, Route, Table } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'

export type LearnViewMode = 'path' | 'stack' | 'cards' | 'table' | 'nice'

interface LearnViewToggleProps {
  mode: LearnViewMode
  onChange: (mode: LearnViewMode) => void
  /** Hide the 'path' option when no persona is active (path mode requires a persona). */
  pathAvailable?: boolean
}

// NOTE: the 'path' view mode shows the learner's persona-curated journey. Its
// label is "Journey" (not "Path") to avoid colliding with the Track filter,
// whose options are also called "Paths" ("All Paths"). The internal value stays
// 'path' so persisted view-mode preferences keep working.
const OPTIONS: { value: LearnViewMode; label: string; icon: typeof Layers }[] = [
  { value: 'path', label: 'Journey', icon: Route },
  { value: 'stack', label: 'Stack', icon: Layers },
  { value: 'cards', label: 'Cards', icon: LayoutGrid },
  { value: 'table', label: 'Table', icon: Table },
  { value: 'nice', label: 'NICE', icon: Network },
]

export const LearnViewToggle = ({ mode, onChange, pathAvailable = true }: LearnViewToggleProps) => {
  const options = pathAvailable ? OPTIONS : OPTIONS.filter((o) => o.value !== 'path')
  return (
    <div
      className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border"
      role="radiogroup"
      aria-label="View mode"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <Button
          variant="ghost"
          key={value}
          onClick={() => onChange(value)}
          role="radio"
          aria-checked={mode === value}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
            mode === value
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-muted-foreground hover:text-foreground border border-transparent'
          )}
        >
          <Icon size={14} aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  )
}

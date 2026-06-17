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

// The radiogroup is the set of co-equal ways to BROWSE the module catalog.
// NOTE: the 'path' view mode shows the learner's persona-curated journey. Its
// label is "Journey" (not "Path") to avoid colliding with the Track filter,
// whose options are also called "Paths" ("All Paths"). The internal value stays
// 'path' so persisted view-mode preferences keep working.
//
// NICE is deliberately NOT in this radiogroup (A3): it's a workforce-framework
// LENS (grouped by competency area), not a peer browse mode — it's a separate
// toggle button rendered alongside. The grouped NiceView + the ?view=nice
// deep-link are preserved; 'nice' is still a valid LearnViewMode.
const OPTIONS: { value: LearnViewMode; label: string; icon: typeof Layers }[] = [
  { value: 'path', label: 'Journey', icon: Route },
  { value: 'stack', label: 'Stack', icon: Layers },
  { value: 'cards', label: 'Cards', icon: LayoutGrid },
  { value: 'table', label: 'Table', icon: Table },
]

export const LearnViewToggle = ({ mode, onChange, pathAvailable = true }: LearnViewToggleProps) => {
  const options = pathAvailable ? OPTIONS : OPTIONS.filter((o) => o.value !== 'path')
  const niceActive = mode === 'nice'
  return (
    <div className="flex items-center gap-1.5">
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
      {/* NICE workforce lens — a separate toggle, not a peer browse mode. Click to
          enter the grouped competency-area view; click again to return to the
          persona's default browse mode. */}
      <Button
        variant="ghost"
        type="button"
        onClick={() => onChange(niceActive ? (pathAvailable ? 'path' : 'stack') : 'nice')}
        aria-pressed={niceActive}
        title="View modules grouped by NICE workforce competency area"
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
          niceActive
            ? 'bg-primary/10 text-primary border-primary/30'
            : 'bg-muted/30 text-muted-foreground hover:text-foreground border-border'
        )}
      >
        <Network size={14} aria-hidden="true" />
        <span className="hidden sm:inline">NICE roles</span>
      </Button>
    </div>
  )
}

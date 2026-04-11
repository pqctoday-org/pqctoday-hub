// SPDX-License-Identifier: GPL-3.0-only
import { LayoutGrid, Table } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'

export type ViewMode = 'cards' | 'table'

interface ViewToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export const ViewToggle = ({ mode, onChange }: ViewToggleProps) => {
  return (
    <div
      className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border"
      role="radiogroup"
      aria-label="View mode"
    >
      <Button
        variant="ghost"
        onClick={() => onChange('cards')}
        role="radio"
        aria-checked={mode === 'cards'}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
          mode === 'cards'
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'text-muted-foreground hover:text-foreground border border-transparent'
        )}
      >
        <LayoutGrid size={14} aria-hidden="true" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant="ghost"
        onClick={() => onChange('table')}
        role="radio"
        aria-checked={mode === 'table'}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
          mode === 'table'
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'text-muted-foreground hover:text-foreground border border-transparent'
        )}
      >
        <Table size={14} aria-hidden="true" />
        <span className="hidden sm:inline">Table</span>
      </Button>
    </div>
  )
}

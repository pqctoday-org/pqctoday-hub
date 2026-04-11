// SPDX-License-Identifier: GPL-3.0-only
import { Layers, LayoutGrid, Table, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import type { MigrateViewMode } from '../../store/useMigrateSelectionStore'
import { Button } from '@/components/ui/button'

interface MigrateViewToggleProps {
  mode: MigrateViewMode
  onChange: (mode: MigrateViewMode) => void
}

const OPTIONS: { value: MigrateViewMode; label: string; icon: typeof Layers }[] = [
  { value: 'stack', label: 'Layer Stack', icon: Layers },
  { value: 'cisaStack', label: 'CISA Stack', icon: ShieldAlert },
  { value: 'cards', label: 'Cards', icon: LayoutGrid },
  { value: 'table', label: 'Table', icon: Table },
]

export const MigrateViewToggle = ({ mode, onChange }: MigrateViewToggleProps) => {
  return (
    <div
      className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border"
      role="radiogroup"
      aria-label="View mode"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
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

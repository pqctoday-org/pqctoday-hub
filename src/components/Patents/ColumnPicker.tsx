// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect } from 'react'
import { Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ALL_COLUMN_IDS, COLUMN_LABELS, type PresetKey, type ColumnId } from './patentColumns'

const PRESET_LABELS: Record<PresetKey, string> = {
  essential: 'Essential',
  algorithms: 'Algorithms',
  full: 'Full',
}

interface ColumnPickerProps {
  preset: PresetKey | 'custom'
  visibleColumns: ColumnId[]
  onPresetChange: (preset: PresetKey) => void
  onColumnsChange: (columns: ColumnId[]) => void
}

export function ColumnPicker({
  preset,
  visibleColumns,
  onPresetChange,
  onColumnsChange,
}: ColumnPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const activeLabel = preset === 'custom' ? 'Custom' : PRESET_LABELS[preset]

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-label="Column picker"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="h-7 inline-flex items-center gap-1 rounded border border-border px-2 text-xs text-muted-foreground hover:text-foreground hover:border-input hover:bg-transparent transition-colors"
      >
        <Columns3 className="h-3 w-3" />
        {activeLabel}
      </Button>

      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 w-56 rounded-lg border border-border bg-card shadow-lg">
          <div className="px-2 pt-2 pb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
              Presets
            </p>
            <div className="flex gap-1">
              {(['essential', 'algorithms', 'full'] as PresetKey[]).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={preset === p ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    onPresetChange(p)
                    setOpen(false)
                  }}
                  className="flex-1 h-7 text-[11px] px-1"
                >
                  {PRESET_LABELS[p]}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-border px-2 pt-1.5 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 px-1">
              Columns
            </p>
            <div className="max-h-52 overflow-auto space-y-0.5">
              {ALL_COLUMN_IDS.map((id) => {
                const checked = visibleColumns.includes(id)
                return (
                  <label
                    key={id}
                    className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted/50 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onColumnsChange(
                          checked ? visibleColumns.filter((c) => c !== id) : [...visibleColumns, id]
                        )
                      }
                      className="rounded border-border accent-primary h-3 w-3"
                    />
                    <span className="text-xs text-foreground">{COLUMN_LABELS[id]}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

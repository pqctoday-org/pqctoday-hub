// SPDX-License-Identifier: GPL-3.0-only
import { X, Scale, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AlgorithmCompareBarProps {
  compareKeys: string[]
  baselineName: string | null
  onRemove: (key: string) => void
  onClearAll: () => void
  onCompare: () => void
}

const MAX = 3

export function AlgorithmCompareBar({
  compareKeys,
  baselineName,
  onRemove,
  onClearAll,
  onCompare,
}: AlgorithmCompareBarProps) {
  if (compareKeys.length === 0) return null

  const canCompare = compareKeys.length >= 2

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[var(--z-index-panel)] bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <Scale size={15} className="text-secondary hidden sm:block" />
          <span className="text-sm font-medium text-foreground hidden sm:block">Compare:</span>

          {/* Baseline chip (locked) */}
          {baselineName && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs bg-muted text-foreground border border-primary/50 rounded-full px-2 sm:px-2.5 py-0.5 whitespace-nowrap">
              <span className="font-semibold text-primary uppercase hidden sm:inline">Baseline</span>
              <span className="font-semibold text-primary uppercase sm:hidden">Base</span>
              <span className="truncate max-w-[80px] sm:max-w-[100px]">{baselineName}</span>
            </span>
          )}

          {/* User-selected chips */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {compareKeys.map((name) => (
              <span
                key={name}
                className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs bg-secondary/10 text-foreground border border-secondary/20 rounded-full pl-2 pr-1 py-0.5 whitespace-nowrap"
              >
                <span className="truncate max-w-[70px] sm:max-w-[120px]">{name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(name)}
                  aria-label={`Remove ${name} from comparison`}
                  className="text-muted-foreground hover:text-foreground shrink-0 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {Array.from({ length: MAX - compareKeys.length }).map((_, i) => (
              <span
                key={`slot-${i}`}
                className="text-[10px] sm:text-xs text-muted-foreground/60 border border-dashed border-border rounded-full px-2 sm:px-3 py-0.5 select-none whitespace-nowrap"
              >
                + add
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto pl-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
          >
            Clear
          </Button>
          <Button
            variant="gradient"
            size="sm"
            disabled={!canCompare}
            onClick={onCompare}
            className="gap-1.5 h-7 sm:h-8 px-2.5 sm:px-4 text-[11px] sm:text-sm font-medium"
          >
            <ArrowRightLeft size={12} className="sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Compare ({compareKeys.length})</span>
            <span className="sm:hidden">Compare</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

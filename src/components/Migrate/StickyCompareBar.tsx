// SPDX-License-Identifier: GPL-3.0-only
import { X, Scale, ArrowRightLeft, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsEmbedded } from '@/embed/EmbedProvider'

interface StickyCompareBarProps {
  compareKeys: string[]
  onRemove: (key: string) => void
  onClearAll: () => void
  onCompare: () => void
  /** Show "Switch to Table view" hint when in stack+All mode */
  showBrowseHint?: boolean
  onBrowseAll?: () => void
}

export function StickyCompareBar({
  compareKeys,
  onRemove,
  onClearAll,
  onCompare,
  showBrowseHint,
  onBrowseAll,
}: StickyCompareBarProps) {
  const isEmbedded = useIsEmbedded()
  if (compareKeys.length === 0) return null

  const MAX = 3
  const canCompare = compareKeys.length >= 2

  return (
    <div
      className={`${isEmbedded ? 'absolute' : 'fixed'} bottom-0 left-0 right-0 z-[var(--z-index-panel)] bg-card border-t border-border shadow-lg pb-[env(safe-area-inset-bottom)]`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <Scale size={15} className="text-secondary shrink-0" />
        <span className="text-sm font-medium text-foreground shrink-0">Compare:</span>

        {/* Product chips */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {compareKeys.map((key) => {
            const [name] = key.split('::')
            return (
              <span
                key={key}
                className="flex items-center gap-1 text-xs bg-secondary/10 text-foreground border border-secondary/20 rounded-full px-2.5 py-0.5"
              >
                <span className="truncate max-w-[120px]">{name}</span>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => onRemove(key)}
                  aria-label={`Remove ${name} from comparison`}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X size={10} />
                </Button>
              </span>
            )
          })}
          {Array.from({ length: MAX - compareKeys.length }).map((_, i) => (
            <span
              key={`slot-${i}`}
              className="text-xs text-muted-foreground border border-dashed border-border rounded-full px-3 py-0.5 select-none"
            >
              + add
            </span>
          ))}
        </div>

        {/* Browse hint */}
        {showBrowseHint && onBrowseAll && compareKeys.length < MAX && (
          <Button
            variant="ghost"
            type="button"
            onClick={onBrowseAll}
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <Table size={12} />
            Browse all products
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground shrink-0"
        >
          Clear
        </Button>
        <Button
          variant="gradient"
          size="sm"
          disabled={!canCompare}
          onClick={onCompare}
          className="gap-1.5 shrink-0"
        >
          <ArrowRightLeft size={14} />
          Compare ({compareKeys.length})
        </Button>
      </div>
    </div>
  )
}

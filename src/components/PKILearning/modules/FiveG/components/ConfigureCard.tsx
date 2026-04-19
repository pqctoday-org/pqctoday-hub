// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Settings2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'suci.configureCard.expanded'

export interface ConfigureCardProps {
  /** True on first visit (no URL params). Drives default collapsed state. */
  isFirstVisit: boolean
  /** One-line summary shown next to the expand toggle. */
  summary: React.ReactNode
  /** Primary CTA to start the wizard with current defaults. */
  onStart?: () => void
  /** The full control surface — rendered when expanded. */
  children: React.ReactNode
}

/**
 * Wraps the SUCI landing controls in a collapsed/expanded card.
 * First-visit users see the summary + "Start with defaults" button only;
 * clicking "Customize…" expands to the full control surface. Subsequent
 * visits (URL carries ?profile=… or sessionStorage remembers prior expand)
 * open expanded.
 */
export const ConfigureCard: React.FC<ConfigureCardProps> = ({
  isFirstVisit,
  summary,
  onStart,
  children,
}) => {
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (!isFirstVisit) return true
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, expanded ? '1' : '0')
    } catch {
      // ignore: private mode / storage disabled
    }
  }, [expanded])

  return (
    <div className="glass-panel border border-border rounded-xl overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Settings2 size={16} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0 text-sm text-foreground/90 truncate">{summary}</div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!expanded && onStart && (
            <Button variant="default" onClick={onStart} className="h-8 gap-1.5 text-xs">
              <Play size={12} />
              Start with defaults
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            {expanded ? (
              <>
                <ChevronDown size={14} />
                Hide
              </>
            ) : (
              <>
                <ChevronRight size={14} />
                Customize…
              </>
            )}
          </Button>
        </div>
      </div>

      {expanded && <div className="border-t border-border p-4 space-y-4">{children}</div>}
    </div>
  )
}

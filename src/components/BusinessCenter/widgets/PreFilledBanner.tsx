// SPDX-License-Identifier: GPL-3.0-only
/**
 * Inline banner shown at the top of an artifact builder when its initial
 * values were pre-filled from the user's assessment data. Lets the user know
 * the source and gives them a one-click way to clear those values.
 */
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface PreFilledBannerProps {
  /** Short summary of what was pre-filled (e.g., "3 algorithms from your assessment"). */
  summary: string
  /** Called when the user clicks "Clear all" — builder should reset its state. */
  onClear: () => void
  /** Optional dense variant for builders with tight headers. */
  dense?: boolean
}

export function PreFilledBanner({ summary, onClear, dense = false }: PreFilledBannerProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 ${
        dense ? 'p-2' : 'p-3'
      }`}
      role="status"
    >
      <Sparkles size={dense ? 14 : 16} className="text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground">
          <span className="font-semibold">Pre-filled from your assessment.</span> {summary}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onClear} className="shrink-0 h-7 px-2 text-xs">
        Clear all
      </Button>
    </div>
  )
}

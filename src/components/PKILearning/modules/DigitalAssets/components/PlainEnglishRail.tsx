// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Lightbulb } from 'lucide-react'

export interface PlainEnglishRailProps {
  bullets?: string[]
  enabled: boolean
}

/**
 * Side rail that explains what just happened in plain English.
 * Sits beside the terminal output; never edits the terminal itself.
 * Renders nothing when disabled or when the step has no bullets.
 */
export const PlainEnglishRail: React.FC<PlainEnglishRailProps> = ({ bullets, enabled }) => {
  if (!enabled || !bullets || bullets.length === 0) return null

  return (
    <aside
      aria-label="What just happened in plain English"
      className="lg:w-[280px] lg:shrink-0 glass-panel border border-border rounded-xl p-3 text-xs"
    >
      <div className="flex items-center gap-1.5 mb-2 text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">
        <Lightbulb size={12} className="text-primary" />
        What just happened
      </div>
      <ol className="space-y-1.5 list-decimal list-inside marker:text-primary marker:font-semibold">
        {bullets.map((b, i) => (
          <li key={i} className="leading-snug text-foreground/90">
            {b}
          </li>
        ))}
      </ol>
    </aside>
  )
}

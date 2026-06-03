// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { Atom, X } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { WORKSHOP_TOOLS } from './workshopRegistry'

interface ToolTaxonomyFilterProps {
  selectedAlgorithm: string | null
  onChange: (algorithm: string | null) => void
}

// Curated list of "interesting" algorithm tags for researcher browsing.
// We surface the most-common tags so the filter doesn't drown the user in
// 60+ chips. Anything tagged on ≥2 tools is eligible; below that it's a
// long-tail filter that's better served by free-text search.
function deriveAlgorithmTags(): string[] {
  const counts = new Map<string, number>()
  for (const tool of WORKSHOP_TOOLS) {
    for (const algo of tool.algorithms) {
      const key = algo.trim()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k]) => k)
}

export const ToolTaxonomyFilter: React.FC<ToolTaxonomyFilterProps> = ({
  selectedAlgorithm,
  onChange,
}) => {
  const tags = useMemo(() => deriveAlgorithmTags(), [])

  return (
    <div className="glass-panel p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Atom size={14} className="text-primary shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground">Browse by Algorithm</span>
        <span className="hidden sm:inline text-xs text-muted-foreground">
          — narrow tools by primitive
        </span>
        {selectedAlgorithm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <X size={11} aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const isActive = selectedAlgorithm === tag
          return (
            <Button
              key={tag}
              variant="ghost"
              size="sm"
              onClick={() => onChange(isActive ? null : tag)}
              className={clsx(
                'text-xs rounded-full px-2.5 py-1 h-auto border transition-all',
                isActive
                  ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                  : 'text-muted-foreground border-border hover:text-foreground'
              )}
              aria-pressed={isActive}
            >
              {tag}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

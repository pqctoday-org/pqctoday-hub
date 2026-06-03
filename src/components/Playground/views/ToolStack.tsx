// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Mail } from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { CATEGORIES, type WorkshopTool } from '../workshopRegistry'
import { ToolCard } from './ToolCard'

interface ToolStackProps {
  tools: WorkshopTool[]
  /** Tools-set baseline used for "N hidden · Restore" counts (pre-filter total per category). */
  baselineTools: WorkshopTool[]
  onClearFilters?: () => void
}

const SandboxAccessNote: React.FC = () => (
  <div className="text-xs text-muted-foreground bg-primary/5 border border-primary/15 rounded-lg p-3 flex items-start gap-2 mb-3">
    <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
    <span>
      Sandbox scenarios run in isolated Docker containers — request access at{' '}
      <a
        href="mailto:pqctoday@gmail.com?subject=Sandbox%20Access%20Request"
        className="text-primary hover:underline"
      >
        pqctoday@gmail.com
      </a>
      .
    </span>
  </div>
)

export const ToolStack: React.FC<ToolStackProps> = ({ tools, baselineTools, onClearFilters }) => {
  const reduced = usePrefersReducedMotion()
  // Auto-expand categories that have at least one filtered tool. Categories with
  // zero matches start collapsed (showing "N hidden · Restore" prompt).
  const initialExpanded = useMemo(() => {
    const s = new Set<string>()
    for (const cat of CATEGORIES) {
      if (tools.some((t) => t.category === cat)) s.add(cat)
    }
    return s
  }, [tools])
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded)

  const toggle = (cat: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })

  return (
    <div className="space-y-2">
      {CATEGORIES.map((cat) => {
        const inCat = tools.filter((t) => t.category === cat)
        const baseInCat = baselineTools.filter((t) => t.category === cat)
        const filteredCount = inCat.length
        const totalCount = baseInCat.length
        if (totalCount === 0) return null
        const isOpen = expanded.has(cat)
        const isHidden = filteredCount === 0

        return (
          <div
            key={cat}
            className={clsx(
              'rounded-xl border transition-colors',
              isHidden ? 'border-border/40 bg-muted/10' : 'border-border bg-card'
            )}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggle(cat)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(cat)
                }
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <ChevronDown
                  size={16}
                  className="text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <ChevronRight
                  size={16}
                  className="text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
              )}
              <h4
                className={clsx(
                  'font-semibold text-sm flex-1 min-w-0',
                  isHidden ? 'text-muted-foreground/60' : 'text-foreground'
                )}
              >
                {cat}
              </h4>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {filteredCount < totalCount ? `${filteredCount} / ${totalCount}` : `${totalCount}`}
              </span>
              {filteredCount < totalCount && onClearFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearFilters()
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/30 hover:bg-status-warning/20 tabular-nums"
                >
                  {totalCount - filteredCount} hidden · Restore
                </Button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {isOpen && filteredCount > 0 && (
                <motion.div
                  initial={{ height: reduced ? 'auto' : 0, opacity: reduced ? 1 : 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: reduced ? 'auto' : 0, opacity: reduced ? 1 : 0 }}
                  transition={{ duration: reduced ? 0 : 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t border-border/40">
                    {cat === 'Sandbox' && <SandboxAccessNote />}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {inCat.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.1 (2026-09-19) — "Related content" for playground and
 * business tools, from `src/data/toolRelations.ts`. Same slot and shape as
 * the modules' RelatedModulesPanel: rendered unconditionally, nothing when
 * there is nothing to show.
 */
import { Link } from 'react-router'
import { Network, ArrowRight } from 'lucide-react'
import type { RelatedEntry } from '@/data/toolRelations'

interface RelatedContentPanelProps {
  id: string
  entries: RelatedEntry[]
}

export function RelatedContentPanel({ id, entries }: RelatedContentPanelProps) {
  if (entries.length === 0) return null
  return (
    <section
      aria-labelledby={`related-content-${id}`}
      data-testid="related-content"
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <Network size={18} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 id={`related-content-${id}`} className="text-sm font-semibold text-foreground">
          Related content
        </h2>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.to}>
            <Link
              to={entry.to}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <ArrowRight size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-medium text-foreground">{entry.title}</span>
                <span className="block text-[11px] text-muted-foreground">{entry.reason}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

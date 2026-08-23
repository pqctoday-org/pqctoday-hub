// SPDX-License-Identifier: GPL-3.0-only
/**
 * RelatedModulesPanel — "Related modules" for one module, rendered from
 * `src/data/moduleRelations.ts`.
 *
 * ONE panel, one data source. This is deliberately the same rendering slot
 * WS2-module-graph.md names for its own authored `RelatedModules` component:
 * if WS2 ever ships, its `prerequisiteIds`/`followOnIds` flow through
 * `moduleRelations()`'s `authored` branch and are rendered here INSTEAD of the
 * computed set. A second panel must never appear alongside this one — see the
 * override-seam note in moduleRelations.ts.
 *
 * Nothing renders when the module supplies its own hand-written related block
 * (`origin === 'authored-inline'`) or when there is genuinely nothing to show.
 */
import { Link } from 'react-router'
import { Network, ArrowRight } from 'lucide-react'
import { moduleRelations } from '@/data/moduleRelations'

export interface RelatedModulesPanelProps {
  moduleId: string
}

export function RelatedModulesPanel({ moduleId }: RelatedModulesPanelProps) {
  const { origin, entries } = moduleRelations(moduleId)
  if (entries.length === 0) return null

  return (
    <section
      aria-labelledby={`related-modules-${moduleId}`}
      data-relations-origin={origin}
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <Network size={18} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 id={`related-modules-${moduleId}`} className="text-sm font-semibold text-foreground">
          Related modules
        </h2>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              to={`/learn/${entry.id}`}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <ArrowRight size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-medium text-foreground">{entry.title}</span>
                {entry.reason ? (
                  <span className="block text-[11px] text-muted-foreground">{entry.reason}</span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

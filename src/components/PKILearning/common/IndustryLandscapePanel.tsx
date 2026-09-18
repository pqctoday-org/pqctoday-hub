// SPDX-License-Identifier: GPL-3.0-only
/**
 * IndustryLandscapePanel — "In the Industry Landscape" for one module.
 *
 * The landscape → Learn mapping was one-way until 2026-09-17 (audit L2): a
 * landscape industry linked to its module, nothing linked back. This renders
 * the reverse edge from the same CSV column, so a reader who arrived at
 * healthcare-pqc can jump to the Healthcare use cases, their mechanisms and
 * their standards. Nothing renders for a module no landscape row names.
 */
import { Link } from 'react-router'
import { Layers, ArrowRight } from 'lucide-react'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'
import { landscapeIndustriesForModule } from '@/components/Algorithms/landscapeLearnLinks'

export function IndustryLandscapePanel({ moduleId }: { moduleId: string }) {
  const { useCases } = loadIndustryLandscape()
  const entries = landscapeIndustriesForModule(moduleId, useCases)
  if (entries.length === 0) return null
  return (
    <section
      aria-labelledby={`industry-landscape-${moduleId}`}
      data-testid="industry-landscape-panel"
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <Layers size={18} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 id={`industry-landscape-${moduleId}`} className="text-sm font-semibold text-foreground">
          In the Industry Landscape
        </h2>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {entries.map((e) => (
          <li key={e.industry}>
            <Link
              to={e.href}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <ArrowRight size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-medium text-foreground">{e.industry}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {e.useCaseLabels.slice(0, 3).join(' · ')}
                  {e.useCaseLabels.length > 3 ? ` · +${e.useCaseLabels.length - 3} more` : ''}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

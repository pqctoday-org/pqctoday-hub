// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.1 (2026-09-19) — related content for the routed pages,
 * mounted once in MainLayout after the outlet (modules and tools render
 * their own panels). Same shape as the tools' RelatedContentPanel.
 */
import { useLocation, Link } from 'react-router'
import { Network, ArrowRight } from 'lucide-react'
import { pageRelationsFor } from '@/data/pageRelations'
import { PAGE_NEXT_STEP_ROUTES } from '@/data/nextSteps'
import { RelatedContentPanel } from '@/components/shared/RelatedContentPanel'

export function RouteRelated({ mobile }: { mobile: boolean }) {
  const { pathname } = useLocation()
  const route = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (!PAGE_NEXT_STEP_ROUTES.has(route)) return null
  const entries = pageRelationsFor(route)
  if (entries.length === 0) return null
  if (!mobile)
    return (
      <RelatedContentPanel
        id={route.replace(/\W+/g, '-') || 'home'}
        entries={entries}
        className="mt-8"
      />
    )
  return (
    <section
      aria-label="Related content"
      data-testid="related-content"
      className="mx-4 mb-4 rounded-xl border border-border bg-card p-3.5"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Network size={15} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-[13px] font-semibold text-foreground">Related content</h2>
      </div>
      <ul className="flex flex-col gap-2">
        {entries.map((e) => (
          <li key={e.to}>
            <Link
              to={e.to}
              className="flex min-h-[44px] items-start gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-[12.5px] active:bg-muted"
            >
              <ArrowRight size={13} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-medium text-foreground">{e.title}</span>
                <span className="block text-[10.5px] text-muted-foreground">{e.reason}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

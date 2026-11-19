// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { MOBILE_WORKSHOP_READY } from '@/data/mobileWorkshops'
import {
  BROWSE_ALL,
  matchingWorkshopSteps,
  type BrowseGroup,
} from '@/components/PKILearning/redesign/learnRedesign.helpers'

const VISIBLE_LIMIT = 8

export function WorkshopSearchMatches({
  groups,
  search,
  track,
  phone = false,
}: {
  groups: readonly BrowseGroup[]
  search: string
  track: string
  phone?: boolean
}) {
  const headingId = useId()
  const [expandedSearch, setExpandedSearch] = useState('')
  const [currentParams] = useSearchParams()
  const term = search.trim()
  if (term.length < 2) return null

  const results = groups.flatMap((group) =>
    group.modules.flatMap((module) =>
      matchingWorkshopSteps(module.id, term).map((step) => ({
        ...step,
        module,
        available: !phone || MOBILE_WORKSHOP_READY.has(module.id),
      }))
    )
  )
  if (!results.length) return null

  const params = new URLSearchParams({ mode: 'browse', q: search })
  if (track !== BROWSE_ALL) params.set('track', track)
  const persona = currentParams.get('persona')
  if (persona) params.set('persona', persona)
  const linkState = { learnBrowseSearch: `?${params}` }
  const expanded = expandedSearch === term
  const shown = expanded ? results : results.slice(0, VISIBLE_LIMIT)
  return (
    <section aria-labelledby={headingId} className="space-y-2 rounded-xl border border-border p-3">
      <h2 id={headingId} className="font-semibold">
        Matching workshop steps
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {shown.map(({ id, label, href, module, available }) => (
          <li key={`${module.id}-${id}`} className="min-w-0 text-sm">
            {available ? (
              <Link
                to={href}
                state={linkState}
                className="flex min-h-11 flex-col justify-center rounded-md px-2 py-1 text-primary underline"
              >
                <span className="font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{module.title}</span>
              </Link>
            ) : (
              <div className="px-2 py-1">
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {module.title} · Workshop on a computer
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
      {results.length > VISIBLE_LIMIT && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={expanded}
          onClick={() => setExpandedSearch(expanded ? '' : term)}
        >
          {expanded ? 'Show fewer workshop matches' : `Show all ${results.length} workshop matches`}
        </Button>
      )}
    </section>
  )
}

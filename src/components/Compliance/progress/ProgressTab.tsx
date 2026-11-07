// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Progress — "What is due next, and has anything already passed?"
 *
 * One ordered list, replacing three renderings of the same dates. Every date
 * comes from the structured `deadlineDates` column; nothing here parses prose,
 * and nothing is labelled overdue (see progressModel for why).
 */
import { useMemo } from 'react'
import { CalendarClock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router'
import clsx from 'clsx'
import { bindingDataPresent, type ComplianceFramework } from '@/data/complianceData'
import type { UserProfile } from '@/utils/applicabilityEngine'
import { BINDING_CHIP_CLASS, bindingChipFor, bindingChipMeta } from '@/utils/bindingSplit'
import { buildObligations } from '../obligations/obligationsModel'
import { buildProgress, groupProgress, nextMilestone } from './progressModel'

interface ProgressTabProps {
  profile: UserProfile
  onOpenDetail: (framework: ComplianceFramework) => void
  /** Injected so the page and its tests agree on "now". */
  currentYear?: number
}

export function ProgressTab({ profile, onOpenDetail, currentYear }: ProgressTabProps) {
  const year = currentYear ?? new Date().getFullYear()
  const obligations = useMemo(() => buildObligations(profile), [profile])
  const entries = useMemo(() => buildProgress(obligations, year), [obligations, year])
  // A binding source binds the reader only when the applicability engine puts it
  // in their mandatory tier; elsewhere the chip says it binds others.
  const inScopeIds = useMemo(
    () => new Set(obligations.filter((o) => o.tier === 'mandatory').map((o) => o.framework.id)),
    [obligations]
  )
  const showBinding = bindingDataPresent()
  const groups = useMemo(() => groupProgress(entries), [entries])
  const next = useMemo(() => nextMilestone(entries, year), [entries, year])

  const dated = entries.filter((e) => e.year !== undefined).length
  const undated = entries.length - dated

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <CalendarClock size={24} className="mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm font-semibold text-foreground">Nothing to show yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Set a country and a sector on Rules & Standards and the dates those instruments state will
          appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          {next ? (
            <>
              Next stated date:{' '}
              <span className="font-semibold text-foreground">
                {next.year} — {next.framework.label}
              </span>
              {next.label ? ` (${next.label})` : ''}.{' '}
            </>
          ) : (
            <>No dated milestone ahead in this scope. </>
          )}
          {dated} dated milestone{dated === 1 ? '' : 's'} across the scoped examples
          {undated > 0 && `, and ${undated} sources with no structured date`}.
        </p>
        <p className="mt-2 text-xs">
          <Link to="/timeline" className="text-primary hover:underline">
            Compare national roadmaps on Timeline
            <ExternalLink size={11} className="ml-0.5 inline" />
          </Link>
          <span className="text-muted-foreground">
            {' '}
            — that page answers what each country is doing; this lesson compares dates in the
            selected source set.
          </span>
        </p>
      </div>

      {groups.map((group) => (
        <section
          key={group.bucket}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-bold text-foreground">{group.title}</h3>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {group.entries.length}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{group.note}</p>
          </div>

          <ul className="divide-y divide-border">
            {group.entries.map((entry, i) => (
              <li
                key={`${entry.framework.id}-${entry.year ?? 'ongoing'}-${i}`}
                className="grid gap-2 px-4 py-3 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-baseline"
              >
                <span className="font-mono text-xs font-semibold text-foreground">
                  {entry.year ?? '—'}
                </span>
                <div className="min-w-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenDetail(entry.framework)}
                    className="h-auto justify-start whitespace-normal p-0 text-left text-[13px] font-semibold text-foreground hover:bg-transparent hover:text-primary hover:underline"
                  >
                    {entry.framework.label}
                  </Button>
                  {entry.label && (
                    <span className="ml-1.5 text-xs text-muted-foreground">{entry.label}</span>
                  )}
                  {showBinding &&
                    (() => {
                      const chip = bindingChipFor(
                        entry.framework.bindingStatus,
                        inScopeIds.has(entry.framework.id)
                      )
                      const meta = bindingChipMeta(chip)
                      return (
                        <span
                          data-testid="progress-binding-chip"
                          title={
                            entry.framework.bindingBasis
                              ? `${meta.description}. Basis: ${entry.framework.bindingBasis}`
                              : meta.description
                          }
                          className={clsx(
                            'ml-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold',
                            BINDING_CHIP_CLASS[chip]
                          )}
                        >
                          {meta.chip}
                        </span>
                      )
                    })()}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {entry.framework.deadline}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

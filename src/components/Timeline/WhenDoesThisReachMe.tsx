// SPDX-License-Identifier: GPL-3.0-only
/**
 * "When does this reach me" — B+ remediation 4.3 (2026-08-10).
 *
 * The review's finding: "a first-time reader meets a forty-country Gantt chart,
 * which is the wrong first object entirely." The chart is the right shape for
 * comparing jurisdictions and the wrong shape for the one question a newcomer
 * actually has, which is about themselves.
 *
 * So this is that single track: the reader's own country, its phases in date
 * order, and one sentence saying which one binds them next. The full chart
 * stays directly below, unchanged — this replaces nothing, it just arrives
 * first.
 *
 * DERIVED throughout. Country comes from the reader's stored region (the same
 * value the chart itself resolves), phases come from the same `GanttCountryData`
 * the chart renders, and "what's next" is computed against the current year. No
 * authored dates: a hand-written "your deadline is 2027" would be wrong for
 * most readers and unfixable without someone noticing.
 *
 * When we cannot tell which country applies, it renders NOTHING rather than
 * guessing at one. A confident wrong jurisdiction is worse for this reader than
 * the chart they were already going to see.
 */
import { useMemo } from 'react'
import { CalendarClock, ArrowDown } from 'lucide-react'
import type { GanttCountryData } from '@/types/timeline'

interface Props {
  /** The same filtered set the chart below is about to render. */
  data: GanttCountryData[]
  /** Resolved country name, or null when the reader has not told us. */
  countryName: string | null
}

/** Phases in date order, with the next one that has not yet passed marked. */
function trackFor(country: GanttCountryData | undefined) {
  if (!country) return null
  const year = new Date().getFullYear()
  const phases = [...country.phases]
    .filter((p) => Number.isFinite(p.startYear) && p.startYear > 0)
    .sort((a, b) => a.startYear - b.startYear)
  if (phases.length === 0) return null
  const next = phases.find((p) => p.startYear >= year) ?? null
  return { phases, next, year }
}

export function WhenDoesThisReachMe({ data, countryName }: Props) {
  const track = useMemo(() => {
    if (!countryName) return null
    return trackFor(data.find((d) => d.country.countryName === countryName))
  }, [data, countryName])

  if (!track || !countryName) return null

  return (
    <section className="mb-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <CalendarClock size={17} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-foreground">
          When does this reach me, in {countryName}?
        </h2>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {track.next ? (
          <>
            The next date that applies to you is{' '}
            <span className="font-semibold text-foreground">{track.next.startYear}</span> —{' '}
            {track.next.title}. Everything before it has already happened.
          </>
        ) : (
          <>
            Every phase recorded for {countryName} has a start date in the past. That does not mean
            the work is finished; it means the dates that were set have arrived.
          </>
        )}
      </p>

      {/* One row per phase, in date order. Deliberately a list rather than a
          bar chart: a reader who cannot yet parse the Gantt below is not helped
          by a smaller Gantt. */}
      <ol className="mt-3 space-y-1.5">
        {track.phases.map((p) => {
          const past = p.startYear < track.year
          const isNext = track.next != null && p === track.next
          return (
            <li
              key={`${p.startYear}-${p.title}`}
              className={`flex flex-wrap items-baseline gap-x-2 text-sm ${
                past ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              <span className="w-12 shrink-0 font-mono text-xs">{p.startYear}</span>
              <span className={isNext ? 'font-semibold' : ''}>{p.title}</span>
              {isNext && (
                <span className="rounded bg-primary/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-primary">
                  next
                </span>
              )}
              {past && <span className="text-xs text-muted-foreground/70">already passed</span>}
            </li>
          )
        })}
      </ol>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowDown size={12} aria-hidden="true" />
        The full chart below compares every country, if you want to see how yours sits against the
        rest.
      </p>
    </section>
  )
}

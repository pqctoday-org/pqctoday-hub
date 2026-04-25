// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import type { MaturityRequirement } from '@/types/MaturityTypes'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Factory,
  BookOpen,
  CalendarClock,
  Building2,
  Search,
  ExternalLink,
  BookmarkCheck,
  Bookmark,
} from 'lucide-react'
import {
  complianceFrameworks,
  type ComplianceFramework,
  type RegionBloc,
  type DeadlinePhase,
  regionForCountry,
  REGION_BLOC_ORDER,
} from '@/data/complianceData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CountryFlag } from '@/components/common/CountryFlag'
import { ViewToggle, type ViewMode } from '@/components/Library/ViewToggle'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { resolveTimelineRef } from '@/utils/timelineResolver'

// ── Deadline helpers ────────────────────────────────────────────────────

import {
  extractYear,
  deadlineUrgency,
  urgencyColor,
  type DeadlineUrgency,
} from '@/utils/deadlineUrgency'

function urgencyBgColor(urgency: DeadlineUrgency) {
  switch (urgency) {
    case 'overdue':
      return 'bg-status-error'
    case 'imminent':
      return 'bg-status-warning'
    case 'near':
      return 'bg-status-success'
    case 'future':
    case 'ongoing':
      return 'bg-muted-foreground'
  }
}

// ── Country helpers ─────────────────────────────────────────────────────

/** Map compliance CSV country names → ISO flag codes */
const COUNTRY_FLAG_CODE: Record<string, string> = {
  'United States': 'us',
  Canada: 'ca',
  Australia: 'au',
  'European Union': 'eu',
  France: 'fr',
  Germany: 'de',
  'Czech Republic': 'cz',
  Italy: 'it',
  Spain: 'es',
  'United Kingdom': 'gb',
  Japan: 'jp',
  Singapore: 'sg',
  'South Korea': 'kr',
  'New Zealand': 'nz',
  Israel: 'il',
  China: 'cn',
  Global: 'un',
}

/** Abbreviate country names for chips */
function countryChip(country: string): string {
  const map: Record<string, string> = {
    'United States': 'US',
    Canada: 'CA',
    Australia: 'AU',
    'European Union': 'EU',
    France: 'FR',
    Germany: 'DE',
    'Czech Republic': 'CZ',
    Japan: 'JP',
    Singapore: 'SG',
    'South Korea': 'KR',
    'United Kingdom': 'UK',
    Israel: 'IL',
    Italy: 'IT',
    Spain: 'ES',
    'New Zealand': 'NZ',
    China: 'CN',
    Global: 'Global',
  }
  // eslint-disable-next-line security/detect-object-injection
  return map[country] ?? country
}

/** Abbreviate industry names for chips */
function industryChip(industry: string): string {
  const map: Record<string, string> = {
    'Finance & Banking': 'Finance',
    'Government & Defense': 'Gov/Def',
    Healthcare: 'Health',
    Telecommunications: 'Telecom',
    Technology: 'Tech',
    'Energy & Utilities': 'Energy',
    Automotive: 'Auto',
    Aerospace: 'Aero',
    'Retail & E-Commerce': 'Retail',
    Manufacturing: 'Mfg',
  }
  // eslint-disable-next-line security/detect-object-injection
  return map[industry] ?? industry
}

// ── Sort helpers ─────────────────────────────────────────────────────────

export type FrameworkSortOption = 'name' | 'deadline'

const FRAMEWORK_SORT_OPTIONS: { id: FrameworkSortOption; label: string }[] = [
  { id: 'deadline', label: 'Deadline ↑' },
  { id: 'name', label: 'Name A-Z' },
]

// Deadline facet values — keep in sync with DeadlinePhase in complianceData.ts
const DEADLINE_FILTER_OPTIONS: { id: 'All' | DeadlinePhase; label: string }[] = [
  { id: 'All', label: 'Any deadline' },
  { id: 'active', label: 'Active / in force' },
  { id: 'imminent', label: 'Imminent (≤1y)' },
  { id: 'near', label: 'Near-term (2-3y)' },
  { id: 'mid', label: 'Mid-term (4-6y)' },
  { id: 'long', label: 'Long-term (>6y)' },
  { id: 'ongoing', label: 'Ongoing / no year' },
]

function sortFrameworks(items: ComplianceFramework[], sort: FrameworkSortOption) {
  return [...items].sort((a, b) => {
    if (sort === 'name') return a.label.localeCompare(b.label)
    // deadline: requiresPQC first, then by year ascending, then alphabetical
    if (a.requiresPQC !== b.requiresPQC) return a.requiresPQC ? -1 : 1
    const aYear = extractYear(a.deadline) ?? 9999
    const bYear = extractYear(b.deadline) ?? 9999
    if (aYear !== bYear) return aYear - bYear
    return a.label.localeCompare(b.label)
  })
}

// ── Timeline bar ────────────────────────────────────────────────────────

const TIMELINE_START = 2024
const TIMELINE_END = 2036
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START
const TODAY_YEAR = new Date().getFullYear()
const STACK_COLUMNS = 3

function yearLeftPercent(year: number): number {
  const clamped = Math.max(TIMELINE_START, Math.min(TIMELINE_END, year))
  return ((clamped - TIMELINE_START) / TIMELINE_SPAN) * 100
}

export function DeadlineTimeline({ frameworks }: { frameworks: ComplianceFramework[] }) {
  const withDeadlines = frameworks.filter((f) => extractYear(f.deadline) !== null)
  const years = Array.from({ length: TIMELINE_SPAN + 1 }, (_, i) => TIMELINE_START + i)

  const byYear = new Map<number, ComplianceFramework[]>()
  for (const fw of withDeadlines) {
    const year = extractYear(fw.deadline)!
    const bucket = Math.max(TIMELINE_START, Math.min(TIMELINE_END, year))
    if (!byYear.has(bucket)) byYear.set(bucket, [])
    byYear.get(bucket)!.push(fw)
  }

  const maxStackHeight = Math.max(
    0,
    ...Array.from(byYear.values()).map((fws) => Math.ceil(fws.length / STACK_COLUMNS))
  )
  const stackPx = maxStackHeight * 14 + 8 // 10px dot + 4px gap per row, plus breathing room
  const stackHeight = Math.max(72, Math.min(240, stackPx))

  return (
    <div className="glass-panel p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">PQC Compliance Deadlines</h3>
      <div className="relative overflow-x-auto">
        {/* px-3 keeps edge dots (2024 / 2036) fully visible inside the overflow container. */}
        <div className="min-w-[480px] px-3">
          {/* Year labels: absolute-positioned so they line up exactly with dot columns. */}
          <div className="relative h-4 text-xs text-muted-foreground mb-1">
            {years
              .filter((y) => y % 2 === 0 || y === TIMELINE_END)
              .map((y) => (
                <span
                  key={y}
                  className="absolute top-0 text-center whitespace-nowrap"
                  style={{ left: `${yearLeftPercent(y)}%`, transform: 'translateX(-50%)' }}
                >
                  {y}
                </span>
              ))}
          </div>
          <div className="relative h-2 bg-muted rounded-full">
            <div
              className="absolute top-0 h-2 w-0.5 bg-foreground/40"
              style={{
                left: `${yearLeftPercent(TODAY_YEAR)}%`,
              }}
              title={`Today (${TODAY_YEAR})`}
            />
          </div>
          <div className="relative mt-2" style={{ height: `${stackHeight}px` }}>
            {Array.from(byYear.entries()).map(([year, fws]) => {
              const left = yearLeftPercent(year)
              return (
                <div
                  key={year}
                  className="absolute top-0"
                  style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
                >
                  <div
                    className="grid gap-1 justify-items-center"
                    style={{ gridTemplateColumns: `repeat(${STACK_COLUMNS}, 10px)` }}
                  >
                    {fws.map((fw) => {
                      const urgency = deadlineUrgency(fw.deadline)
                      return (
                        <div key={fw.id} className="group relative">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${urgencyBgColor(urgency)} cursor-default`}
                            title={`${fw.label}: ${fw.deadline}`}
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 whitespace-nowrap">
                            <div className="bg-popover border border-border text-xs text-foreground px-2 py-1 rounded shadow-lg">
                              <span className="font-semibold">{fw.label}</span>
                              <span className={`ml-1 ${urgencyColor(urgency)}`}>{fw.deadline}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-1 px-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-error inline-block" /> Overdue
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-warning inline-block" /> Imminent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-success inline-block" /> Near-term
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" /> Future
            </span>
            <span className="flex items-center gap-1">
              <span className="w-0.5 h-3 bg-foreground/40 inline-block" /> Today
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Framework card ──────────────────────────────────────────────────────

function FrameworkCard({
  fw,
  maturityByRefId,
  onNavigateToCswp39,
}: {
  fw: ComplianceFramework
  maturityByRefId?: Map<string, MaturityRequirement[]>
  onNavigateToCswp39?: (refId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const urgency = deadlineUrgency(fw.deadline)
  const hasRefs = fw.libraryRefs.length > 0 || fw.timelineRefs.length > 0
  const isSelected = useComplianceSelectionStore((s) => s.myFrameworks.includes(fw.id))
  const toggleMyFramework = useComplianceSelectionStore((s) => s.toggleMyFramework)

  // Count maturity requirements reachable via this framework's library refs
  const maturityCount = useMemo(() => {
    if (!maturityByRefId) return 0
    return fw.libraryRefs.reduce((sum, ref) => sum + (maturityByRefId.get(ref)?.length ?? 0), 0)
  }, [fw.libraryRefs, maturityByRefId])

  const maturityRefId = useMemo(() => {
    if (!maturityByRefId) return null
    return fw.libraryRefs.find((ref) => maturityByRefId.has(ref)) ?? null
  }, [fw.libraryRefs, maturityByRefId])

  return (
    <div className="glass-panel p-4 space-y-3 flex flex-col">
      <div className="flex items-start gap-2">
        {fw.requiresPQC ? (
          <ShieldCheck size={18} className="text-status-success shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert size={18} className="text-muted-foreground shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground text-sm leading-tight">{fw.label}</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <TrustScoreBadge resourceType="compliance" resourceId={fw.id} size="sm" />
            {fw.bodyType === 'industry_alliance' && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-semibold"
                title="Industry alliance / consortium — not a regulator; produces reference implementations, policy guidance, and migration tooling"
              >
                Alliance
              </span>
            )}
            {fw.requiresPQC ? (
              <span className="text-xs text-status-success font-medium">Requires PQC</span>
            ) : (
              <span className="text-xs text-muted-foreground">No PQC mandate yet</span>
            )}
            {fw.enforcementBody && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Building2 size={8} />
                {fw.enforcementBody}
              </span>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={isSelected ? 'Remove from My Frameworks' : 'Add to My Frameworks'}
          onClick={(e) => {
            e.stopPropagation()
            toggleMyFramework(fw.id)
          }}
          className={`p-1 h-auto shrink-0 ${
            isSelected
              ? 'text-primary hover:text-primary/80'
              : 'text-muted-foreground/40 hover:text-primary'
          }`}
        >
          {isSelected ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </Button>
      </div>

      <div className={`flex items-center gap-1.5 text-xs ${urgencyColor(urgency)}`}>
        <Clock size={12} />
        <span className="font-medium">
          {urgency === 'overdue' ? `${fw.deadline} — Overdue` : fw.deadline}
        </span>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">{fw.description}</p>

      {fw.countries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fw.countries.map((c) => (
            <span
              key={c}
              title={c}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
            >
              <MapPin size={8} />
              {/* Hide the label on narrow screens to save space; icon + tooltip still convey the country. */}
              <span className="hidden sm:inline">{countryChip(c)}</span>
            </span>
          ))}
        </div>
      )}

      {fw.industries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fw.industries.map((ind) => (
            <span
              key={ind}
              title={ind}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium"
            >
              <Factory size={8} />
              <span className="hidden sm:inline">{industryChip(ind)}</span>
            </span>
          ))}
        </div>
      )}

      {(hasRefs || fw.notes || fw.website) && (
        <div className="flex items-center gap-2 mt-auto pt-1">
          {fw.website && (
            <a
              href={fw.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium hover:bg-muted/80 hover:text-foreground transition-colors"
              title={`Official site: ${fw.website}`}
            >
              <ExternalLink size={8} />
              Site
            </a>
          )}
          {maturityCount > 0 && maturityRefId && onNavigateToCswp39 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToCswp39(maturityRefId)}
              className="h-auto inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors border border-primary/20"
              title="View CSWP.39 governance requirements extracted from this framework"
            >
              {maturityCount} CSWP.39 req{maturityCount !== 1 ? 's' : ''} →
            </Button>
          )}
          {fw.libraryRefs.length > 0 && (
            <Link
              to={`/library?q=${encodeURIComponent(fw.libraryRefs.join(' '))}`}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium hover:bg-secondary/20 transition-colors"
              title={`Library: ${fw.libraryRefs.join(', ')}`}
            >
              <BookOpen size={8} />
              {fw.libraryRefs.length} ref{fw.libraryRefs.length > 1 ? 's' : ''}
            </Link>
          )}
          {fw.timelineRefs.length > 0 &&
            (() => {
              const first = resolveTimelineRef(fw.timelineRefs[0])
              const country = first.country
              const href = country
                ? `/timeline?country=${encodeURIComponent(country)}`
                : '/timeline'
              const label =
                first.events.length > 0
                  ? `${first.country} — ${first.org}: ${first.events.length} event${first.events.length > 1 ? 's' : ''} (${first.earliestYear}-${first.latestYear})`
                  : `Timeline: ${fw.timelineRefs.join(', ')}`
              return (
                <Link
                  to={href}
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors"
                  title={label}
                >
                  <CalendarClock size={8} />
                  Timeline
                </Link>
              )
            })()}
          {fw.notes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 h-auto py-0 text-xs text-primary hover:text-primary/80 ml-auto"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Hide' : 'Details'}
            </Button>
          )}
        </div>
      )}

      {expanded && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 border border-border space-y-2">
          {fw.notes && <p>{fw.notes}</p>}
          {fw.libraryRefs.length > 0 && (
            <div className="pt-1 border-t border-border/50">
              <span className="font-medium text-foreground">Related documents:</span>
              <ul className="mt-0.5 space-y-0.5">
                {fw.libraryRefs.map((ref) => (
                  <li key={ref}>
                    <Link
                      to={`/library?ref=${encodeURIComponent(ref)}`}
                      className="text-secondary hover:text-secondary/80 underline underline-offset-2"
                    >
                      {ref}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fw.timelineRefs.length > 0 && (
            <div className="pt-1 border-t border-border/50">
              <span className="font-medium text-foreground">Timeline entries:</span>
              <ul className="mt-0.5 space-y-0.5">
                {fw.timelineRefs.map((ref) => {
                  const resolved = resolveTimelineRef(ref)
                  const href = resolved.country
                    ? `/timeline?country=${encodeURIComponent(resolved.country)}`
                    : '/timeline'
                  const topEvents = resolved.events.slice(0, 3)
                  return (
                    <li key={ref} className="space-y-0.5">
                      <Link
                        to={href}
                        className="text-accent hover:text-accent/80 underline underline-offset-2"
                      >
                        {resolved.country
                          ? `${resolved.country} — ${resolved.org}`
                          : ref.replace(':', ' — ')}
                      </Link>
                      {resolved.events.length === 0 ? (
                        <span className="ml-2 text-[10px] text-status-warning">
                          no events in timeline
                        </span>
                      ) : (
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          {resolved.events.length} event
                          {resolved.events.length > 1 ? 's' : ''} · {resolved.earliestYear}–
                          {resolved.latestYear}
                        </span>
                      )}
                      {topEvents.length > 0 && (
                        <ul className="ml-4 space-y-0 list-[circle] list-inside">
                          {topEvents.map((e) => (
                            <li
                              key={`${e.title}-${e.startYear}`}
                              className="text-[10px] text-muted-foreground"
                            >
                              <span className="font-medium text-foreground/80">{e.title}</span>
                              <span className="ml-1">
                                ({e.startYear}
                                {e.endYear !== e.startYear ? `–${e.endYear}` : ''})
                              </span>
                            </li>
                          ))}
                          {resolved.events.length > topEvents.length && (
                            <li className="text-[10px] text-muted-foreground italic">
                              +{resolved.events.length - topEvents.length} more on the timeline
                            </li>
                          )}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Framework table row ─────────────────────────────────────────────────

function FrameworkTableRow({ fw }: { fw: ComplianceFramework }) {
  const urgency = deadlineUrgency(fw.deadline)
  const isSelected = useComplianceSelectionStore((s) => s.myFrameworks.includes(fw.id))
  const toggleMyFramework = useComplianceSelectionStore((s) => s.toggleMyFramework)
  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors">
      <td className="py-2.5 px-2 w-8 text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={isSelected ? 'Remove from My Frameworks' : 'Add to My Frameworks'}
          onClick={(e) => {
            e.stopPropagation()
            toggleMyFramework(fw.id)
          }}
          className={`p-1 h-auto ${
            isSelected
              ? 'text-primary hover:text-primary/80'
              : 'text-muted-foreground/40 hover:text-primary'
          }`}
        >
          {isSelected ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </Button>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          {fw.requiresPQC ? (
            <ShieldCheck size={14} className="text-status-success shrink-0" />
          ) : (
            <ShieldAlert size={14} className="text-muted-foreground shrink-0" />
          )}
          <span className="text-sm font-medium text-foreground">{fw.label}</span>
          {fw.website && (
            <a
              href={fw.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
              title="Official website"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={10} />
            </a>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 ml-5 line-clamp-1">{fw.description}</p>
      </td>
      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
        {fw.enforcementBody}
      </td>
      <td className={`py-2.5 px-3 text-xs font-medium whitespace-nowrap ${urgencyColor(urgency)}`}>
        {fw.deadline}
      </td>
      <td className="py-2.5 px-3">
        <div className="flex flex-wrap gap-1">
          {fw.countries.slice(0, 3).map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {/* eslint-disable-next-line security/detect-object-injection */}
              {COUNTRY_FLAG_CODE[c] && (
                <CountryFlag
                  code={COUNTRY_FLAG_CODE[c]}
                  width={12}
                  height={9}
                  className="rounded-[1px]"
                />
              )}
              {countryChip(c)}
            </span>
          ))}
          {fw.countries.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{fw.countries.length - 3}</span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex gap-1.5">
          {fw.libraryRefs.length > 0 && (
            <Link
              to={`/library?q=${encodeURIComponent(fw.libraryRefs.join(' '))}`}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium hover:bg-secondary/20 transition-colors"
            >
              <BookOpen size={8} />
              {fw.libraryRefs.length}
            </Link>
          )}
          {fw.timelineRefs.length > 0 &&
            (() => {
              const first = resolveTimelineRef(fw.timelineRefs[0])
              const href = first.country
                ? `/timeline?country=${encodeURIComponent(first.country)}`
                : '/timeline'
              const title =
                first.events.length > 0
                  ? `${first.country} — ${first.org}: ${first.events.length} event${first.events.length > 1 ? 's' : ''} (${first.earliestYear}-${first.latestYear})`
                  : fw.timelineRefs.join(', ')
              return (
                <Link
                  to={href}
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors"
                  title={title}
                >
                  <CalendarClock size={8} />
                </Link>
              )
            })()}
        </div>
      </td>
    </tr>
  )
}

function FrameworkTable({ frameworks }: { frameworks: ComplianceFramework[] }) {
  return (
    <div className="glass-panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="py-2.5 px-2 w-8 text-center text-xs font-semibold text-muted-foreground">
              My
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">
              Name
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Enforcement Body
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">
              Deadline
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">
              Countries
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">
              Refs
            </th>
          </tr>
        </thead>
        <tbody>
          {frameworks.map((fw) => (
            <FrameworkTableRow key={fw.id} fw={fw} />
          ))}
        </tbody>
      </table>
      {frameworks.length === 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No entries match the selected filters.
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────

interface ComplianceLandscapeProps {
  /** Pre-filtered set of frameworks to display. Defaults to all complianceFrameworks. */
  frameworks?: ComplianceFramework[]
  /** Whether to render the deadline timeline bar. Defaults to true. */
  showDeadlineTimeline?: boolean
  /** Maturity requirements lookup — enables CSWP.39 req chips on compliance framework cards */
  maturityByRefId?: Map<string, MaturityRequirement[]>
  /** Called when user clicks a CSWP.39 req chip; navigates to CSWP.39 tab filtered to refId */
  onNavigateToCswp39?: (refId: string) => void
  /** Controlled filter state (lifted to ComplianceView for URL sync) */
  orgFilter?: string
  industryFilter?: string
  regionFilter?: RegionBloc | 'All'
  deadlineFilter?: 'All' | DeadlinePhase
  searchText?: string
  searchInputValue?: string
  sortBy?: FrameworkSortOption
  viewMode?: ViewMode
  onOrgFilterChange?: (org: string) => void
  onIndustryFilterChange?: (ind: string) => void
  onRegionFilterChange?: (region: RegionBloc | 'All') => void
  onDeadlineFilterChange?: (phase: 'All' | DeadlinePhase) => void
  onSearchTextChange?: (text: string) => void
  onSortByChange?: (sort: FrameworkSortOption) => void
  onViewModeChange?: (mode: ViewMode) => void
}

export function ComplianceLandscape({
  frameworks: frameworksProp,
  showDeadlineTimeline = true,
  maturityByRefId,
  onNavigateToCswp39,
  orgFilter: orgFilterProp,
  industryFilter: industryFilterProp,
  regionFilter: regionFilterProp,
  deadlineFilter: deadlineFilterProp,
  searchText: searchTextProp,
  searchInputValue: searchInputValueProp,
  sortBy: sortByProp,
  viewMode: viewModeProp,
  onOrgFilterChange,
  onIndustryFilterChange,
  onRegionFilterChange,
  onDeadlineFilterChange,
  onSearchTextChange,
  onSortByChange,
  onViewModeChange,
}: ComplianceLandscapeProps = {}) {
  const sourceFrameworks = frameworksProp ?? complianceFrameworks
  const { selectedIndustries } = usePersonaStore()
  const myFrameworks = useComplianceSelectionStore((s) => s.myFrameworks)
  const showOnlyMine = useComplianceSelectionStore((s) => s.showOnlyMine)
  const setShowOnlyMine = useComplianceSelectionStore((s) => s.setShowOnlyMine)

  // Filter state — controlled from parent when props provided, local fallback otherwise
  const [localOrg, setLocalOrg] = useState<string>('All')
  const [localIndustry, setLocalIndustry] = useState<string>(
    selectedIndustries.length === 1 ? selectedIndustries[0] : 'All'
  )
  const [localRegion, setLocalRegion] = useState<RegionBloc | 'All'>('All')
  const [localDeadline, setLocalDeadline] = useState<'All' | DeadlinePhase>('All')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [localSort, setLocalSort] = useState<FrameworkSortOption>('deadline')
  const [localView, setLocalView] = useState<ViewMode>('cards')

  const orgFilter = orgFilterProp ?? localOrg
  const industryFilter = industryFilterProp ?? localIndustry
  const regionFilter = regionFilterProp ?? localRegion
  const deadlineFilter = deadlineFilterProp ?? localDeadline
  const searchInputVal = searchInputValueProp ?? localSearch
  const searchFilterText = searchTextProp ?? localSearch
  const sortBy = sortByProp ?? localSort
  const viewMode = viewModeProp ?? localView

  const setOrgFilter = onOrgFilterChange ?? setLocalOrg
  const setIndustryFilter = onIndustryFilterChange ?? setLocalIndustry
  const setRegionFilter = onRegionFilterChange ?? setLocalRegion
  const setDeadlineFilter = onDeadlineFilterChange ?? setLocalDeadline
  const setSearchText = onSearchTextChange ?? setLocalSearch
  const setSortBy = onSortByChange ?? setLocalSort
  const setViewMode = onViewModeChange ?? setLocalView

  // Organization options — derived from full dataset so non-empty facets are
  // never hidden by the active body-type tab.
  const orgItems = useMemo(() => {
    const orgs = new Set<string>()
    for (const fw of complianceFrameworks) {
      if (fw.enforcementBody) orgs.add(fw.enforcementBody)
    }
    return [
      { id: 'All', label: 'All Organizations' },
      ...[...orgs].sort().map((o) => ({ id: o, label: o })),
    ]
  }, [])

  // Industry options — derived from full dataset (union of fw.industries)
  // rather than a hardcoded list, so new industries in the CSV appear
  // automatically and are filterable on every tab.
  const industryItems = useMemo(() => {
    const inds = new Set<string>()
    for (const fw of complianceFrameworks) {
      for (const i of fw.industries) inds.add(i)
    }
    return [
      { id: 'All', label: 'All Industries' },
      ...[...inds].sort().map((i) => ({ id: i, label: i })),
    ]
  }, [])

  // Region options — derived from full dataset with per-region counts so the
  // facet always lists every populated region (e.g. Africa) regardless of the
  // active body-type tab. The "All" label still reflects the in-tab count for
  // the user's current view.
  const regionItems = useMemo(() => {
    const counts = new Map<RegionBloc, number>()
    for (const fw of complianceFrameworks) {
      const seen = new Set<RegionBloc>()
      for (const c of fw.countries) {
        const r = regionForCountry(c)
        if (!seen.has(r)) {
          counts.set(r, (counts.get(r) ?? 0) + 1)
          seen.add(r)
        }
      }
    }
    const ordered = REGION_BLOC_ORDER.filter((r) => counts.has(r))
    return [
      { id: 'All', label: `All Regions (${sourceFrameworks.length})` },
      ...ordered.map((r) => ({ id: r, label: `${r} (${counts.get(r) ?? 0})` })),
    ]
  }, [sourceFrameworks.length])

  // Sort options as FilterDropdown items
  const sortItems = FRAMEWORK_SORT_OPTIONS.map((o) => ({ id: o.id, label: o.label }))

  // Deadline phase options
  const deadlineItems = DEADLINE_FILTER_OPTIONS.map((o) => ({ id: o.id, label: o.label }))

  // Apply filters + sort
  const displayedFrameworks = useMemo(() => {
    let result = [...sourceFrameworks]

    if (orgFilter !== 'All') {
      result = result.filter((fw) => fw.enforcementBody === orgFilter)
    }
    if (industryFilter !== 'All') {
      result = result.filter((fw) => fw.industries.includes(industryFilter))
    }
    if (regionFilter !== 'All') {
      result = result.filter((fw) => fw.countries.some((c) => regionForCountry(c) === regionFilter))
    }
    if (deadlineFilter !== 'All') {
      result = result.filter((fw) => fw.deadlinePhase === deadlineFilter)
    }
    if (searchFilterText.trim()) {
      const q = searchFilterText.toLowerCase()
      result = result.filter(
        (fw) =>
          fw.label.toLowerCase().includes(q) ||
          fw.description.toLowerCase().includes(q) ||
          fw.enforcementBody.toLowerCase().includes(q)
      )
    }
    if (showOnlyMine) {
      result = result.filter((fw) => myFrameworks.includes(fw.id))
    }

    return sortFrameworks(result, sortBy)
  }, [
    sourceFrameworks,
    orgFilter,
    industryFilter,
    regionFilter,
    deadlineFilter,
    searchFilterText,
    sortBy,
    showOnlyMine,
    myFrameworks,
  ])

  // Stats
  const pqcCount = displayedFrameworks.filter((f) => f.requiresPQC).length
  const deadlineCount = displayedFrameworks.filter((f) => extractYear(f.deadline) !== null).length

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="glass-panel px-4 py-2 flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{displayedFrameworks.length}</span>
          <span className="text-muted-foreground">Entries</span>
        </div>
        <div className="glass-panel px-4 py-2 flex items-center gap-2">
          <ShieldCheck size={16} className="text-status-success" />
          <span className="text-2xl font-bold text-foreground">{pqcCount}</span>
          <span className="text-muted-foreground">Require PQC</span>
        </div>
        <div className="glass-panel px-4 py-2 flex items-center gap-2">
          <Clock size={16} className="text-status-warning" />
          <span className="text-2xl font-bold text-foreground">{deadlineCount}</span>
          <span className="text-muted-foreground">Explicit Deadlines</span>
        </div>
      </div>

      {/* Timeline visualization (desktop only) — only when showDeadlineTimeline=true */}
      {showDeadlineTimeline && (
        <div className="hidden md:block">
          <DeadlineTimeline frameworks={displayedFrameworks} />
        </div>
      )}

      {/* Library-style filter band */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-2 flex items-center gap-2 flex-wrap">
        {/* Organization dropdown */}
        <div className="min-w-[140px]">
          <FilterDropdown
            items={orgItems}
            selectedId={orgFilter}
            onSelect={setOrgFilter}
            defaultLabel="Organization"
            noContainer
            opaque
          />
        </div>

        {/* Industry dropdown + clear */}
        <div className="flex items-center gap-1">
          <div className="min-w-[140px]">
            <FilterDropdown
              items={industryItems}
              selectedId={industryFilter}
              onSelect={setIndustryFilter}
              defaultLabel="Industry"
              noContainer
              opaque
            />
          </div>
          {industryFilter !== 'All' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIndustryFilter('All')}
              className="h-auto py-1 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
              aria-label="Clear industry filter"
            >
              All
            </Button>
          )}
        </div>

        {/* Region dropdown + clear */}
        <div className="flex items-center gap-1">
          <div className="min-w-[150px]">
            <FilterDropdown
              items={regionItems}
              selectedId={regionFilter}
              onSelect={(id) => setRegionFilter(id as RegionBloc | 'All')}
              defaultLabel="Region"
              noContainer
              opaque
            />
          </div>
          {regionFilter !== 'All' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRegionFilter('All')}
              className="h-auto py-1 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
              aria-label="Clear region filter"
            >
              All
            </Button>
          )}
        </div>

        {/* Deadline dropdown + clear */}
        <div className="flex items-center gap-1">
          <div className="min-w-[150px]">
            <FilterDropdown
              items={deadlineItems}
              selectedId={deadlineFilter}
              onSelect={(id) => setDeadlineFilter(id as 'All' | DeadlinePhase)}
              defaultLabel="Deadline"
              noContainer
              opaque
            />
          </div>
          {deadlineFilter !== 'All' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeadlineFilter('All')}
              className="h-auto py-1 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
              aria-label="Clear deadline filter"
            >
              All
            </Button>
          )}
        </div>

        {/* Search input */}
        <div className="relative flex-1 min-w-[160px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search standards..."
            aria-label="Search compliance entries"
            value={searchInputVal}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-8 pr-4 py-1.5 text-xs focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Sort (cards only) */}
        {viewMode === 'cards' && (
          <FilterDropdown
            items={sortItems}
            selectedId={sortBy}
            onSelect={(id) => setSortBy(id as FrameworkSortOption)}
            defaultLabel="Sort"
            noContainer
            opaque
          />
        )}

        {/* View toggle */}
        <ViewToggle mode={viewMode} onChange={setViewMode} />

        {/* "Show mine" toggle — visible when user has selections */}
        {myFrameworks.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowOnlyMine(!showOnlyMine)}
            className={`h-auto text-xs px-3 py-1.5 border font-medium whitespace-nowrap ${
              showOnlyMine
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
            aria-pressed={showOnlyMine}
          >
            <BookmarkCheck size={12} />
            My ({myFrameworks.length})
          </Button>
        )}
      </div>

      {/* Content */}
      {viewMode === 'cards' ? (
        displayedFrameworks.length === 0 ? (
          <div className="glass-panel p-8 text-center text-muted-foreground">
            No entries match the selected filters. Try broadening your selection.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedFrameworks.map((fw) => (
              <FrameworkCard
                key={fw.id}
                fw={fw}
                maturityByRefId={maturityByRefId}
                onNavigateToCswp39={onNavigateToCswp39}
              />
            ))}
          </div>
        )
      ) : (
        <FrameworkTable frameworks={displayedFrameworks} />
      )}
    </div>
  )
}

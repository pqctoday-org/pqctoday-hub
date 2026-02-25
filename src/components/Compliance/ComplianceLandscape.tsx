import { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { AVAILABLE_INDUSTRIES } from '@/hooks/assessmentData'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import { REGION_COUNTRIES_MAP } from '@/data/personaConfig'
import { usePersonaStore, type Region } from '@/store/usePersonaStore'
import { FilterDropdown } from '@/components/common/FilterDropdown'

// ── Deadline helpers ────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()

/** Extract a numeric year from a deadline string, e.g. "2025 (software)" → 2025 */
function extractYear(deadline: string): number | null {
  const match = deadline.match(/\b(20\d{2})\b/)
  return match ? parseInt(match[1], 10) : null
}

/** Classify urgency relative to the current year */
function deadlineUrgency(deadline: string): 'overdue' | 'imminent' | 'near' | 'future' | 'ongoing' {
  const year = extractYear(deadline)
  if (!year) return 'ongoing'
  if (year < CURRENT_YEAR) return 'overdue'
  if (year <= CURRENT_YEAR + 2) return 'imminent'
  if (year <= CURRENT_YEAR + 4) return 'near'
  return 'future'
}

function urgencyColor(urgency: ReturnType<typeof deadlineUrgency>) {
  switch (urgency) {
    case 'overdue':
      return 'text-status-error'
    case 'imminent':
      return 'text-status-warning'
    case 'near':
      return 'text-status-success'
    case 'future':
      return 'text-muted-foreground'
    case 'ongoing':
      return 'text-muted-foreground'
  }
}

function urgencyBgColor(urgency: ReturnType<typeof deadlineUrgency>) {
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

// ── Region helpers ──────────────────────────────────────────────────────

const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'EU',
  apac: 'APAC',
  global: 'Global',
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
    Education: 'Edu',
  }
  // eslint-disable-next-line security/detect-object-injection
  return map[industry] ?? industry
}

// ── Timeline bar ────────────────────────────────────────────────────────

const TIMELINE_START = 2024
const TIMELINE_END = 2036

function DeadlineTimeline({ frameworks }: { frameworks: ComplianceFramework[] }) {
  const withDeadlines = frameworks.filter((f) => extractYear(f.deadline) !== null)
  const years = Array.from(
    { length: TIMELINE_END - TIMELINE_START + 1 },
    (_, i) => TIMELINE_START + i
  )

  // Group frameworks by year
  const byYear = new Map<number, ComplianceFramework[]>()
  for (const fw of withDeadlines) {
    const year = extractYear(fw.deadline)!
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push(fw)
  }

  return (
    <div className="glass-panel p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">PQC Compliance Deadlines</h3>
      <div className="relative overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Year markers */}
          <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
            {years
              .filter((y) => y % 2 === 0 || y === TIMELINE_END)
              .map((y) => (
                <span key={y} className="w-8 text-center">
                  {y}
                </span>
              ))}
          </div>

          {/* Bar */}
          <div className="relative h-2 bg-muted rounded-full mx-1">
            {/* Today marker */}
            <div
              className="absolute top-0 h-2 w-0.5 bg-foreground/40"
              style={{
                left: `${((2026 - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100}%`,
              }}
              title="Today (2026)"
            />
          </div>

          {/* Framework markers */}
          <div className="relative h-24 mx-1 mt-1">
            {Array.from(byYear.entries()).map(([year, fws]) => {
              const left = ((year - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100
              return (
                <div
                  key={year}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
                >
                  {fws.map((fw) => {
                    const urgency = deadlineUrgency(fw.deadline)
                    return (
                      <div key={fw.id} className="group relative mb-0.5">
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
              )
            })}
          </div>

          {/* Legend */}
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

function FrameworkCard({ fw }: { fw: ComplianceFramework }) {
  const [expanded, setExpanded] = useState(false)
  const urgency = deadlineUrgency(fw.deadline)
  const hasRefs = fw.libraryRefs.length > 0 || fw.timelineRefs.length > 0

  return (
    <div className="glass-panel p-4 space-y-3 flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-2">
        {fw.requiresPQC ? (
          <ShieldCheck size={18} className="text-status-success shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert size={18} className="text-muted-foreground shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground text-sm leading-tight">{fw.label}</h4>
          <div className="flex items-center gap-2">
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
      </div>

      {/* Deadline */}
      <div className={`flex items-center gap-1.5 text-xs ${urgencyColor(urgency)}`}>
        <Clock size={12} />
        <span className="font-medium">
          {urgency === 'overdue' ? `${fw.deadline} — Overdue` : fw.deadline}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2">{fw.description}</p>

      {/* Region chips */}
      {fw.countries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fw.countries.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
            >
              <MapPin size={8} />
              {countryChip(c)}
            </span>
          ))}
        </div>
      )}

      {/* Industry chips */}
      {fw.industries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fw.industries.map((ind) => (
            <span
              key={ind}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium"
            >
              <Factory size={8} />
              {industryChip(ind)}
            </span>
          ))}
        </div>
      )}

      {/* Cross-reference badges */}
      {(hasRefs || fw.notes) && (
        <div className="flex items-center gap-2 mt-auto pt-1">
          {fw.libraryRefs.length > 0 && (
            <Link
              to="/library"
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium hover:bg-secondary/20 transition-colors"
              title={`Library: ${fw.libraryRefs.join(', ')}`}
            >
              <BookOpen size={8} />
              {fw.libraryRefs.length} ref{fw.libraryRefs.length > 1 ? 's' : ''}
            </Link>
          )}
          {fw.timelineRefs.length > 0 && (
            <Link
              to="/timeline"
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors"
              title={`Timeline: ${fw.timelineRefs.join(', ')}`}
            >
              <CalendarClock size={8} />
              Timeline
            </Link>
          )}

          {/* Expandable notes toggle */}
          {fw.notes && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors ml-auto"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Hide' : 'Details'}
            </button>
          )}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 border border-border space-y-2">
          {fw.notes && <p>{fw.notes}</p>}

          {/* Library references */}
          {fw.libraryRefs.length > 0 && (
            <div className="pt-1 border-t border-border/50">
              <span className="font-medium text-foreground">Related documents:</span>
              <ul className="mt-0.5 space-y-0.5">
                {fw.libraryRefs.map((ref) => (
                  <li key={ref}>
                    <Link
                      to="/library"
                      className="text-secondary hover:text-secondary/80 underline underline-offset-2"
                    >
                      {ref}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timeline references */}
          {fw.timelineRefs.length > 0 && (
            <div className="pt-1 border-t border-border/50">
              <span className="font-medium text-foreground">Timeline entries:</span>
              <ul className="mt-0.5 space-y-0.5">
                {fw.timelineRefs.map((ref) => (
                  <li key={ref}>
                    <Link
                      to="/timeline"
                      className="text-accent hover:text-accent/80 underline underline-offset-2"
                    >
                      {ref.replace(':', ' — ')}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────

export function ComplianceLandscape() {
  const { selectedIndustries, selectedRegion } = usePersonaStore()

  // Filters — initialize from persona if set
  const [regionFilter, setRegionFilter] = useState<string>(selectedRegion ?? 'All')
  const [industryFilter, setIndustryFilter] = useState<string>(selectedIndustries[0] ?? 'All')

  // Apply filters
  const filteredFrameworks = useMemo(() => {
    let result = [...complianceFrameworks]

    if (regionFilter !== 'All') {
      const regionCountries = REGION_COUNTRIES_MAP[regionFilter as Region] ?? []
      result = result.filter((fw) =>
        fw.countries.some(
          (c) => regionCountries.some((rc) => c.includes(rc) || rc.includes(c)) || c === 'Global'
        )
      )
    }

    if (industryFilter !== 'All') {
      result = result.filter((fw) => fw.industries.includes(industryFilter))
    }

    // Sort: requiresPQC first, then by deadline urgency (imminent first), then alphabetical
    result.sort((a, b) => {
      if (a.requiresPQC !== b.requiresPQC) return a.requiresPQC ? -1 : 1
      const aYear = extractYear(a.deadline) ?? 9999
      const bYear = extractYear(b.deadline) ?? 9999
      if (aYear !== bYear) return aYear - bYear
      return a.label.localeCompare(b.label)
    })

    return result
  }, [regionFilter, industryFilter])

  // Stats
  const totalCount = filteredFrameworks.length
  const pqcCount = filteredFrameworks.filter((f) => f.requiresPQC).length
  const deadlineCount = filteredFrameworks.filter((f) => extractYear(f.deadline) !== null).length

  // Region filter items
  const regionItems = [
    { id: 'All', label: 'All Regions' },
    ...Object.entries(REGION_LABELS).map(([id, label]) => ({ id, label })),
  ]

  // Industry filter items
  const industryItems = [
    { id: 'All', label: 'All Industries' },
    ...AVAILABLE_INDUSTRIES.filter((i) => i !== 'Other').map((i) => ({ id: i, label: i })),
  ]

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="glass-panel px-4 py-2 flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{totalCount}</span>
          <span className="text-muted-foreground">Frameworks</span>
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

      {/* Timeline visualization (desktop only) */}
      <div className="hidden md:block">
        <DeadlineTimeline frameworks={filteredFrameworks} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <FilterDropdown
          items={regionItems}
          selectedId={regionFilter}
          onSelect={setRegionFilter}
          label="Region"
          defaultLabel="All Regions"
          noContainer
        />
        <FilterDropdown
          items={industryItems}
          selectedId={industryFilter}
          onSelect={setIndustryFilter}
          label="Industry"
          defaultLabel="All Industries"
          defaultIcon={<Factory size={16} className="text-primary" />}
          noContainer
        />
      </div>

      {/* Framework grid */}
      {filteredFrameworks.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          No frameworks match the selected filters. Try broadening your selection.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFrameworks.map((fw) => (
            <FrameworkCard key={fw.id} fw={fw} />
          ))}
        </div>
      )}
    </div>
  )
}

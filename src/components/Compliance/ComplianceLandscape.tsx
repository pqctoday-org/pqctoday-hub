// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
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
import { AVAILABLE_INDUSTRIES } from '@/hooks/assessmentData'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CountryFlag } from '@/components/common/CountryFlag'
import { ViewToggle, type ViewMode } from '@/components/Library/ViewToggle'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'

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

function DeadlineTimeline({ frameworks }: { frameworks: ComplianceFramework[] }) {
  const withDeadlines = frameworks.filter((f) => extractYear(f.deadline) !== null)
  const years = Array.from(
    { length: TIMELINE_END - TIMELINE_START + 1 },
    (_, i) => TIMELINE_START + i
  )

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
        <div className="min-w-[400px]">
          <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
            {years
              .filter((y) => y % 2 === 0 || y === TIMELINE_END)
              .map((y) => (
                <span key={y} className="w-8 text-center">
                  {y}
                </span>
              ))}
          </div>
          <div className="relative h-2 bg-muted rounded-full mx-1">
            <div
              className="absolute top-0 h-2 w-0.5 bg-foreground/40"
              style={{
                left: `${((2026 - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100}%`,
              }}
              title="Today (2026)"
            />
          </div>
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
  const isSelected = useComplianceSelectionStore((s) => s.myFrameworks.includes(fw.id))
  const toggleMyFramework = useComplianceSelectionStore((s) => s.toggleMyFramework)

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
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
            >
              <MapPin size={8} />
              {countryChip(c)}
            </span>
          ))}
        </div>
      )}

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
          {fw.timelineRefs.length > 0 && (
            <Link
              to="/timeline"
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors"
            >
              <CalendarClock size={8} />
            </Link>
          )}
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
  /** Controlled filter state (lifted to ComplianceView for URL sync) */
  orgFilter?: string
  industryFilter?: string
  searchText?: string
  searchInputValue?: string
  sortBy?: FrameworkSortOption
  viewMode?: ViewMode
  onOrgFilterChange?: (org: string) => void
  onIndustryFilterChange?: (ind: string) => void
  onSearchTextChange?: (text: string) => void
  onSortByChange?: (sort: FrameworkSortOption) => void
  onViewModeChange?: (mode: ViewMode) => void
}

export function ComplianceLandscape({
  frameworks: frameworksProp,
  showDeadlineTimeline = true,
  orgFilter: orgFilterProp,
  industryFilter: industryFilterProp,
  searchText: searchTextProp,
  searchInputValue: searchInputValueProp,
  sortBy: sortByProp,
  viewMode: viewModeProp,
  onOrgFilterChange,
  onIndustryFilterChange,
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
  const [localSearch, setLocalSearch] = useState<string>('')
  const [localSort, setLocalSort] = useState<FrameworkSortOption>('deadline')
  const [localView, setLocalView] = useState<ViewMode>('cards')

  const orgFilter = orgFilterProp ?? localOrg
  const industryFilter = industryFilterProp ?? localIndustry
  const searchInputVal = searchInputValueProp ?? localSearch
  const searchFilterText = searchTextProp ?? localSearch
  const sortBy = sortByProp ?? localSort
  const viewMode = viewModeProp ?? localView

  const setOrgFilter = onOrgFilterChange ?? setLocalOrg
  const setIndustryFilter = onIndustryFilterChange ?? setLocalIndustry
  const setSearchText = onSearchTextChange ?? setLocalSearch
  const setSortBy = onSortByChange ?? setLocalSort
  const setViewMode = onViewModeChange ?? setLocalView

  // Organization options — derived from enforcementBody field
  const orgItems = useMemo(() => {
    const orgs = new Set<string>()
    for (const fw of sourceFrameworks) {
      if (fw.enforcementBody) orgs.add(fw.enforcementBody)
    }
    return [
      { id: 'All', label: 'All Organizations' },
      ...[...orgs].sort().map((o) => ({ id: o, label: o })),
    ]
  }, [sourceFrameworks])

  // Industry options
  const industryItems = [
    { id: 'All', label: 'All Industries' },
    ...AVAILABLE_INDUSTRIES.filter((i) => i !== 'Other').map((i) => ({ id: i, label: i })),
  ]

  // Sort options as FilterDropdown items
  const sortItems = FRAMEWORK_SORT_OPTIONS.map((o) => ({ id: o.id, label: o.label }))

  // Apply filters + sort
  const displayedFrameworks = useMemo(() => {
    let result = [...sourceFrameworks]

    if (orgFilter !== 'All') {
      result = result.filter((fw) => fw.enforcementBody === orgFilter)
    }
    if (industryFilter !== 'All') {
      result = result.filter((fw) => fw.industries.includes(industryFilter))
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
              <FrameworkCard key={fw.id} fw={fw} />
            ))}
          </div>
        )
      ) : (
        <FrameworkTable frameworks={displayedFrameworks} />
      )}
    </div>
  )
}

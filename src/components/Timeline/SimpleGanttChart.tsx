import { useState, useMemo, useCallback, useRef, Fragment } from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Flag,
  Layers,
  Filter,
  Download,
  X,
} from 'lucide-react'
import type { GanttCountryData, TimelinePhase, Phase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'
import { GanttDetailPopover } from './GanttDetailPopover'
import { DocumentTable } from './DocumentTable'
import { logEvent } from '../../utils/analytics'
import { CountryFlag } from '../common/CountryFlag'
import { FilterDropdown } from '../common/FilterDropdown'
import { StatusBadge } from '../common/StatusBadge'
import { usePersonaStore } from '../../store/usePersonaStore'
import { REGION_COUNTRIES_MAP } from '../../data/personaConfig'

const FilterChip = ({ label, onClear }: { label: string; onClear: () => void }) => (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary font-medium">
    {label}
    <button
      onClick={onClear}
      aria-label={`Remove ${label} filter`}
      className="hover:text-foreground transition-colors"
    >
      <X size={12} />
    </button>
  </span>
)

interface SimpleGanttChartProps {
  data: GanttCountryData[]
  selectedCountry: string
  onCountrySelect: (id: string) => void
  countryItems: Array<{ id: string; label: string; icon: React.ReactNode | null }>
}

const START_YEAR = 2024
const END_YEAR = 2035
const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)
const PHASE_ORDER = [
  'Guidance',
  'Policy',
  'Regulation',
  'Research',
  'Discovery',
  'Testing',
  'POC',
  'Migration',
  'Standardization',
]

export const SimpleGanttChart = ({
  data,
  selectedCountry,
  onCountrySelect,
  countryItems,
}: SimpleGanttChartProps) => {
  const [filterText, setFilterText] = useState('')
  const [sortField, setSortField] = useState<'country' | 'organization'>('country')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null)
  const [selectedPhaseType, setSelectedPhaseType] = useState(() =>
    usePersonaStore.getState().selectedPersona === 'executive' ? 'Deadline' : 'All'
  )
  const [selectedEventType, setSelectedEventType] = useState('All')

  const phaseTypeItems = useMemo(
    () =>
      [
        'Discovery',
        'Testing',
        'POC',
        'Migration',
        'Standardization',
        'Guidance',
        'Policy',
        'Regulation',
        'Research',
        'Deadline',
      ].map((p) => ({ id: p, label: p })),
    []
  )

  const eventTypeItems = useMemo(
    () => [
      { id: 'Phase', label: 'Phases' },
      { id: 'Milestone', label: 'Milestones' },
    ],
    []
  )

  const handleSort = (field: 'country' | 'organization') => {
    if (sortField === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
      setSortDirection(newDirection)
      logEvent('Timeline', `Sort ${field}`, newDirection)
    } else {
      setSortField(field)
      setSortDirection('asc')
      logEvent('Timeline', `Sort ${field}`, 'asc')
    }
  }

  const handlePhaseClick = (phase: TimelinePhase, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPhase(phase)
    logEvent('Timeline', 'View Phase Details', `${phase.phase}: ${phase.title}`)
  }

  const handleClosePopover = () => setSelectedPhase(null)

  const handleFilterBlur = () => {
    if (filterText) logEvent('Timeline', 'Filter Text', filterText)
  }

  const processedData = useMemo(() => {
    const filtered = data.filter((d) => {
      const matchesSearch =
        d.country.countryName.toLowerCase().includes(filterText.toLowerCase()) ||
        d.country.bodies.some((b) => b.name.toLowerCase().includes(filterText.toLowerCase()))
      let matchesRegion: boolean
      if (selectedCountry === 'All') {
        matchesRegion = true
      } else if (selectedCountry.startsWith('region:')) {
        const regionKey = selectedCountry.slice(7) as keyof typeof REGION_COUNTRIES_MAP
        // eslint-disable-next-line security/detect-object-injection
        const regionCountries = REGION_COUNTRIES_MAP[regionKey] ?? []
        matchesRegion = regionCountries.includes(d.country.countryName)
      } else {
        matchesRegion = d.country.countryName === selectedCountry
      }
      return matchesSearch && matchesRegion
    })

    const sorted = filtered.sort((a, b) => {
      let compare = 0
      if (sortField === 'country') {
        compare = a.country.countryName.localeCompare(b.country.countryName)
      } else {
        const aOrg = a.country.bodies[0]?.name || ''
        const bOrg = b.country.bodies[0]?.name || ''
        compare = aOrg.localeCompare(bOrg)
      }
      return sortDirection === 'asc' ? compare : -compare
    })

    // Apply phase type and event type filters, then remove countries with no matching phases
    return sorted
      .map((c) => ({
        ...c,
        phases: c.phases
          .filter((p) => {
            const matchesPhaseType = selectedPhaseType === 'All' || p.phase === selectedPhaseType
            const matchesEventType = selectedEventType === 'All' || p.type === selectedEventType
            return matchesPhaseType && matchesEventType
          })
          .sort((a, b) => {
            const aStart = a.startYear < 2025 ? 2024 : a.startYear
            const bStart = b.startYear < 2025 ? 2024 : b.startYear
            if (aStart !== bStart) return aStart - bStart
            if (a.type !== b.type) return a.type === 'Milestone' ? -1 : 1
            const aIdx = PHASE_ORDER.indexOf(a.phase)
            const bIdx = PHASE_ORDER.indexOf(b.phase)
            const aVal = aIdx === -1 ? 999 : aIdx
            const bVal = bIdx === -1 ? 999 : bIdx
            return aVal - bVal
          }),
      }))
      .filter((c) => c.phases.length > 0)
  }, [
    data,
    filterText,
    sortField,
    sortDirection,
    selectedCountry,
    selectedPhaseType,
    selectedEventType,
  ])

  const totalPhaseCount = useMemo(
    () => processedData.reduce((sum, d) => sum + d.phases.length, 0),
    [processedData]
  )

  const hasActiveFilters =
    selectedCountry !== 'All' ||
    selectedPhaseType !== 'All' ||
    selectedEventType !== 'All' ||
    filterText !== ''

  const clearAllFilters = useCallback(() => {
    setFilterText('')
    setSelectedPhaseType('All')
    setSelectedEventType('All')
    onCountrySelect('All')
  }, [onCountrySelect])

  const handleExportCSV = useCallback(() => {
    if (processedData.length === 0) return

    const rows = processedData.flatMap((countryData) =>
      countryData.phases.map((phase) => ({
        Country: countryData.country.countryName,
        Organization: countryData.country.bodies.map((b) => b.name).join(', '),
        Phase: phase.phase,
        Type: phase.type,
        Title: phase.title,
        'Start Year': phase.startYear,
        'End Year': phase.endYear,
        Description: phase.description,
        Status: phase.status || '',
      }))
    )

    const header = Object.keys(rows[0]).join(',')
    const csvRows = rows.map((row) =>
      Object.values(row)
        .map((val) => {
          const str = String(val)
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(',')
    )
    const csv = [header, ...csvRows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `pqc_timeline_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    logEvent('Timeline', 'Export CSV', `${rows.length} rows`)
  }, [processedData])

  const tableRef = useRef<HTMLDivElement>(null)

  const handlePhaseKeyDown = useCallback(
    (e: React.KeyboardEvent, phaseData: TimelinePhase, rowIdx: number, phaseIdx: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handlePhaseClick(phaseData, e as unknown as React.MouseEvent)
        return
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))
        return
      e.preventDefault()

      const container = tableRef.current
      if (!container) return

      let targetSelector = ''
      if (e.key === 'ArrowUp' && rowIdx > 0) {
        targetSelector = `[data-phase-row="${rowIdx - 1}"]`
      } else if (e.key === 'ArrowDown') {
        targetSelector = `[data-phase-row="${rowIdx + 1}"]`
      } else if (e.key === 'ArrowLeft' && phaseIdx > 0) {
        targetSelector = `[data-phase-row="${rowIdx}"][data-phase-col="${phaseIdx - 1}"]`
      } else if (e.key === 'ArrowRight') {
        targetSelector = `[data-phase-row="${rowIdx}"][data-phase-col="${phaseIdx + 1}"]`
      } else if (e.key === 'Home') {
        targetSelector = `[data-phase-row="${rowIdx}"][data-phase-col="0"]`
      } else if (e.key === 'End') {
        // Find last phase in this row
        const allInRow = container.querySelectorAll(`[data-phase-row="${rowIdx}"]`)
        if (allInRow.length > 0) {
          ;(allInRow[allInRow.length - 1] as HTMLElement).focus()
          return
        }
      }

      if (targetSelector) {
        const target = container.querySelector(targetSelector) as HTMLElement | null
        target?.focus()
      }
    },
    []
  )

  const renderPhaseCells = (phaseData: TimelinePhase, rowIdx: number, phaseIdx: number) => {
    const cells: React.ReactNode[] = []
    const startYear = Math.max(START_YEAR, phaseData.startYear)
    const endYear = Math.min(END_YEAR, phaseData.endYear)
    const colors = phaseColors[phaseData.phase as Phase] || {
      start: 'hsl(var(--muted-foreground))',
      end: 'hsl(var(--muted))',
      glow: 'hsl(var(--ring))',
    }
    const isMilestone = phaseData.type === 'Milestone'

    for (let year = START_YEAR; year <= END_YEAR; year++) {
      const isInPhase = year >= startYear && year <= endYear
      const isFirst = year === startYear
      const isLast = year === endYear
      if (isInPhase) {
        cells.push(
          <td
            key={year}
            className="p-0 h-10 overflow-visible relative"
            style={{
              borderRight: isLast ? '1px solid var(--color-border)' : 'none',
              backgroundColor: isMilestone ? 'transparent' : colors.start,
              boxShadow: isMilestone ? 'none' : `0 0 8px ${colors.glow}`,
              opacity: isMilestone ? 1 : 0.9,
              zIndex: isFirst || isMilestone ? 20 : 0,
              contain: 'layout style', // Optimize WebKit rendering
            }}
          >
            <button
              className={`w-full h-full relative flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] border-0 bg-transparent ${isFirst || isMilestone ? 'z-20' : 'z-0'}`}
              onClick={(e) => handlePhaseClick(phaseData, e)}
              onKeyDown={(e) => handlePhaseKeyDown(e, phaseData, rowIdx, phaseIdx)}
              data-phase-row={rowIdx}
              data-phase-col={phaseIdx}
              aria-label={`${phaseData.phase}: ${phaseData.title}`}
              tabIndex={isFirst ? 0 : -1}
            >
              {isMilestone && isFirst ? (
                <div className="relative flex items-center justify-center">
                  <Flag
                    data-testid="milestone-flag"
                    className="w-4 h-4"
                    style={{ color: colors.start, fill: colors.start }}
                  />
                  <span
                    className="absolute left-full ml-1 text-[9px] font-semibold whitespace-nowrap select-none pointer-events-none z-20 drop-shadow-md"
                    style={{ color: colors.start }}
                  >
                    {phaseData.phase}
                  </span>
                  {phaseData.status && (
                    <div className="absolute -top-3 -right-3 z-20 scale-75 origin-bottom-left">
                      <StatusBadge status={phaseData.status} size="sm" />
                    </div>
                  )}
                </div>
              ) : isFirst && !isMilestone ? (
                <div className="relative flex items-center">
                  <span className="absolute left-2 text-[10px] font-bold text-white bg-black/40 px-1 rounded whitespace-nowrap drop-shadow-md select-none z-20 pointer-events-none">
                    {phaseData.phase}
                  </span>
                  {phaseData.status && (
                    <div className="absolute -top-2 -right-3 z-20 scale-75 origin-top-left">
                      <StatusBadge status={phaseData.status} size="sm" />
                    </div>
                  )}
                </div>
              ) : null}
            </button>
          </td>
        )
      } else {
        cells.push(<td key={year} className="p-0 h-10 border-r border-border"></td>)
      }
    }
    return cells
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 mb-2 flex flex-col md:flex-row items-center gap-4 relative z-40">
        <div className="flex items-center gap-2 w-full md:w-auto text-xs">
          <div className="flex-1 min-w-[150px]">
            <FilterDropdown
              items={countryItems}
              selectedId={selectedCountry}
              onSelect={onCountrySelect}
              defaultLabel="Country"
              opaque
              className="mb-0 w-full"
              noContainer
            />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto text-xs">
          <div className="flex-1 min-w-[120px]">
            <FilterDropdown
              items={phaseTypeItems}
              selectedId={selectedPhaseType}
              onSelect={(id) => {
                setSelectedPhaseType(id)
                logEvent('Timeline', 'Filter Phase Type', id)
              }}
              defaultLabel="All Phases"
              defaultIcon={<Layers size={16} className="text-primary" />}
              opaque
              className="mb-0 w-full"
              noContainer
            />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto text-xs">
          <div className="flex-1 min-w-[120px]">
            <FilterDropdown
              items={eventTypeItems}
              selectedId={selectedEventType}
              onSelect={(id) => {
                setSelectedEventType(id)
                logEvent('Timeline', 'Filter Event Type', id)
              }}
              defaultLabel="All Types"
              defaultIcon={<Filter size={16} className="text-primary" />}
              opaque
              className="mb-0 w-full"
              noContainer
            />
          </div>
        </div>
        <span className="hidden md:inline text-muted-foreground px-2">Search:</span>
        <div className="relative flex-1 min-w-[200px] w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Filter by country..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            onBlur={handleFilterBlur}
            className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => {
            const next = selectedPhaseType === 'Deadline' ? 'All' : 'Deadline'
            setSelectedPhaseType(next)
            logEvent('Timeline', 'Quick Filter Deadlines', next)
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors whitespace-nowrap ${
            selectedPhaseType === 'Deadline'
              ? 'bg-destructive/20 border-destructive/50 text-destructive hover:bg-destructive/30'
              : 'bg-muted/30 hover:bg-muted/50 border-border text-foreground'
          }`}
          aria-label="Show deadlines only"
        >
          <Flag size={16} />
          <span className="hidden md:inline">Deadlines</span>
        </button>
        <button
          onClick={handleExportCSV}
          disabled={processedData.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border text-sm text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          aria-label="Export filtered timeline as CSV"
        >
          <Download size={16} />
          <span className="hidden md:inline">Export CSV</span>
        </button>
      </div>

      {/* Active filter chips + result count */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          {selectedCountry !== 'All' && (
            <FilterChip label={selectedCountry} onClear={() => onCountrySelect('All')} />
          )}
          {selectedPhaseType !== 'All' && (
            <FilterChip label={selectedPhaseType} onClear={() => setSelectedPhaseType('All')} />
          )}
          {selectedEventType !== 'All' && (
            <FilterChip
              label={selectedEventType === 'Phase' ? 'Phases only' : 'Milestones only'}
              onClear={() => setSelectedEventType('All')}
            />
          )}
          {filterText && <FilterChip label={`"${filterText}"`} onClear={() => setFilterText('')} />}
          <span className="text-xs text-muted-foreground">
            {totalPhaseCount} {totalPhaseCount === 1 ? 'result' : 'results'}
            {processedData.length !== data.length
              ? ` · ${processedData.length} of ${data.length} countries`
              : ''}
          </span>
        </div>
      )}

      {/* Empty state */}
      {processedData.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No results match your filters.</p>
          <button onClick={clearAllFilters} className="mt-2 text-primary text-xs hover:underline">
            Clear all filters
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card" ref={tableRef}>
        <table className="w-full min-w-[1000px] border-collapse table-fixed">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-30 bg-background p-4 text-left w-[180px] cursor-pointer hover:bg-muted/50 transition-colors border-b border-r border-border"
                onClick={() => handleSort('country')}
                style={{ willChange: 'transform' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">Country</span>
                  {sortField === 'country' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4 text-primary" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-primary" />
                    ))}
                  {sortField !== 'country' && (
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground opacity-50" />
                  )}
                </div>
              </th>
              <th
                className="sticky left-[180px] z-30 bg-background p-4 text-left w-[200px] cursor-pointer hover:bg-muted/50 transition-colors border-b border-r border-border"
                onClick={() => handleSort('organization')}
                style={{ willChange: 'transform' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">Organization</span>
                  {sortField === 'organization' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4 text-primary" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-primary" />
                    ))}
                  {sortField !== 'organization' && (
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground opacity-50" />
                  )}
                </div>
              </th>
              {YEARS.map((year) => (
                <th
                  key={year}
                  className="p-2 text-center min-w-[80px] bg-background/80 border-b border-r border-border"
                >
                  <span
                    className={`font-mono text-sm ${year === new Date().getFullYear() ? 'text-foreground font-bold' : 'text-muted-foreground'}`}
                  >
                    {year === 2024 ? '<2024' : year}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              let globalRowIdx = 0
              return processedData.map((countryData) => {
                const { country, phases } = countryData
                const totalRows = phases.length
                return (
                  <Fragment key={country.countryName}>
                    {phases.map((phaseData, idx) => {
                      const currentRowIdx = globalRowIdx++
                      const isLastRow = idx === totalRows - 1
                      return (
                        <tr
                          key={`${country.countryName}-${phaseData.phase}-${idx}`}
                          className="hover:bg-muted/50 transition-colors"
                          style={
                            isLastRow
                              ? { borderBottom: '1px solid var(--color-border)' }
                              : undefined
                          }
                        >
                          {idx === 0 && (
                            <td
                              rowSpan={totalRows}
                              className="sticky left-0 z-20 bg-background p-3 align-top border-r border-border"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex items-center justify-center w-5 h-3.5 flex-shrink-0 overflow-hidden rounded-sm"
                                  aria-label={`Flag of ${country.countryName}`}
                                >
                                  <CountryFlag
                                    code={country.flagCode}
                                    width={20}
                                    height={14}
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-bold text-foreground text-sm">
                                  {country.countryName}
                                </span>
                              </div>
                            </td>
                          )}
                          {idx === 0 && (
                            <td
                              rowSpan={totalRows}
                              className="sticky left-[180px] z-20 bg-background p-3 align-top border-r border-border"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {country.bodies[0].name}
                                </span>
                              </div>
                            </td>
                          )}
                          {renderPhaseCells(phaseData, currentRowIdx, idx)}
                        </tr>
                      )
                    })}
                  </Fragment>
                )
              })
            })()}
          </tbody>
        </table>
      </div>

      {/* Document Table — appears below Gantt when a country filter is active */}
      {selectedCountry !== 'All' && processedData.length > 0 && (
        <DocumentTable data={processedData} title={`Documents · ${selectedCountry}`} />
      )}

      <GanttDetailPopover
        isOpen={!!selectedPhase}
        onClose={handleClosePopover}
        phase={selectedPhase}
      />
    </div>
  )
}

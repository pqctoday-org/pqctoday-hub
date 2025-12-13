import { useState, useMemo, Fragment } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Flag } from 'lucide-react'
import type { GanttCountryData, TimelinePhase, Phase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'
import { GanttDetailPopover } from './GanttDetailPopover'
import { logEvent } from '../../utils/analytics'
import { CountryFlag } from '../common/CountryFlag'
import { FilterDropdown } from '../common/FilterDropdown'
import { StatusBadge } from '../common/StatusBadge'

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
      const matchesRegion = selectedCountry === 'All' || d.country.countryName === selectedCountry
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

    return sorted.map((c) => ({
      ...c,
      phases: c.phases.sort((a, b) => {
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
  }, [data, filterText, sortField, sortDirection, selectedCountry])

  const renderPhaseCells = (phaseData: TimelinePhase) => {
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
            }}
          >
            <button
              className={`w-full h-full relative flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] border-0 bg-transparent ${isFirst || isMilestone ? 'z-20' : 'z-0'}`}
              onClick={(e) => handlePhaseClick(phaseData, e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePhaseClick(phaseData, e as unknown as React.MouseEvent)
                }
              }}
              aria-label={`${phaseData.phase}: ${phaseData.title}`}
            >
              {isMilestone && isFirst ? (
                <div className="relative flex items-center justify-center">
                  <Flag
                    data-testid="milestone-flag"
                    className="w-4 h-4"
                    style={{ color: colors.start, fill: colors.start }}
                  />
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
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 mb-2 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto text-xs">
          <div className="flex-1 min-w-[150px]">
            <FilterDropdown
              items={countryItems}
              selectedId={selectedCountry}
              onSelect={onCountrySelect}
              defaultLabel="Region"
              opaque
              className="mb-0 w-full"
              noContainer
              variant="ghost"
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <table className="w-full min-w-[1000px] border-collapse table-fixed">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-30 bg-background p-4 text-left w-[180px] cursor-pointer hover:bg-muted/50 transition-colors border-b border-r border-border"
                onClick={() => handleSort('country')}
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
            {processedData.map((countryData) => {
              const { country, phases } = countryData
              const totalRows = phases.length
              return (
                <Fragment key={country.countryName}>
                  {phases.map((phaseData, idx) => {
                    const isLastRow = idx === totalRows - 1
                    return (
                      <tr
                        key={`${country.countryName}-${phaseData.phase}-${idx}`}
                        className="hover:bg-muted/50 transition-colors"
                        style={
                          isLastRow ? { borderBottom: '1px solid var(--color-border)' } : undefined
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
                        {renderPhaseCells(phaseData)}
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <GanttDetailPopover
        isOpen={!!selectedPhase}
        onClose={handleClosePopover}
        phase={selectedPhase}
      />
    </div>
  )
}

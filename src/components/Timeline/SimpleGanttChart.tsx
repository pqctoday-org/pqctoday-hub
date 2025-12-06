import { useState, useMemo, Fragment } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Flag } from 'lucide-react'
import type { GanttCountryData, TimelinePhase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'
import { GanttDetailPopover } from './GanttDetailPopover'
import { logEvent } from '../../utils/analytics'
import { CountryFlag } from '../common/CountryFlag'
import { FilterDropdown } from '../common/FilterDropdown'

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
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)

  const processedData = useMemo(() => {
    const filtered = data.filter(
      (d) =>
        d.country.countryName.toLowerCase().includes(filterText.toLowerCase()) ||
        d.country.bodies.some((b) => b.name.toLowerCase().includes(filterText.toLowerCase()))
    )

    const sortedCountries = filtered.sort((a, b) => {
      let compareValue = 0

      if (sortField === 'country') {
        const nameA = a.country.countryName.toLowerCase()
        const nameB = b.country.countryName.toLowerCase()
        compareValue = nameA.localeCompare(nameB)
      } else if (sortField === 'organization') {
        const orgA = a.country.bodies[0]?.name.toLowerCase() || ''
        const orgB = b.country.bodies[0]?.name.toLowerCase() || ''
        compareValue = orgA.localeCompare(orgB)
      }

      return sortDirection === 'asc' ? compareValue : -compareValue
    })

    return sortedCountries.map((country) => ({
      ...country,
      phases: country.phases.sort((a, b) => {
        // Primary sort: Start Year (grouping < 2025)
        const startA = a.startYear < 2025 ? 2024 : a.startYear
        const startB = b.startYear < 2025 ? 2024 : b.startYear

        if (startA !== startB) {
          return startA - startB
        }

        // Secondary sort: Type (Milestone before Phase)
        if (a.type !== b.type) {
          return a.type === 'Milestone' ? -1 : 1
        }

        // Tertiary sort: Phase Order
        const indexA = PHASE_ORDER.indexOf(a.phase)
        const indexB = PHASE_ORDER.indexOf(b.phase)
        // Put unknown phases at the end
        const valA = indexA === -1 ? 999 : indexA
        const valB = indexB === -1 ? 999 : indexB
        return valA - valB
      }),
    }))
  }, [data, filterText, sortField, sortDirection])

  const handleSort = (field: 'country' | 'organization') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    logEvent('Timeline', `Sort ${field}`, sortDirection === 'asc' ? 'desc' : 'asc')
  }

  const handlePhaseClick = (phase: TimelinePhase, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
    setSelectedPhase(phase)
    logEvent('Timeline', 'View Phase Details', `${phase.phase}: ${phase.title}`)
  }

  const handleClosePopover = () => {
    setSelectedPhase(null)
    setPopoverPosition(null)
  }

  const handleFilterBlur = () => {
    if (filterText) {
      logEvent('Timeline', 'Filter Text', filterText)
    }
  }

  const renderPhaseCells = (phaseData: TimelinePhase) => {
    const cells = []

    // Calculate start and end indices relative to our year range
    const startYear = Math.max(START_YEAR, phaseData.startYear)
    const endYear = Math.min(END_YEAR, phaseData.endYear)

    // If phase is completely out of range, render empty cells
    if (phaseData.endYear < START_YEAR || phaseData.startYear > END_YEAR) {
      for (let year = START_YEAR; year <= END_YEAR; year++) {
        cells.push(<td key={year} className="p-0 h-10 border-r border-border"></td>)
      }
      return cells
    }

    const colors = phaseColors[phaseData.phase] || {
      start: 'hsl(var(--muted-foreground))',
      end: 'hsl(var(--muted))',
      glow: 'hsl(var(--ring))',
    }
    const isMilestone = phaseData.type === 'Milestone'

    for (let year = START_YEAR; year <= END_YEAR; year++) {
      const isInPhase = year >= startYear && year <= endYear
      const isFirstInPhase = year === startYear
      const isLastInPhase = year === endYear

      if (isInPhase) {
        cells.push(
          <td
            key={year}
            className="p-0 h-10"
            style={{
              borderRight: isLastInPhase ? '1px solid var(--color-border)' : 'none',
              backgroundColor: isMilestone ? 'transparent' : colors.start,
              boxShadow: isMilestone ? 'none' : `0 0 8px ${colors.glow}`,
              opacity: isMilestone ? 1 : 0.9,
            }}
          >
            <button
              className="w-full h-full relative flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] border-0 bg-transparent"
              onClick={(e) => handlePhaseClick(phaseData, e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePhaseClick(phaseData, e as unknown as React.MouseEvent)
                }
              }}
              aria-label={`${phaseData.phase}: ${phaseData.title}`}
            >
              {isMilestone && isFirstInPhase ? (
                <Flag className="w-4 h-4" style={{ color: colors.start, fill: colors.start }} />
              ) : isFirstInPhase && !isMilestone ? (
                <span className="absolute left-2 text-[10px] font-bold text-white bg-black/40 px-1 rounded whitespace-nowrap drop-shadow-md select-none z-10 pointer-events-none">
                  {phaseData.phase}
                </span>
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
      {/* Grouped Filter Container */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex flex-wrap items-center gap-4">
        <FilterDropdown
          items={countryItems}
          selectedId={selectedCountry}
          onSelect={onCountrySelect}
          label="Select Region"
          defaultLabel="All Countries"
          opaque
          noContainer
          className="mb-0"
        />

        <span className="text-muted-foreground px-2">Search:</span>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by country..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            onBlur={handleFilterBlur}
            className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <table
          className="w-full min-w-[1000px]"
          style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
        >
          <thead>
            <tr>
              <th
                className="sticky left-0 z-30 bg-background p-4 text-left w-[180px] cursor-pointer hover:bg-muted/50 transition-colors"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  borderRight: '1px solid var(--color-border)',
                }}
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
                className="sticky left-[180px] z-30 bg-background p-4 text-left w-[200px] cursor-pointer hover:bg-muted/50 transition-colors"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  borderRight: '1px solid var(--color-border)',
                }}
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
                  className="p-2 text-center min-w-[80px] bg-background/80"
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    borderRight: '1px solid var(--color-border)',
                  }}
                >
                  <span
                    className={`font-mono text-sm ${year === new Date().getFullYear() ? 'text-primary font-bold' : 'text-muted-foreground'}`}
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
                  {phases.map((phaseData, index) => {
                    const isLastRow = index === totalRows - 1
                    return (
                      <tr
                        key={`${country.countryName}-${phaseData.phase}-${index}`}
                        className="hover:bg-muted/50 transition-colors"
                        style={
                          isLastRow ? { borderBottom: '1px solid var(--color-border)' } : undefined
                        }
                      >
                        {/* Country Cell - Only on first row */}
                        {index === 0 && (
                          <td
                            rowSpan={totalRows}
                            className="sticky left-0 z-20 bg-background p-3 align-top"
                            style={{ borderRight: '1px solid var(--color-border)' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '20px',
                                  height: '14px',
                                  flexShrink: 0,
                                  overflow: 'hidden',
                                  borderRadius: '2px',
                                }}
                                aria-label={`Flag of ${country.countryName}`}
                              >
                                <CountryFlag
                                  code={country.flagCode}
                                  width={20}
                                  height={14}
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                              <span className="font-bold text-foreground text-sm">
                                {country.countryName}
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Organization Cell - Only on first row */}
                        {index === 0 && (
                          <td
                            rowSpan={totalRows}
                            className="sticky left-[180px] z-20 bg-background p-3 align-top"
                            style={{ borderRight: '1px solid var(--color-border)' }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {country.bodies[0].name}
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Phase/Milestone Cells */}
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
        position={popoverPosition}
      />
    </div>
  )
}

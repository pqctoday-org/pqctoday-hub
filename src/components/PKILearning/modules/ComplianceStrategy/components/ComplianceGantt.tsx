// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, Fragment } from 'react'
import { Flag, ClipboardList, ShieldCheck } from 'lucide-react'
import type { TimelinePhase, Phase, CountryData } from '@/types/timeline'
import { phaseColors } from '@/data/timelineData'
import { CountryFlag } from '@/components/common/CountryFlag'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'

export interface ComplianceGanttRow {
  country: CountryData
  bodyName: string
  bodyFullName: string
  phases: TimelinePhase[]
}

export interface UserMilestone {
  id: string
  label: string
  year: number
  quarter?: 1 | 2 | 3 | 4
  category?: string
}

export interface ComplianceDeadline {
  key: string
  label: string
  year: number
  status: 'completed' | 'on-track' | 'at-risk'
}

const MILESTONE_CATEGORY_COLORS: Record<string, { color: string; glow: string }> = {
  Assessment: {
    color: 'hsl(var(--phase-discovery))',
    glow: 'hsl(var(--phase-discovery) / 0.5)',
  },
  Remediation: {
    color: 'hsl(var(--phase-migration))',
    glow: 'hsl(var(--phase-migration) / 0.5)',
  },
  Certification: {
    color: 'hsl(var(--phase-standardization))',
    glow: 'hsl(var(--phase-standardization) / 0.5)',
  },
  Reporting: {
    color: 'hsl(var(--phase-guidance))',
    glow: 'hsl(var(--phase-guidance) / 0.5)',
  },
  Renewal: {
    color: 'hsl(var(--phase-poc))',
    glow: 'hsl(var(--phase-poc) / 0.5)',
  },
}

const DEFAULT_MILESTONE_COLOR = {
  color: 'hsl(var(--primary))',
  glow: 'hsl(var(--primary) / 0.5)',
}

interface ComplianceGanttProps {
  rows: ComplianceGanttRow[]
  milestones: UserMilestone[]
  complianceDeadlines?: ComplianceDeadline[]
  yearRange: [number, number]
  onPhaseClick: (phase: TimelinePhase) => void
}

export const ComplianceGantt: React.FC<ComplianceGanttProps> = ({
  rows,
  milestones,
  complianceDeadlines = [],
  yearRange,
  onPhaseClick,
}) => {
  const [startYear, endYear] = yearRange
  const years = useMemo(() => {
    const arr: number[] = []
    for (let y = startYear; y <= endYear; y++) arr.push(y)
    return arr
  }, [startYear, endYear])

  const currentYear = new Date().getFullYear()

  // Group rows by country for rowSpan calculation
  const countryGroups = useMemo(() => {
    const groups: Array<{
      countryName: string
      flagCode: string
      rows: ComplianceGanttRow[]
      totalPhaseRows: number
    }> = []

    let currentGroup: (typeof groups)[0] | null = null
    for (const row of rows) {
      if (!currentGroup || currentGroup.countryName !== row.country.countryName) {
        currentGroup = {
          countryName: row.country.countryName,
          flagCode: row.country.flagCode,
          rows: [],
          totalPhaseRows: 0,
        }
        groups.push(currentGroup)
      }
      currentGroup.rows.push(row)
      currentGroup.totalPhaseRows += row.phases.length
    }
    return groups
  }, [rows])

  // Collect phase types present in data for legend
  const presentPhases = useMemo(() => {
    const phases = new Set<Phase>()
    for (const row of rows) {
      for (const p of row.phases) phases.add(p.phase as Phase)
    }
    return Array.from(phases)
  }, [rows])

  const milestoneCategories = useMemo(() => {
    const cats = new Set<string>()
    for (const m of milestones) {
      if (m.category) cats.add(m.category)
    }
    return Array.from(cats)
  }, [milestones])

  // Render phase cells for one phase row (adapted from SimpleGanttChart)
  const renderPhaseCells = (phaseData: TimelinePhase) => {
    const cells: React.ReactNode[] = []
    const phaseStart = Math.max(startYear, phaseData.startYear)
    const phaseEnd = Math.min(endYear, phaseData.endYear)
    const colors = phaseColors[phaseData.phase as Phase] || {
      start: 'hsl(var(--muted-foreground))',
      end: 'hsl(var(--muted))',
      glow: 'hsl(var(--ring))',
    }
    const isMilestone = phaseData.type === 'Milestone'

    for (const year of years) {
      const isInPhase = year >= phaseStart && year <= phaseEnd
      const isFirst = year === phaseStart
      const isLast = year === phaseEnd

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
              contain: 'layout style',
            }}
          >
            <Button
              variant="ghost"
              className={`w-full h-full relative flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] border-0 bg-transparent ${isFirst || isMilestone ? 'z-20' : 'z-0'}`}
              onClick={() => onPhaseClick(phaseData)}
              aria-label={`${phaseData.phase}: ${phaseData.title}`}
              tabIndex={isFirst ? 0 : -1}
            >
              {isMilestone && isFirst ? (
                <div className="relative flex items-center justify-center">
                  <Flag className="w-4 h-4" style={{ color: colors.start, fill: colors.start }} />
                  <span
                    className="absolute left-full ml-1 text-[10px] font-semibold whitespace-nowrap select-none pointer-events-none z-20 drop-shadow-md"
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
                  <span className="absolute left-2 text-[10px] font-bold text-foreground bg-background/70 px-1 rounded whitespace-nowrap drop-shadow-md select-none z-20 pointer-events-none">
                    {phaseData.phase}
                  </span>
                  {phaseData.status && (
                    <div className="absolute -top-2 -right-3 z-20 scale-75 origin-top-left">
                      <StatusBadge status={phaseData.status} size="sm" />
                    </div>
                  )}
                </div>
              ) : null}
            </Button>
          </td>
        )
      } else {
        cells.push(<td key={year} className="p-0 h-10 border-r border-border" />)
      }
    }
    return cells
  }

  // Render milestone cells for the "Your Plan" row
  const renderMilestoneCells = () => {
    // Group milestones by year
    const milestonesByYear = new Map<number, UserMilestone[]>()
    for (const m of milestones) {
      const existing = milestonesByYear.get(m.year) ?? []
      existing.push(m)
      milestonesByYear.set(m.year, existing)
    }

    return years.map((year) => {
      const yearMilestones = milestonesByYear.get(year)
      if (yearMilestones && yearMilestones.length > 0) {
        const first = yearMilestones[0]
        const catColors = MILESTONE_CATEGORY_COLORS[first.category || ''] || DEFAULT_MILESTONE_COLOR
        return (
          <td key={year} className="p-0 h-10 overflow-visible relative border-r border-border">
            <div
              className="w-full h-full flex items-center justify-center relative"
              style={{ zIndex: 20 }}
            >
              <Flag className="w-4 h-4" style={{ color: catColors.color, fill: catColors.color }} />
              <span
                className="absolute left-full ml-1 text-[10px] font-semibold whitespace-nowrap select-none pointer-events-none z-20 drop-shadow-md max-w-[80px] truncate"
                style={{ color: catColors.color }}
                title={yearMilestones.map((m) => m.label).join(', ')}
              >
                {first.label}
                {yearMilestones.length > 1 ? ` +${yearMilestones.length - 1}` : ''}
              </span>
            </div>
          </td>
        )
      }
      return <td key={year} className="p-0 h-10 border-r border-border" />
    })
  }

  if (rows.length === 0 && milestones.length === 0 && complianceDeadlines.length === 0) return null

  const totalUserPlanRows = milestones.length > 0 ? 1 : 0

  return (
    <div className="space-y-4">
      {/* Gantt Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[900px] border-collapse table-fixed">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-30 bg-background p-3 text-left w-[160px] border-b border-r border-border"
                style={{ willChange: 'transform' }}
              >
                <span className="font-bold text-foreground text-sm">Country</span>
              </th>
              <th
                className="sticky left-[160px] z-30 bg-background p-3 text-left w-[180px] border-b border-r border-border"
                style={{ willChange: 'transform' }}
              >
                <span className="font-bold text-foreground text-sm">Organization</span>
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  className="p-2 text-center min-w-[70px] bg-background/80 border-b border-r border-border"
                >
                  <span
                    className={`font-mono text-sm ${year === currentYear ? 'text-foreground font-bold' : 'text-muted-foreground'}`}
                  >
                    {year}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countryGroups.map((group) => {
              let countryRowRendered = false
              return (
                <Fragment key={group.countryName}>
                  {group.rows.map((row, bodyIdx) => {
                    let bodyRowRendered = false
                    return row.phases.map((phaseData, phaseIdx) => {
                      const showCountryCell = !countryRowRendered
                      const showBodyCell = !bodyRowRendered
                      if (showCountryCell) countryRowRendered = true
                      if (showBodyCell) bodyRowRendered = true

                      const isLastPhaseInGroup =
                        bodyIdx === group.rows.length - 1 && phaseIdx === row.phases.length - 1

                      return (
                        <tr
                          key={`${group.countryName}-${row.bodyName}-${phaseIdx}`}
                          className="hover:bg-muted/50 transition-colors"
                          style={
                            isLastPhaseInGroup
                              ? { borderBottom: '1px solid var(--color-border)' }
                              : undefined
                          }
                        >
                          {showCountryCell && (
                            <td
                              rowSpan={group.totalPhaseRows}
                              className="sticky left-0 z-20 bg-background p-3 align-top border-r border-border"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-5 h-3.5 flex-shrink-0 overflow-hidden rounded-sm">
                                  <CountryFlag
                                    code={group.flagCode}
                                    width={20}
                                    height={14}
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-bold text-foreground text-sm">
                                  {group.countryName}
                                </span>
                              </div>
                            </td>
                          )}
                          {showBodyCell && (
                            <td
                              rowSpan={row.phases.length}
                              className="sticky left-[160px] z-20 bg-background p-3 align-top border-r border-border"
                            >
                              <span className="text-xs text-muted-foreground">{row.bodyName}</span>
                            </td>
                          )}
                          {renderPhaseCells(phaseData)}
                        </tr>
                      )
                    })
                  })}
                </Fragment>
              )
            })}

            {/* Compliance deadline rows */}
            {complianceDeadlines.length > 0 &&
              complianceDeadlines.map((dl, dlIdx) => (
                <tr
                  key={dl.key}
                  className="hover:bg-muted/50 transition-colors"
                  style={dlIdx === 0 ? { borderTop: '2px solid var(--color-border)' } : undefined}
                >
                  {dlIdx === 0 && (
                    <td
                      rowSpan={complianceDeadlines.length}
                      className="sticky left-0 z-20 bg-background p-3 align-top border-r border-border"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-accent shrink-0" />
                        <span className="font-bold text-accent text-sm">Compliance</span>
                      </div>
                    </td>
                  )}
                  <td className="sticky left-[160px] z-20 bg-background p-3 align-top border-r border-border">
                    <span
                      className="text-xs text-muted-foreground truncate block max-w-[160px]"
                      title={dl.label}
                    >
                      {dl.label}
                    </span>
                  </td>
                  {years.map((year) => {
                    if (year === dl.year) {
                      const color =
                        dl.status === 'at-risk'
                          ? 'hsl(var(--phase-regulation))'
                          : dl.status === 'completed'
                            ? 'hsl(var(--status-success))'
                            : 'hsl(var(--phase-deadline))'
                      return (
                        <td
                          key={year}
                          className="p-0 h-10 overflow-visible relative border-r border-border"
                        >
                          <div
                            className="w-full h-full flex items-center justify-center relative"
                            style={{ zIndex: 20 }}
                          >
                            <Flag className="w-4 h-4" style={{ color, fill: color }} />
                          </div>
                        </td>
                      )
                    }
                    return <td key={year} className="p-0 h-10 border-r border-border" />
                  })}
                </tr>
              ))}

            {/* Your Plan milestone row */}
            {totalUserPlanRows > 0 && (
              <tr
                className="hover:bg-muted/50 transition-colors"
                style={{ borderTop: '2px solid var(--color-border)' }}
              >
                <td className="sticky left-0 z-20 bg-background p-3 align-top border-r border-border">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-primary shrink-0" />
                    <span className="font-bold text-primary text-sm">Your Plan</span>
                  </div>
                </td>
                <td className="sticky left-[160px] z-20 bg-background p-3 align-top border-r border-border">
                  <span className="text-xs text-muted-foreground">Milestones</span>
                </td>
                {renderMilestoneCells()}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phase Legend */}
      {(presentPhases.length > 0 ||
        milestoneCategories.length > 0 ||
        complianceDeadlines.length > 0) && (
        <div className="flex flex-wrap gap-3 px-1">
          {presentPhases.map((phase) => {
            // eslint-disable-next-line security/detect-object-injection
            const colors = phaseColors[phase]
            return (
              <div key={phase} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: colors.start, boxShadow: `0 0 4px ${colors.glow}` }}
                />
                <span className="text-xs text-muted-foreground">{phase}</span>
              </div>
            )
          })}
          {milestoneCategories.map((cat) => {
            // eslint-disable-next-line security/detect-object-injection
            const catColors = MILESTONE_CATEGORY_COLORS[cat] || DEFAULT_MILESTONE_COLOR
            return (
              <div key={cat} className="flex items-center gap-1.5">
                <Flag
                  className="w-3 h-3"
                  style={{ color: catColors.color, fill: catColors.color }}
                />
                <span className="text-xs text-muted-foreground">{cat}</span>
              </div>
            )
          })}
          {complianceDeadlines.length > 0 && (
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-accent" />
              <span className="text-xs text-muted-foreground">Compliance Deadline</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

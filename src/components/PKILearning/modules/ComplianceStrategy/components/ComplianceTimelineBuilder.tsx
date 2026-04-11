// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState, useCallback } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Globe,
  Plus,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  X,
} from 'lucide-react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { Button } from '@/components/ui/button'
import { GanttDetailPopover } from '@/components/Timeline/GanttDetailPopover'
import { AskAssistantButton } from '@/components/ui/AskAssistantButton'
import { ExportableArtifact } from '../../../common/executive/ExportableArtifact'
import { ComplianceGantt } from './ComplianceGantt'
import type { ComplianceGanttRow, UserMilestone, ComplianceDeadline } from './ComplianceGantt'
import type { TimelinePhase, TimelineEvent, EventType } from '@/types/timeline'
import { FilterDropdown } from '@/components/common/FilterDropdown'

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

function getDeadlineYear(deadline: string): number | null {
  if (/^ongoing/i.test(deadline.trim())) return null
  const matches = deadline.match(/\b(2\d{3})\b/g)
  if (!matches) return null
  return Math.min(...matches.map(Number))
}

/** Group a single body's events into TimelinePhase[] (same logic as transformToGanttData in timelineData.ts) */
function groupEventsIntoPhases(events: TimelineEvent[]): TimelinePhase[] {
  const phaseMap = new Map<string, TimelineEvent[]>()

  for (const event of events) {
    // Migration and Deadline get title suffix for unique rows
    let key = event.phase as string
    if (event.phase === 'Migration' || event.phase === 'Deadline') {
      key = `${event.phase}-${event.title}`
    }
    const existing = phaseMap.get(key) ?? []
    existing.push(event)
    phaseMap.set(key, existing)
  }

  const phases: TimelinePhase[] = []
  for (const [, groupEvents] of phaseMap) {
    groupEvents.sort((a, b) => a.startYear - b.startYear)
    const first = groupEvents[0]
    const isMilestoneRow = groupEvents.every((e) => e.type === 'Milestone')
    const rowType: EventType = isMilestoneRow ? 'Milestone' : 'Phase'

    phases.push({
      startYear: Math.min(...groupEvents.map((e) => e.startYear)),
      endYear: Math.max(...groupEvents.map((e) => e.endYear)),
      phase: first.phase,
      type: rowType,
      title: first.title,
      description: first.description,
      events: groupEvents,
      status: groupEvents.some((e) => e.status === 'New')
        ? 'New'
        : groupEvents.some((e) => e.status === 'Updated')
          ? 'Updated'
          : undefined,
    })
  }

  return phases.sort((a, b) => a.startYear - b.startYear)
}

// ---------------------------------------------------------------------------
// Gap analysis
// ---------------------------------------------------------------------------

interface FrameworkDetail {
  type: 'framework'
  description: string
  notes: string
  enforcementBody: string
  deadlineText: string
  requiresPQC: boolean
  libraryRefs: string[]
}

interface TimelineDetail {
  type: 'timeline'
  bodyFullName: string
  phaseTitle: string
  phaseDescription: string
  startYear: number
  endYear: number
}

interface ExternalDeadline {
  key: string
  label: string
  year: number
  source: string
  detail?: FrameworkDetail | TimelineDetail
}

interface GapItem {
  key: string
  framework: string
  deadlineYear: number
  status: 'completed' | 'on-track' | 'at-risk'
  gap: string
  detail?: FrameworkDetail | TimelineDetail
}

function computeGapAnalysis(
  frameworkDeadlines: ExternalDeadline[],
  milestones: UserMilestone[]
): GapItem[] {
  const now = new Date().getFullYear()
  const latestMilestoneYear =
    milestones.length > 0 ? Math.max(...milestones.map((m) => m.year)) : now

  return frameworkDeadlines.map((d) => {
    const yearsRemaining = d.year - now
    const milestonesBeforeDeadline = milestones.filter((m) => m.year <= d.year)
    const hasCertificationMilestone = milestonesBeforeDeadline.some(
      (m) => m.category === 'Certification' || m.category === 'Renewal'
    )

    let status: 'completed' | 'on-track' | 'at-risk'
    let gap: string

    if (d.year <= now && hasCertificationMilestone) {
      status = 'completed'
      gap = 'Deadline met'
    } else if (d.year <= now) {
      status = 'at-risk'
      gap = `Deadline passed ${now - d.year} year${now - d.year !== 1 ? 's' : ''} ago`
    } else if (latestMilestoneYear >= d.year || hasCertificationMilestone) {
      status = 'on-track'
      gap = `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining, plan extends to deadline`
    } else if (yearsRemaining <= 2 && milestones.length === 0) {
      status = 'at-risk'
      gap = `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining, no milestones planned`
    } else if (yearsRemaining <= 3 && latestMilestoneYear < d.year - 1) {
      status = 'at-risk'
      gap = `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining, plan gap of ${d.year - latestMilestoneYear} year${d.year - latestMilestoneYear !== 1 ? 's' : ''}`
    } else {
      status = 'on-track'
      gap = `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining`
    }

    return { key: d.key, framework: d.label, deadlineYear: d.year, status, gap, detail: d.detail }
  })
}

// ---------------------------------------------------------------------------
// Jurisdiction mapping
// ---------------------------------------------------------------------------

const JURISDICTION_COUNTRY_NAMES: Record<string, string[]> = {
  us: ['United States'],
  ca: ['Canada'],
  eu: ['European Union'],
  uk: ['United Kingdom'],
  fr: ['France'],
  de: ['Germany'],
  cz: ['Czech Republic'],
  it: ['Italy'],
  es: ['Spain'],
  jp: ['Japan'],
  kr: ['South Korea'],
  au: ['Australia'],
  sg: ['Singapore'],
  nz: ['New Zealand'],
  cn: ['China'],
  in: ['India'],
  tw: ['Taiwan'],
  hk: ['Hong Kong'],
  my: ['Malaysia'],
  il: ['Israel'],
  ae: ['United Arab Emirates'],
  sa: ['Saudi Arabia'],
  bh: ['Bahrain'],
  jo: ['Jordan'],
}

const MILESTONE_CATEGORIES = ['Assessment', 'Remediation', 'Certification', 'Reporting', 'Renewal']

// ---------------------------------------------------------------------------
// Gap detail sub-component
// ---------------------------------------------------------------------------

function GapDetailPanel({
  detail,
  framework,
}: {
  detail: FrameworkDetail | TimelineDetail
  framework: string
}) {
  if (detail.type === 'framework') {
    return (
      <div className="p-4 rounded-b-lg border border-t-0 border-border bg-muted/10 space-y-3">
        {detail.description && <p className="text-sm text-foreground">{detail.description}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="block text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
              Enforcement Body
            </span>
            <span className="text-foreground">{detail.enforcementBody || '—'}</span>
          </div>
          <div>
            <span className="block text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
              Deadline
            </span>
            <span className="text-foreground font-mono">{detail.deadlineText}</span>
          </div>
          <div>
            <span className="block text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
              Requires PQC
            </span>
            <span className={detail.requiresPQC ? 'text-status-error' : 'text-muted-foreground'}>
              {detail.requiresPQC ? 'Yes' : 'No'}
            </span>
          </div>
          {detail.libraryRefs.length > 0 && (
            <div>
              <span className="block text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                Related Standards
              </span>
              <span className="text-foreground">{detail.libraryRefs.join(', ')}</span>
            </div>
          )}
        </div>
        {detail.notes && (
          <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
            {detail.notes}
          </p>
        )}
        <AskAssistantButton
          variant="text"
          label="Ask about this framework"
          question={`What are the PQC compliance requirements for ${framework}? ${detail.description}`}
        />
      </div>
    )
  }

  return (
    <div className="p-4 rounded-b-lg border border-t-0 border-border bg-muted/10 space-y-3">
      {detail.phaseDescription && (
        <p className="text-sm text-foreground">{detail.phaseDescription}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className="block text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
            Organization
          </span>
          <span className="text-foreground">{detail.bodyFullName}</span>
        </div>
        <div>
          <span className="block text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
            Period
          </span>
          <span className="text-foreground font-mono">
            {detail.startYear}–{detail.endYear}
          </span>
        </div>
        <div>
          <span className="block text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
            Phase
          </span>
          <span className="text-foreground">{detail.phaseTitle}</span>
        </div>
      </div>
      <AskAssistantButton
        variant="text"
        label="Ask about this deadline"
        question={`What is the significance of the ${framework} ${detail.phaseTitle} deadline (${detail.startYear}–${detail.endYear})?`}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ComplianceTimelineBuilderProps {
  selectedJurisdictions: string[]
  dismissedFrameworkIds?: Set<string>
}

export const ComplianceTimelineBuilder: React.FC<ComplianceTimelineBuilderProps> = ({
  selectedJurisdictions,
  dismissedFrameworkIds,
}) => {
  const { frameworks, countryDeadlines } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()

  // Milestone state
  const [milestones, setMilestones] = useState<UserMilestone[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [newYear, setNewYear] = useState(2026)
  const [newCategory, setNewCategory] = useState(MILESTONE_CATEGORIES[0])

  // Popover state
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null)

  // Gap analysis UI state
  const [gapExpanded, setGapExpanded] = useState(true)
  const [expandedGapIdx, setExpandedGapIdx] = useState<number | null>(null)
  const [pinnedDeadlines, setPinnedDeadlines] = useState<Set<string>>(new Set())

  // Resolve jurisdiction IDs to country names
  const selectedCountryNames = useMemo(() => {
    const names = new Set<string>()
    for (const id of selectedJurisdictions) {
      const countryNames = JURISDICTION_COUNTRY_NAMES[id]
      if (countryNames) {
        for (const cn of countryNames) names.add(cn.toLowerCase())
      }
    }
    return names
  }, [selectedJurisdictions])

  // Build per-body Gantt rows from timeline data
  const ganttRows = useMemo<ComplianceGanttRow[]>(() => {
    if (selectedJurisdictions.length === 0) return []

    const rows: ComplianceGanttRow[] = []
    for (const country of countryDeadlines) {
      if (!selectedCountryNames.has(country.countryName.toLowerCase())) continue
      for (const body of country.bodies) {
        const phases = groupEventsIntoPhases(body.events)
        if (phases.length > 0) {
          rows.push({
            country,
            bodyName: body.name,
            bodyFullName: body.fullName,
            phases,
          })
        }
      }
    }
    return rows
  }, [countryDeadlines, selectedJurisdictions, selectedCountryNames])

  // Extract compliance deadlines for gap analysis (Regulation/Deadline phases + framework CSV)
  const externalDeadlines = useMemo(() => {
    if (selectedJurisdictions.length === 0) return []

    const deadlines: ExternalDeadline[] = []
    const seen = new Set<string>()

    // From timeline data: Regulation and Deadline phases
    for (const row of ganttRows) {
      for (const phase of row.phases) {
        if (phase.phase === 'Regulation' || phase.phase === 'Deadline') {
          const key = `${row.bodyName}-${phase.endYear}`
          if (!seen.has(key)) {
            seen.add(key)
            deadlines.push({
              key,
              label: `${row.country.countryName} - ${row.bodyName}`,
              year: phase.endYear,
              source: row.bodyFullName,
              detail: {
                type: 'timeline',
                bodyFullName: row.bodyFullName,
                phaseTitle: phase.title,
                phaseDescription: phase.description,
                startYear: phase.startYear,
                endYear: phase.endYear,
              },
            })
          }
        }
      }
    }

    // From compliance framework CSV
    for (const fw of frameworks) {
      if (dismissedFrameworkIds?.has(fw.id)) continue
      const matchesJurisdiction = fw.countries.some(
        (c) =>
          selectedCountryNames.has(c.toLowerCase()) ||
          Array.from(selectedCountryNames).some(
            (scn) => c.toLowerCase().includes(scn) || scn.includes(c.toLowerCase())
          )
      )
      if (!matchesJurisdiction) continue

      const year = getDeadlineYear(fw.deadline)
      if (year) {
        const key = `fw-${fw.id}-${year}`
        if (!seen.has(key)) {
          seen.add(key)
          deadlines.push({
            key,
            label: fw.label,
            year,
            source: fw.enforcementBody || 'Compliance Framework',
            detail: {
              type: 'framework',
              description: fw.description,
              notes: fw.notes,
              enforcementBody: fw.enforcementBody,
              deadlineText: fw.deadline,
              requiresPQC: fw.requiresPQC,
              libraryRefs: fw.libraryRefs,
            },
          })
        }
      }
    }

    return deadlines.sort((a, b) => a.year - b.year)
  }, [ganttRows, frameworks, selectedJurisdictions, selectedCountryNames, dismissedFrameworkIds])

  // Dynamic year range
  const yearRange = useMemo((): [number, number] => {
    let min = 2024
    let max = 2036
    for (const row of ganttRows) {
      for (const p of row.phases) {
        if (p.startYear < min) min = p.startYear
        if (p.endYear > max) max = p.endYear
      }
    }
    for (const m of milestones) {
      if (m.year > max) max = m.year
    }
    return [Math.max(2024, min), Math.min(2040, max)]
  }, [ganttRows, milestones])

  // Gap analysis
  const gapAnalysis = useMemo(
    () => computeGapAnalysis(externalDeadlines, milestones),
    [externalDeadlines, milestones]
  )

  const atRiskCount = gapAnalysis.filter((g) => g.status === 'at-risk').length
  const onTrackCount = gapAnalysis.filter((g) => g.status === 'on-track').length
  const completedCount = gapAnalysis.filter((g) => g.status === 'completed').length

  // Pinned compliance deadlines for the Gantt chart
  const togglePinned = useCallback((key: string) => {
    setPinnedDeadlines((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const pinnedComplianceDeadlines = useMemo<ComplianceDeadline[]>(
    () =>
      gapAnalysis
        .filter((g) => pinnedDeadlines.has(g.key))
        .map((g) => ({
          key: g.key,
          label: g.framework,
          year: g.deadlineYear,
          status: g.status,
        })),
    [gapAnalysis, pinnedDeadlines]
  )

  // Milestone management
  const addMilestone = useCallback(() => {
    if (!newLabel.trim()) return
    const ms: UserMilestone = {
      id: `ms-${Date.now()}`,
      label: newLabel.trim(),
      year: newYear,
      category: newCategory,
    }
    setMilestones((prev) => [...prev, ms].sort((a, b) => a.year - b.year))
    setNewLabel('')
  }, [newLabel, newYear, newCategory])

  const removeMilestone = useCallback((id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
  }, [])

  // Export markdown
  const exportMarkdown = useMemo(() => {
    let md = '# Compliance Timeline\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`

    if (ganttRows.length > 0) {
      md += '## Regulatory Timeline\n\n'
      md += '| Country | Organization | Phase | Type | Years | Title |\n'
      md += '|---------|-------------|-------|------|-------|-------|\n'
      for (const row of ganttRows) {
        for (const p of row.phases) {
          md += `| ${row.country.countryName} | ${row.bodyName} | ${p.phase} | ${p.type} | ${p.startYear}–${p.endYear} | ${p.title} |\n`
        }
      }
    }

    if (milestones.length > 0) {
      md += '\n## Migration Milestones\n\n'
      md += '| Year | Milestone | Category |\n'
      md += '|------|-----------|----------|\n'
      for (const m of milestones) {
        md += `| ${m.year} | ${m.label} | ${m.category || ''} |\n`
      }
    }

    if (gapAnalysis.length > 0) {
      md += '\n## Gap Analysis\n\n'
      md += '| Framework | Deadline | Status | Notes |\n'
      md += '|-----------|----------|--------|-------|\n'
      for (const g of gapAnalysis) {
        md += `| ${g.framework} | ${g.deadlineYear} | ${g.status.toUpperCase()} | ${g.gap} |\n`
      }
    }

    return md
  }, [ganttRows, milestones, gapAnalysis])

  const handleSaveToDocuments = () => {
    addExecutiveDocument({
      id: `compliance-timeline-${Date.now()}`,
      type: 'compliance-timeline',
      title: 'Compliance Timeline',
      data: exportMarkdown,
      createdAt: Date.now(),
      moduleId: 'compliance-strategy',
    })
  }

  // Year options for the add form
  const yearOptions = useMemo(() => {
    const arr: number[] = []
    for (let y = yearRange[0]; y <= yearRange[1]; y++) arr.push(y)
    return arr
  }, [yearRange])

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (selectedJurisdictions.length === 0) {
    return (
      <div className="glass-panel p-8 text-center">
        <Globe size={36} className="mx-auto text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Jurisdictions Selected</h3>
        <p className="text-sm text-muted-foreground">
          Select your operating jurisdictions in Step 1 to see the regulatory timeline and build
          your migration plan.
        </p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Gantt Chart */}
      {ganttRows.length > 0 ? (
        <ComplianceGantt
          rows={ganttRows}
          milestones={milestones}
          complianceDeadlines={pinnedComplianceDeadlines}
          yearRange={yearRange}
          onPhaseClick={setSelectedPhase}
        />
      ) : (
        <div className="glass-panel p-6 text-center">
          <Globe size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No regulatory timeline data available for the selected jurisdictions. Framework
            deadlines are shown in the gap analysis below.
          </p>
        </div>
      )}

      {/* Add Milestone Form */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Add Migration Milestone</h4>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label
              htmlFor="compliance-milestone"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Milestone
            </label>
            <input
              id="compliance-milestone"
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              placeholder="e.g., Complete crypto inventory"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
            />
          </div>
          <div className="w-24">
            <span className="block text-xs font-medium text-muted-foreground mb-1">Year</span>
            <FilterDropdown
              noContainer
              selectedId={String(newYear)}
              onSelect={(id) => setNewYear(parseInt(id))}
              items={yearOptions.map((y) => ({ id: String(y), label: String(y) }))}
            />
          </div>
          <div className="w-36">
            <span className="block text-xs font-medium text-muted-foreground mb-1">Category</span>
            <FilterDropdown
              noContainer
              selectedId={newCategory}
              onSelect={(id) => setNewCategory(id)}
              items={MILESTONE_CATEGORIES.map((c) => ({ id: c, label: c }))}
            />
          </div>
          <Button variant="gradient" size="sm" onClick={addMilestone} disabled={!newLabel.trim()}>
            <Plus size={14} />
            <span className="ml-1">Add</span>
          </Button>
        </div>
      </div>

      {/* Milestone List */}
      {milestones.length > 0 && (
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-2 glass-panel">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-primary">{m.year}</span>
                <span className="text-sm text-foreground">{m.label}</span>
                {m.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {m.category}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeMilestone(m.id)}
                aria-label={`Remove ${m.label}`}
                className="text-muted-foreground hover:text-status-error"
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Gap Analysis */}
      {externalDeadlines.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setGapExpanded((prev) => !prev)}
              className="flex items-center gap-2"
            >
              {gapExpanded ? (
                <ChevronDown size={16} className="text-primary" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
              <h3 className="text-lg font-semibold text-foreground">Gap Analysis</h3>
              <span className="text-xs text-muted-foreground">
                ({gapAnalysis.length} deadline{gapAnalysis.length !== 1 ? 's' : ''})
              </span>
            </Button>
            <div className="flex items-center gap-4 text-xs">
              {completedCount > 0 && (
                <span className="flex items-center gap-1 text-status-success">
                  <CheckCircle2 size={12} /> {completedCount} completed
                </span>
              )}
              {onTrackCount > 0 && (
                <span className="flex items-center gap-1 text-status-success">
                  <TrendingUp size={12} /> {onTrackCount} on track
                </span>
              )}
              {atRiskCount > 0 && (
                <span className="flex items-center gap-1 text-status-error">
                  <AlertTriangle size={12} /> {atRiskCount} at risk
                </span>
              )}
            </div>
          </div>

          {gapExpanded && (
            <>
              <div className="space-y-2">
                {gapAnalysis.map((item, idx) => (
                  <div key={idx}>
                    <div
                      role="button"
                      tabIndex={0}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        expandedGapIdx === idx ? 'rounded-b-none' : ''
                      } ${
                        item.status === 'at-risk'
                          ? 'border-status-error/30 bg-status-error/5'
                          : item.status === 'completed'
                            ? 'border-status-success/30 bg-status-success/5'
                            : 'border-border bg-muted/30'
                      }`}
                      onClick={() => setExpandedGapIdx(expandedGapIdx === idx ? null : idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setExpandedGapIdx(expandedGapIdx === idx ? null : idx)
                        }
                      }}
                      aria-expanded={expandedGapIdx === idx}
                    >
                      <div className="flex items-center gap-3">
                        {item.status === 'completed' && (
                          <CheckCircle2 size={16} className="text-status-success shrink-0" />
                        )}
                        {item.status === 'on-track' && (
                          <TrendingUp size={16} className="text-status-success shrink-0" />
                        )}
                        {item.status === 'at-risk' && (
                          <AlertTriangle size={16} className="text-status-error shrink-0" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {item.framework}
                          </div>
                          <div className="text-xs text-muted-foreground">{item.gap}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-primary">{item.deadlineYear}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            item.status === 'at-risk'
                              ? 'bg-status-error/20 text-status-error'
                              : item.status === 'completed'
                                ? 'bg-status-success/20 text-status-success'
                                : 'bg-status-success/10 text-status-success'
                          }`}
                        >
                          {item.status === 'at-risk'
                            ? 'At Risk'
                            : item.status === 'completed'
                              ? 'Done'
                              : 'On Track'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePinned(item.key)
                          }}
                          aria-label={
                            pinnedDeadlines.has(item.key)
                              ? `Remove ${item.framework} from timeline`
                              : `Add ${item.framework} to timeline`
                          }
                          title={
                            pinnedDeadlines.has(item.key)
                              ? 'Remove from timeline'
                              : 'Add to timeline'
                          }
                        >
                          {pinnedDeadlines.has(item.key) ? (
                            <ToggleRight size={16} className="text-primary" />
                          ) : (
                            <ToggleLeft size={16} className="text-muted-foreground" />
                          )}
                        </Button>
                        {expandedGapIdx === idx ? (
                          <ChevronDown size={14} className="text-primary shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </div>

                    {expandedGapIdx === idx && item.detail && (
                      <GapDetailPanel detail={item.detail} framework={item.framework} />
                    )}
                  </div>
                ))}
              </div>

              {milestones.length === 0 && (
                <div className="glass-panel p-4 text-center">
                  <Clock size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Add migration milestones above to see how they align with compliance deadlines.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Export */}
      {(milestones.length > 0 || ganttRows.length > 0 || externalDeadlines.length > 0) && (
        <ExportableArtifact
          title="Timeline Export"
          exportData={exportMarkdown}
          filename="compliance-timeline"
          formats={['markdown', 'csv']}
          onExport={handleSaveToDocuments}
        >
          <p className="text-sm text-muted-foreground">
            Export your compliance timeline, milestones, and gap analysis.
          </p>
        </ExportableArtifact>
      )}

      {/* Detail Popover */}
      <GanttDetailPopover
        isOpen={!!selectedPhase}
        onClose={() => setSelectedPhase(null)}
        phase={selectedPhase}
      />
    </div>
  )
}

// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState, useCallback } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Info,
  Globe,
  Plus,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  X,
} from 'lucide-react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { Button } from '@/components/ui/button'
import { GanttDetailPopover } from '@/components/Timeline/GanttDetailPopover'
import { AskAssistantButton } from '@/components/ui/AskAssistantButton'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { ExportableArtifact } from '../../../common/executive/ExportableArtifact'
import { rowsToCsv } from '@/services/export/csvExport'
import { ComplianceGantt } from './ComplianceGantt'
import {
  assessPlanAlignment,
  isObligationKeyArray,
  validObligationKeys,
  recordedCompletionLabel,
} from './compliancePlanAlignment'
import type { ComplianceGanttRow, UserMilestone, ComplianceDeadline } from './ComplianceGantt'
import type { TimelinePhase, TimelineEvent, EventType } from '@/types/timeline'
import { FilterDropdown } from '@/components/common/FilterDropdown'

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

/**
 * The *binding* compliance year for a (possibly phased) deadline string.
 * For phased mandates the obligation is the final full-compliance year, so we
 * take the LATEST year, not the earliest phase-in date. (Previously Math.min,
 * which read "2025-2030 (phased)" as 2025 and "2030 (deprecate), 2035 (disallow)"
 * as 2030 — flagging deadlines years earlier than the real obligation.)
 * A "Ongoing …" deadline has no single binding year.
 */
export function getDeadlineYear(deadline: string): number | null {
  if (/^ongoing/i.test(deadline.trim())) return null
  const matches = deadline.match(/\b(2\d{3})\b/g)
  if (!matches) return null
  return Math.max(...matches.map(Number))
}

/**
 * Deadline text describing a publication/finalization milestone (e.g. FIPS
 * 203/204/205's "Final (published August 2024)"), not a binding compliance
 * obligation. Rows matching this must be excluded from gap-analysis scoring —
 * otherwise a standard's publication date reads as a missed deadline.
 */
const PUBLICATION_STATUS_PATTERN = /^final\s*\(published/i

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
  status: 'completed' | 'on-track' | 'at-risk' | 'unknown'
  gap: string
  alignmentLabel: string
  detail?: FrameworkDetail | TimelineDetail
}

export function computeGapAnalysis(
  frameworkDeadlines: ExternalDeadline[],
  milestones: UserMilestone[],
  scenarioAsOfYear: number | null = 2026
): GapItem[] {
  return frameworkDeadlines.map((d) => ({
    key: d.key,
    framework: d.label,
    deadlineYear: d.year,
    ...assessPlanAlignment(d.key, d.year, milestones, scenarioAsOfYear),
    detail: d.detail,
  }))
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

/** Round-trippable snapshot of this builder's editable state — see
 *  `useSavedArtifactInputs`. `pinnedDeadlines` is a `Set` in component state
 *  but must serialize as an array (the executive-document store persists via
 *  JSON, which drops Sets). `selectedJurisdictions` is included so the
 *  Standalone adapter (which owns that state) can restore it too. */
export interface ComplianceTimelineSavedInputs {
  milestones?: UserMilestone[]
  scenarioAsOfYear?: number | null
  pinnedDeadlines?: string[]
  selectedJurisdictions?: string[]
}

export const ComplianceTimelineBuilder: React.FC<ComplianceTimelineBuilderProps> = ({
  selectedJurisdictions,
  dismissedFrameworkIds,
}) => {
  const { frameworks, countryDeadlines } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const savedInputs = useSavedArtifactInputs<ComplianceTimelineSavedInputs>('compliance-timeline')

  // Milestone state
  const [milestones, setMilestones] = useState<UserMilestone[]>(savedInputs?.milestones ?? [])
  const [scenarioAsOfYear, setScenarioAsOfYear] = useState<number | null>(
    savedInputs && Object.hasOwn(savedInputs, 'scenarioAsOfYear')
      ? (savedInputs.scenarioAsOfYear ?? null)
      : 2026
  )
  const [newLabel, setNewLabel] = useState('')
  const [newYear, setNewYear] = useState(2026)
  const [newCategory, setNewCategory] = useState(MILESTONE_CATEGORIES[0])

  // Popover state
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null)

  // Gap analysis UI state
  const [gapExpanded, setGapExpanded] = useState(true)
  const [expandedGapIdx, setExpandedGapIdx] = useState<number | null>(null)
  const [pinnedDeadlines, setPinnedDeadlines] = useState<Set<string>>(
    new Set(savedInputs?.pinnedDeadlines ?? [])
  )

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
      if (PUBLICATION_STATUS_PATTERN.test(fw.deadline.trim())) continue
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
    () => computeGapAnalysis(externalDeadlines, milestones, scenarioAsOfYear),
    [externalDeadlines, milestones, scenarioAsOfYear]
  )

  const unknownCount = gapAnalysis.filter((g) => g.status === 'unknown').length

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
          alignmentLabel: g.alignmentLabel,
        })),
    [gapAnalysis, pinnedDeadlines]
  )

  // Milestone management
  const addMilestone = useCallback(() => {
    if (!newLabel.trim()) return
    const ms: UserMilestone = {
      id: `ms-${crypto.randomUUID()}`,
      label: newLabel.trim(),
      year: newYear,
      category: newCategory,
      completed: false,
    }
    setMilestones((prev) => [...prev, ms].sort((a, b) => a.year - b.year))
    setNewLabel('')
  }, [newLabel, newYear, newCategory])

  const removeMilestone = useCallback((id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const toggleMilestoneDone = useCallback((id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: m.completed !== true } : m))
    )
  }, [])

  // Export markdown
  const exportMarkdown = useMemo(() => {
    let md = '# Compliance Timeline\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`
    md += `Sample scenario as-of year: ${scenarioAsOfYear ?? 'Unknown'}\n\n`
    md +=
      'Explicitly linked fictional activities only. Year comparisons do not establish applicability, technical results or compliance with an exact dated deadline.\n\n'

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
      md += '| Year | Milestone | Category | Done | ID | Completion year | Obligation keys |\n'
      md += '|------|-----------|----------|------|----|-----------------|-----------------|\n'
      for (const m of milestones) {
        md += `| ${m.year} | ${m.label} | ${m.category || ''} | ${recordedCompletionLabel(m.completed)} | ${m.id} | ${m.completedYear ?? ''} | ${JSON.stringify(m.obligationKeys === undefined ? [] : m.obligationKeys)} |\n`
      }
    }

    if (gapAnalysis.length > 0) {
      md += '\n## Linked Sample Plan Alignment\n\n'
      md += '| Framework | Reference year | Alignment | Notes |\n'
      md += '|-----------|----------------|-----------|-------|\n'
      for (const g of gapAnalysis) {
        md += `| ${g.framework} | ${g.deadlineYear} | ${g.alignmentLabel} | ${g.gap} |\n`
      }
    }

    md += '\n---\n\n'
    md +=
      '*Aligned to NIST CSWP 39 §5.1 — Cryptographic Standards, Regulations, and Mandates. https://doi.org/10.6028/NIST.CSWP.39-upd1*\n'

    return md
  }, [ganttRows, milestones, gapAnalysis, scenarioAsOfYear])

  // Structured CSV (all three tables, section-labelled) built from the live data
  // so `.csv` opens as real spreadsheet rows, not pipe text. Audit C5.
  const exportCsv = useMemo(() => {
    const sections: (string | number)[][] = [
      ['Sample scenario as-of year', scenarioAsOfYear ?? 'Unknown'],
      [
        'Scope',
        'Explicit fictional activities; year comparisons are not exact-deadline or compliance assessments.',
      ],
    ]
    if (ganttRows.length > 0) {
      sections.push(['Regulatory Timeline'])
      sections.push(['Country', 'Organization', 'Phase', 'Type', 'Start Year', 'End Year', 'Title'])
      for (const row of ganttRows)
        for (const p of row.phases)
          sections.push([
            row.country.countryName,
            row.bodyName,
            p.phase,
            p.type,
            p.startYear,
            p.endYear,
            p.title,
          ])
    }
    if (milestones.length > 0) {
      if (sections.length) sections.push([])
      sections.push(['Migration Milestones'])
      sections.push([
        'Year',
        'Milestone',
        'Category',
        'Done',
        'ID',
        'Completion Year',
        'Obligation Keys',
      ])
      for (const m of milestones)
        sections.push([
          m.year,
          m.label,
          m.category || '',
          recordedCompletionLabel(m.completed),
          m.id,
          m.completedYear ?? '',
          JSON.stringify(m.obligationKeys === undefined ? [] : m.obligationKeys),
        ])
    }
    if (gapAnalysis.length > 0) {
      if (sections.length) sections.push([])
      sections.push(['Linked Sample Plan Alignment'])
      sections.push(['Framework', 'Reference Year', 'Alignment', 'Notes'])
      for (const g of gapAnalysis)
        sections.push([g.framework, g.deadlineYear, g.alignmentLabel, g.gap])
    }
    return rowsToCsv(sections)
  }, [ganttRows, milestones, gapAnalysis, scenarioAsOfYear])

  const handleSaveToDocuments = () => {
    const inputs: ComplianceTimelineSavedInputs = {
      milestones,
      scenarioAsOfYear,
      pinnedDeadlines: Array.from(pinnedDeadlines),
      selectedJurisdictions,
    }
    addExecutiveDocument({
      id: `compliance-timeline-${Date.now()}`,
      type: 'compliance-timeline',
      title: 'Compliance Timeline',
      data: exportMarkdown,
      inputs,
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
      {(savedInputs?.milestones?.length ?? 0) > 0 ||
      (savedInputs?.pinnedDeadlines?.length ?? 0) > 0 ? (
        <PreFilledBanner summary="Restored your milestones and pinned deadlines from your last saved timeline." />
      ) : null}

      {/* Gantt Chart */}
      {ganttRows.length > 0 || milestones.length > 0 || pinnedComplianceDeadlines.length > 0 ? (
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
            deadlines are shown in the obligation review below.
          </p>
        </div>
      )}

      {/* Add Milestone Form */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Add Migration Milestone</h4>
        <label className="block text-sm mb-3">
          Sample scenario as-of year
          <input
            type="number"
            value={scenarioAsOfYear ?? ''}
            onChange={(e) =>
              setScenarioAsOfYear(e.target.value === '' ? null : Number(e.target.value))
            }
            className="ml-2 w-24 rounded border border-input bg-background p-2"
          />
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Link fictional activities explicitly. Planned dates are not delivery dates; year
          comparisons do not verify exact legal deadlines, applicability or compliance.
        </p>
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
            <div key={m.id} className="flex flex-col gap-3 px-4 py-2 glass-panel">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  {m.completed === true && (
                    <CheckCircle2 size={14} className="text-status-success shrink-0" />
                  )}
                  <span className="text-sm font-mono text-primary">{m.year}</span>
                  <span
                    className={`text-sm ${m.completed === true ? 'text-status-success' : 'text-foreground'}`}
                  >
                    {m.label}
                  </span>
                  {m.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {m.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMilestoneDone(m.id)}
                    aria-pressed={m.completed === true}
                    title={
                      m.completed === true
                        ? 'Learner-marked done — obligation satisfaction remains unassessed'
                        : 'Mark this planning milestone done; obligation satisfaction remains unassessed'
                    }
                    className={
                      m.completed === true
                        ? 'text-status-success'
                        : 'text-muted-foreground hover:text-status-success'
                    }
                  >
                    <CheckCircle2 size={14} />
                    <span className="ml-1 text-xs">
                      {m.completed === true ? 'Done' : 'Mark done'}
                    </span>
                  </Button>
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
              </div>
              {m.completed === true && (
                <label className="text-sm">
                  Recorded completion year for {m.label}
                  <input
                    type="number"
                    value={m.completedYear ?? ''}
                    onChange={(e) =>
                      setMilestones((prev) =>
                        prev.map((item) =>
                          item.id === m.id
                            ? {
                                ...item,
                                completedYear:
                                  e.target.value === '' ? undefined : Number(e.target.value),
                              }
                            : item
                        )
                      )
                    }
                    className="ml-2 w-24 rounded border border-input bg-background p-2"
                  />
                </label>
              )}
              {m.completed !== undefined && typeof m.completed !== 'boolean' && (
                <p className="text-xs text-muted-foreground break-all">
                  Completion not assessed; preserved raw value:{' '}
                  {JSON.stringify(m.completed) ?? 'not recorded'}
                </p>
              )}
              <fieldset
                className="min-w-0 space-y-2"
                disabled={m.obligationKeys !== undefined && !isObligationKeyArray(m.obligationKeys)}
              >
                <legend className="text-xs font-medium">
                  Explicit reference associations for {m.label}
                </legend>
                {externalDeadlines.map((d) => (
                  <label key={d.key} className="flex items-start gap-2 text-xs break-words">
                    <input
                      type="checkbox"
                      checked={validObligationKeys(m.obligationKeys).includes(d.key)}
                      onChange={(e) =>
                        setMilestones((prev) =>
                          prev.map((item) =>
                            item.id === m.id &&
                            (item.obligationKeys === undefined ||
                              isObligationKeyArray(item.obligationKeys))
                              ? {
                                  ...item,
                                  obligationKeys: e.target.checked
                                    ? [
                                        ...new Set([
                                          ...validObligationKeys(item.obligationKeys),
                                          d.key,
                                        ]),
                                      ]
                                    : validObligationKeys(item.obligationKeys).filter(
                                        (key) => key !== d.key
                                      ),
                                }
                              : item
                          )
                        )
                      }
                    />
                    <span className="min-w-0">
                      {d.label} — reference year {d.year}
                    </span>
                  </label>
                ))}
                {m.obligationKeys !== undefined && !isObligationKeyArray(m.obligationKeys) && (
                  <p className="text-xs text-muted-foreground break-all">
                    Associations not assessed; preserved malformed raw value:{' '}
                    {JSON.stringify(m.obligationKeys)}. An array of string keys is required.
                  </p>
                )}
                {validObligationKeys(m.obligationKeys)
                  .filter((key) => !externalDeadlines.some((d) => d.key === key))
                  .map((key) => (
                    <p key={key} className="text-xs text-muted-foreground break-all">
                      Preserved reference key (not currently displayed; no credit): {key}
                    </p>
                  ))}
              </fieldset>
            </div>
          ))}
        </div>
      )}

      {/* Obligation Review */}
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
              <h3 className="text-lg font-semibold text-foreground">Obligation Review</h3>
              <span className="text-xs text-muted-foreground">
                ({gapAnalysis.length} deadline{gapAnalysis.length !== 1 ? 's' : ''})
              </span>
            </Button>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Info size={12} /> {unknownCount} not assessed
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground -mt-2">
            Obligation satisfaction is not assessed. Explicit links compare fictional activity dates
            only; Done flags do not record technical results or supporting checks. Review the
            applicable obligation, planned work and evidence with your production tools; the
            calendar remains a planning view. Publication/status entries are excluded from this
            deadline list.
          </p>

          {gapExpanded && (
            <>
              <div className="space-y-2">
                {gapAnalysis.map((item, idx) => (
                  <div key={idx}>
                    <div
                      role="button"
                      tabIndex={0}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
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
                        {item.status === 'unknown' && (
                          <Info size={16} className="text-muted-foreground shrink-0" />
                        )}
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
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-mono text-primary">{item.deadlineYear}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            item.status === 'unknown'
                              ? 'bg-muted text-muted-foreground'
                              : item.status === 'at-risk'
                                ? 'bg-status-error/20 text-status-error'
                                : item.status === 'completed'
                                  ? 'bg-status-success/20 text-status-success'
                                  : 'bg-status-success/10 text-status-success'
                          }`}
                        >
                          {item.alignmentLabel}
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
          formats={['markdown', 'csv', 'pdf']}
          csvData={exportCsv}
          wideTable
          onExport={handleSaveToDocuments}
        >
          <p className="text-sm text-muted-foreground">
            Export your planning timeline, explicit activity links, recorded sample dates, and
            obligation review.
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

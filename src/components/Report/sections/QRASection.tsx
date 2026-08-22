// SPDX-License-Identifier: GPL-3.0-only
/**
 * Quantum Readiness Assessment (QRA) — Report render surface (gap-closer #1,
 * spec §6.1; PER-PAGE-CHANGES Report #1; framework §3.4 p.76). Phase 3.
 *
 * The Report page is the framework's *communicate* surface. This component
 * consumes the structured `QuantumReadinessAssessment` that the Assess engine
 * exports (`buildQRA` from `@/hooks/assessment`) and lays it out as the
 * framework's five sections:
 *   1. Executive summary
 *   2. Estate heatmap (by readiness domain)
 *   3. Prioritised backlog (owner-assignable)
 *   4. Gap analysis vs. regulatory
 *   5. Compliance mapping
 *
 * Purely additive: it renders nothing new unless an assessment exists (the
 * parent `ReportContent` is only mounted with a `result`, so the empty / CTA
 * state in `ReportView` is unchanged). No existing behaviour is touched.
 */
import { useMemo, useState } from 'react'
import {
  FileCheck2,
  Grid3x3,
  ListChecks,
  Scale,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { CollapsibleSection } from './reportContentShared'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { buildQRA } from '@/hooks/assessment'
import { ROLE_CROSSWALK, type FrameworkRoleId } from '@/data/roleCrosswalk'
import { useReportOwnershipStore } from '@/store/useReportOwnershipStore'

/** Display order for owner-assignment options, derived from the crosswalk. */
const ROLE_OPTION_ORDER = Object.keys(ROLE_CROSSWALK) as FrameworkRoleId[]
import { FRAMEWORK_PHASES } from '@/data/frameworkPhases'
import { CRQC_ESTIMATES } from '@/data/regulatoryTimelines'
import { QC_FIRST_YEAR } from '@/data/quantumTimeline'
import type { AssessmentInput, AssessmentResult } from '@/hooks/assessmentTypes'
import type { QRAHeatmapCell, QRABacklogItem } from '@/hooks/assessment/qra'
import clsx from 'clsx'

/** Heatmap band → colour tokens (higher severity = warmer). */
const BAND_STYLES: Record<QRAHeatmapCell['band'], { bar: string; text: string; chip: string }> = {
  low: { bar: 'bg-success', text: 'text-success', chip: 'bg-success/10 text-success' },
  medium: { bar: 'bg-warning', text: 'text-warning', chip: 'bg-warning/10 text-warning' },
  high: {
    bar: 'bg-destructive',
    text: 'text-destructive',
    chip: 'bg-destructive/10 text-destructive',
  },
  critical: { bar: 'bg-critical', text: 'text-critical', chip: 'bg-critical/10 text-critical' },
}

const BAND_LABEL: Record<QRAHeatmapCell['band'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

function ExecSummary({ qra }: { qra: ReturnType<typeof buildQRA> }) {
  const { execSummary } = qra
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex flex-col justify-center rounded-lg border border-border bg-muted/30 px-4 py-3 min-w-[8rem]">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Risk Score
          </span>
          <span className="text-2xl font-bold text-foreground">
            {execSummary.riskScore}
            <span className="text-sm text-muted-foreground font-normal">/100</span>
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {execSummary.riskLevel} risk
          </span>
        </div>
        <div className="flex flex-col justify-center rounded-lg border border-border bg-muted/30 px-4 py-3 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Urgency Tier
          </span>
          <span className="text-base font-bold text-foreground">{execSummary.tier.label}</span>
          <span className="text-xs text-muted-foreground">
            Start: {execSummary.tier.startWindow}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{execSummary.text}</p>
      <p className="text-xs text-muted-foreground">{execSummary.tier.description}</p>
    </div>
  )
}

function Heatmap({ cells }: { cells: QRAHeatmapCell[] }) {
  if (cells.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Estate heatmap needs the comprehensive assessment (per-domain scores). Complete the full
        assessment to populate it.
      </p>
    )
  }
  return (
    <div className="space-y-4">
      {cells.map((cell) => {
        const style = BAND_STYLES[cell.band]
        return (
          <div key={cell.domain}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">{cell.label}</span>
              <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', style.chip)}>
                {BAND_LABEL[cell.band]}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all duration-500', style.bar)}
                style={{ width: `${cell.severity}%` }}
                role="progressbar"
                aria-valuenow={Math.round(cell.severity)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${cell.label}: ${BAND_LABEL[cell.band]} attention need (${Math.round(cell.severity)} of 100)`}
              />
            </div>
          </div>
        )
      })}
      <p className="text-[11px] text-muted-foreground">
        Bars show attention needed (higher = more urgent). Organizational readiness is inverted —
        low readiness reads as high attention.
      </p>
    </div>
  )
}

/** Program-level accountability, distinct from the per-item "Owner" column
 *  below: who runs the migration day-to-day, who controls the budget, and
 *  who's accountable to the board — not who's responsible for one backlog
 *  item. Genuinely persisted (useReportOwnershipStore), unlike the per-item
 *  owner overrides. */
function ProgramOwnership() {
  const programOwner = useReportOwnershipStore((s) => s.programOwner)
  const budgetOwner = useReportOwnershipStore((s) => s.budgetOwner)
  const accountableExecutive = useReportOwnershipStore((s) => s.accountableExecutive)
  const setProgramOwner = useReportOwnershipStore((s) => s.setProgramOwner)
  const setBudgetOwner = useReportOwnershipStore((s) => s.setBudgetOwner)
  const setAccountableExecutive = useReportOwnershipStore((s) => s.setAccountableExecutive)

  const fields = [
    {
      id: 'qra-program-owner',
      label: 'Program Owner',
      value: programOwner,
      onChange: setProgramOwner,
      placeholder: 'Runs the migration day-to-day',
    },
    {
      id: 'qra-budget-owner',
      label: 'Budget Owner',
      value: budgetOwner,
      onChange: setBudgetOwner,
      placeholder: 'Controls the migration budget',
    },
    {
      id: 'qra-accountable-exec',
      label: 'Accountable Executive',
      value: accountableExecutive,
      onChange: setAccountableExecutive,
      placeholder: 'Signs off / accountable to the board',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
      {fields.map((f) => (
        <div key={f.id}>
          <label
            htmlFor={f.id}
            className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1"
          >
            {f.label}
          </label>
          <input
            id={f.id}
            type="text"
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            placeholder={f.placeholder}
            className="w-full rounded-md border border-border bg-background px-2 py-2.5 md:py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary print:border-none print:p-0 print:bg-transparent"
          />
        </div>
      ))}
    </div>
  )
}

function Backlog({ items }: { items: QRABacklogItem[] }) {
  // Owner assignment: each item defaults to its computed owning role, but the
  // user can re-assign it. Kept in local state so the QRA stays a pure read of
  // the engine — re-assignment is a presentational override, not a model edit.
  const [owners, setOwners] = useState<Record<number, FrameworkRoleId | ''>>(
    () =>
      Object.fromEntries(items.map((i) => [i.priority, i.ownerRoleId ?? ''])) as Record<
        number,
        FrameworkRoleId | ''
      >
  )

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No prioritised actions to display.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-3 font-medium text-muted-foreground w-10">#</th>
            <th className="py-2 pr-3 font-medium text-muted-foreground">Action</th>
            <th className="py-2 pr-3 font-medium text-muted-foreground w-28">Phase</th>
            <th className="py-2 pr-3 font-medium text-muted-foreground w-56">Owner</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const phaseDef = FRAMEWORK_PHASES[item.phase]
            const owner = owners[item.priority] ?? ''
            return (
              <tr key={item.priority} className="border-b border-border/60 align-top">
                <td className="py-2 pr-3 font-mono text-muted-foreground">{item.priority}</td>
                <td className="py-2 pr-3 text-foreground">{item.action}</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                    {phaseDef ? `${phaseDef.number ?? 'F'} · ${phaseDef.name}` : item.phase}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <FilterDropdown
                    items={ROLE_OPTION_ORDER.map((roleId) => ({
                      id: roleId,
                      // eslint-disable-next-line security/detect-object-injection
                      label: ROLE_CROSSWALK[roleId].label,
                    }))}
                    selectedId={owner}
                    onSelect={(id) =>
                      setOwners((prev) => ({
                        ...prev,
                        [item.priority]: id === 'All' ? '' : (id as FrameworkRoleId),
                      }))
                    }
                    defaultLabel="Unassigned"
                    defaultIcon={null}
                    ariaLabel={`Owner for action ${item.priority}`}
                    noContainer
                    className="w-full"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Optimistic / expected / pessimistic CRQC arrival, plus the conservative planning anchor. */
function CrqcWindow() {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">CRQC arrival window</span> — when a quantum
      computer could break today&apos;s RSA/ECC: optimistic ~{CRQC_ESTIMATES.lowerBound} · expected
      ~{CRQC_ESTIMATES.moderate} · pessimistic ~{CRQC_ESTIMATES.upperBound}. This assessment plans
      against a conservative {QC_FIRST_YEAR} anchor for the most sensitive, long-lived data. Source:
      GRI Quantum Threat Timeline 2025 (expert probability estimates).
    </div>
  )
}

function RegulatoryGaps({ gaps }: { gaps: ReturnType<typeof buildQRA>['regulatoryGaps'] }) {
  if (gaps.length === 0) {
    return (
      <div className="space-y-3">
        <CrqcWindow />
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <CheckCircle2 size={16} className="text-success" aria-hidden="true" />
          No frameworks in scope explicitly mandate PQC yet — but track the regulatory horizon.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <CrqcWindow />
      <p className="text-sm text-muted-foreground">
        {gaps.length} in-scope framework{gaps.length !== 1 ? 's' : ''} explicitly require
        {gaps.length === 1 ? 's' : ''} PQC — these are gaps against current posture.
      </p>
      <ul className="space-y-2">
        {gaps.map((g) => (
          <li
            key={g.framework}
            className="rounded-lg border border-l-4 border-l-warning border-border bg-muted/20 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold text-foreground inline-flex items-center gap-2">
                <AlertTriangle size={14} className="text-warning" aria-hidden="true" />
                {g.framework}
              </span>
              <span className="text-xs text-muted-foreground">{g.deadline}</span>
            </div>
            {g.notes && <p className="text-xs text-muted-foreground mt-1">{g.notes}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ComplianceMapping({ rows }: { rows: ReturnType<typeof buildQRA>['complianceMapping'] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No compliance frameworks selected. Add frameworks in Assess to map PQC obligations.
      </p>
    )
  }
  const badge = (requiresPQC: boolean | null) => {
    if (requiresPQC === true)
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
          PQC Required
        </span>
      )
    if (requiresPQC === false)
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
          No PQC mandate yet
        </span>
      )
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
        Unknown
      </span>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-3 font-medium text-muted-foreground">Framework</th>
            <th className="py-2 pr-3 font-medium text-muted-foreground w-40">PQC Obligation</th>
            <th className="py-2 pr-3 font-medium text-muted-foreground w-48">Deadline</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.framework} className="border-b border-border/60 align-top">
              <td className="py-2 pr-3 text-foreground font-medium">{r.framework}</td>
              <td className="py-2 pr-3">{badge(r.requiresPQC)}</td>
              <td className="py-2 pr-3 text-muted-foreground text-xs">{r.deadline}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function QRASection({
  input,
  result,
  defaultOpen = true,
}: {
  input: AssessmentInput
  result: AssessmentResult
  defaultOpen?: boolean
}) {
  const qra = useMemo(() => buildQRA(input, result), [input, result])

  return (
    <div className="space-y-3" data-testid="qra-section">
      <CollapsibleSection
        id="report-section-qra"
        title="Quantum Readiness Assessment (QRA)"
        icon={<FileCheck2 className="text-primary" size={20} />}
        defaultOpen={defaultOpen}
        className="border-l-4 border-l-primary"
      >
        <div className="space-y-6">
          <section aria-labelledby="qra-exec">
            <h3
              id="qra-exec"
              className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-2"
            >
              <ClipboardList size={16} className="text-primary" aria-hidden="true" />
              Executive Summary
            </h3>
            <ExecSummary qra={qra} />
          </section>

          <section aria-labelledby="qra-heatmap">
            <h3
              id="qra-heatmap"
              className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-2"
            >
              <Grid3x3 size={16} className="text-primary" aria-hidden="true" />
              Estate Heatmap
            </h3>
            <Heatmap cells={qra.heatmap} />
          </section>

          <section aria-labelledby="qra-ownership">
            <h3
              id="qra-ownership"
              className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-2"
            >
              <Users size={16} className="text-primary" aria-hidden="true" />
              Program Ownership
            </h3>
            <ProgramOwnership />
          </section>

          <section aria-labelledby="qra-backlog">
            <h3
              id="qra-backlog"
              className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-2"
            >
              <ListChecks size={16} className="text-primary" aria-hidden="true" />
              Prioritised Backlog
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Per-item owners below are the <strong>Responsible</strong> role for each action —
              program-level accountability is set above.
            </p>
            <Backlog items={qra.backlog} />
          </section>

          <section aria-labelledby="qra-reggaps">
            <h3
              id="qra-reggaps"
              className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-2"
            >
              <Scale size={16} className="text-primary" aria-hidden="true" />
              Gap Analysis vs. Regulatory
            </h3>
            <RegulatoryGaps gaps={qra.regulatoryGaps} />
          </section>

          <section aria-labelledby="qra-compliance">
            <h3
              id="qra-compliance"
              className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-2"
            >
              <FileCheck2 size={16} className="text-primary" aria-hidden="true" />
              Compliance Mapping
            </h3>
            <ComplianceMapping rows={qra.complianceMapping} />
          </section>
        </div>
      </CollapsibleSection>
    </div>
  )
}

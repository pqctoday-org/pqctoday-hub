// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { usePersonaStore } from '@/store/usePersonaStore'
import { DataDrivenScorecard, KpiPersonaSelector } from '@/components/PKILearning/common/executive'
import { CompleteStepAction } from '@/components/PKILearning/common/CompleteStepAction'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { MarkdownView } from '@/components/ui/MarkdownView'
import type { KpiPersonaId } from '@/data/kpiCatalog'
import { KPI_PERSONAS, buildDimensions } from '@/data/kpiCatalog'
import type { PolicyOutput } from '../types'

const SURFACE = 'governance' as const

function coercePersona(p: string | null | undefined): KpiPersonaId {
  if (p && (KPI_PERSONAS as readonly string[]).includes(p)) return p as KpiPersonaId
  return 'executive'
}

// Honest methodology note — describes the score the dashboard actually computes
// (a weighted average of the KPI sliders), grounded in the framework's KPI pack.
const METHODOLOGY_MD = `## How this score is computed

The **Overall Score** is the weighted average of the KPI sliders below, using the
per-persona weights in the Weight column (they sum to 100%). Each KPI is a 0–100
measure; the weighted average is rounded to a whole number.

The KPI set follows the Applied Quantum framework's Board-Level KPI Pack —
Coverage, Trust, Inventory, Vendors, and Agility, each with year-1/2/3 targets
(see Program Foundations · Metrics, KPIs & Reporting).
`

interface KPIDashboardBuilderProps {
  policyOutput?: PolicyOutput | null
}

/** Persisted shape of a saved KPI dashboard — the read-back half of `persistScorecard`. */
interface SavedKpiInputs {
  scores?: Record<string, number>
  weights?: Record<string, number>
  activePersona?: KpiPersonaId
}

/** Extracted (07192026, Batch 2) so the simulation's real-tool doc generator
 *  renders THIS logic — persistScorecard delegates here. */
export function buildKpiDashboardMarkdown(
  dimensions: ReturnType<typeof buildDimensions>,
  activePersona: KpiPersonaId,
  scores: Record<string, number>,
  weights: Record<string, number>
): string {
  const ew = (d: (typeof dimensions)[number]) => (d.id in weights ? (weights[d.id] ?? 0) : d.weight)

  let weightedSum = 0
  let totalWeight = 0
  for (const d of dimensions) {
    if (d.disabled) continue
    weightedSum += (scores[d.id] ?? 0) * ew(d)
    totalWeight += ew(d)
  }
  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

  let md = '# PQC Governance KPI Dashboard\n\n'
  md += `**Persona Lens:** ${activePersona}\n`
  md += `**Overall Score: ${overall}/100**\n\n`
  md += `Generated: ${new Date().toLocaleDateString()}\n\n`
  md += '| KPI | Score | Weight | Target |\n'
  md += '|-----|-------|--------|--------|\n'
  for (const d of dimensions) {
    if (d.disabled) {
      md += `| ${d.label} | _locked_ | ${Math.round(ew(d) * 100)}% | ${d.target ?? '—'} |\n`
      continue
    }
    md += `| ${d.label} | ${scores[d.id] ?? 0}/100 | ${Math.round(ew(d) * 100)}% | ${d.target ?? '—'} |\n`
  }

  // Honest methodology — the weighted-average score the dashboard computes.
  md += '\n' + METHODOLOGY_MD + '\n'
  return md
}

export const KPIDashboardBuilder: React.FC<KPIDashboardBuilderProps> = ({ policyOutput }) => {
  const { addExecutiveDocument } = useModuleStore()
  const execData = useExecutiveModuleData()
  const globalPersona = usePersonaStore((s) => s.selectedPersona)
  const savedInputs = useSavedArtifactInputs<SavedKpiInputs>('kpi-dashboard')

  // Scoped persona override (does not mutate global persona store) — restored
  // from the last saved dashboard if one exists.
  const [personaOverride, setPersonaOverride] = useState<KpiPersonaId | null>(
    () => savedInputs?.activePersona ?? null
  )
  const activePersona: KpiPersonaId = personaOverride ?? coercePersona(globalPersona)

  const dimensions = useMemo(
    () => buildDimensions(activePersona, SURFACE, execData, execData.country),
    [activePersona, execData]
  )

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scoresRef = useRef<Record<string, number>>(savedInputs?.scores ?? {})
  const weightsRef = useRef<Record<string, number>>(savedInputs?.weights ?? {})
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // Persist using the SAME effective weights the on-screen scorecard shows — the
  // user's weight edits, falling back to the per-persona defaults — so the saved
  // artifact always matches what's on screen (not the defaults).
  const persistScorecard = useCallback(() => {
    const md = buildKpiDashboardMarkdown(
      dimensions,
      activePersona,
      scoresRef.current,
      weightsRef.current
    )

    addExecutiveDocument({
      id: `kpi-dashboard-${activePersona}-pqc-governance`,
      moduleId: 'pqc-governance',
      type: 'kpi-dashboard',
      title: `PQC Governance KPI Dashboard — ${activePersona}`,
      data: md,
      // Persist the structured scorecard so it is restorable (round-trips through
      // useSavedArtifactInputs on next mount).
      inputs: { scores: scoresRef.current, weights: weightsRef.current, activePersona },
      createdAt: Date.now(),
    })
  }, [dimensions, addExecutiveDocument, activePersona])

  // Persistent done-state for the explicit Save button. The debounced auto-save
  // stays as a convenience, but there's now a visible button + feedback (R3).
  const [wasSaved, setWasSaved] = useState(false)
  const [dirtySinceSave, setDirtySinceSave] = useState(false)

  const scheduleSave = useCallback(() => {
    setDirtySinceSave(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(persistScorecard, 500)
  }, [persistScorecard])

  const handleSaveNow = useCallback(() => {
    persistScorecard()
    setWasSaved(true)
    setDirtySinceSave(false)
  }, [persistScorecard])

  const handleScoreChange = useCallback(
    (scores: Record<string, number>) => {
      scoresRef.current = scores
      scheduleSave()
    },
    [scheduleSave]
  )

  // Weight edits must also re-persist (with the latest scores) so saved == on-screen.
  const handleWeightChange = useCallback(
    (weights: Record<string, number>) => {
      weightsRef.current = weights
      scheduleSave()
    },
    [scheduleSave]
  )

  const lockedDimensions = useMemo(() => dimensions.filter((d) => d.disabled), [dimensions])
  const lockedWeightPct = useMemo(
    () => Math.round(lockedDimensions.reduce((sum, d) => sum + d.weight, 0) * 100),
    [lockedDimensions]
  )

  const seedSources: string[] = []
  if (execData.industry) seedSources.push(`industry (${execData.industry})`)
  if (execData.riskScore !== null) seedSources.push('assessment risk score')
  if (execData.myFrameworks.length > 0)
    seedSources.push(
      `${execData.myFrameworks.length} framework${execData.myFrameworks.length !== 1 ? 's' : ''} from /compliance`
    )
  if (execData.myProducts.length > 0)
    seedSources.push(
      `${execData.myProducts.length} product${execData.myProducts.length !== 1 ? 's' : ''} from /migrate`
    )
  if (execData.myThreats.length > 0)
    seedSources.push(
      `${execData.myThreats.length} threat${execData.myThreats.length !== 1 ? 's' : ''} from /threats`
    )
  if (execData.migrationDeadlineYear)
    seedSources.push(`deadline year ${execData.migrationDeadlineYear} from /timeline`)

  return (
    <div className="space-y-6">
      {policyOutput && (
        <PreFilledBanner
          summary={`Policy type: ${policyOutput.policyType}. Set KPI targets to match your policy commitments.`}
        />
      )}
      {seedSources.length > 0 && (
        <PreFilledBanner summary={`KPI defaults derived from ${seedSources.join(' + ')}.`} />
      )}
      {lockedDimensions.length > 0 && (
        <div className="rounded-md border border-status-warning/30 bg-status-warning/5 p-3 text-xs text-foreground/80">
          <strong className="text-status-warning">
            {lockedDimensions.length} of {dimensions.length} KPIs
          </strong>{' '}
          — {lockedWeightPct}% of weight — need assessment or compliance data to unlock. Complete
          the linked step on each locked KPI below to bring it into the score.
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground flex-1">
          Adjust KPI sliders to reflect your organization&apos;s PQC migration progress. Vendor
          Readiness and threat-scoped KPIs auto-populate from the catalog, industry threats, and
          your assessment; weights adapt to the selected persona lens.
        </p>
        <div className="flex items-center gap-2">
          <CompleteStepAction
            recordsArtifact
            saved={wasSaved}
            editedSinceSave={wasSaved && dirtySinceSave}
            onClick={handleSaveNow}
          />
          <KpiPersonaSelector value={activePersona} onChange={setPersonaOverride} />
        </div>
      </div>

      <CollapsibleSection
        title="How this score is computed"
        icon={<Info size={14} className="text-primary" aria-hidden="true" />}
        defaultOpen={false}
      >
        <MarkdownView content={METHODOLOGY_MD} />
      </CollapsibleSection>

      {execData.migrationDeadlineYear && (
        <div className="glass-panel p-4 border-primary/20">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-primary">Country Deadline:</span>{' '}
            {execData.migrationDeadlineYear}
            {execData.country ? ` (${execData.country})` : ''} — Pace-to-Deadline weights adjust
            accordingly for the {activePersona} lens.
          </p>
        </div>
      )}

      <DataDrivenScorecard
        title="PQC Governance KPIs"
        description={`Weighted scorecard — ${activePersona} lens.`}
        dimensions={dimensions}
        colorScale="readiness"
        onScoreChange={handleScoreChange}
        onWeightChange={handleWeightChange}
        initialScores={savedInputs?.scores}
        initialWeights={savedInputs?.weights}
        allowWeightEditing={true}
        showExport={true}
        exportFilename={`pqc-governance-kpi-${activePersona}`}
        exportFormats={['markdown', 'csv', 'pdf']}
        includeTargetsInExport={true}
      />
    </div>
  )
}

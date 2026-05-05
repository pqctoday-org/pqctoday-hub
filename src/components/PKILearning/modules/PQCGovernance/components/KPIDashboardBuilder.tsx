// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { usePersonaStore } from '@/store/usePersonaStore'
import { DataDrivenScorecard, KpiPersonaSelector } from '@/components/PKILearning/common/executive'
import type { KpiPersonaId } from '@/data/kpiCatalog'
import { KPI_PERSONAS, buildDimensions } from '@/data/kpiCatalog'

const SURFACE = 'governance' as const

function coercePersona(p: string | null | undefined): KpiPersonaId {
  if (p && (KPI_PERSONAS as readonly string[]).includes(p)) return p as KpiPersonaId
  return 'executive'
}

// CSWP.39 §5.4 composite scoring + sensitivity multiplier (educational defaults).
const FORMULA_EXPLAINER_MD = `## Formula Explainer (CSWP.39 §5.4)

Per-asset attack-surface score combines five signals, each weighted 0..1:

\`\`\`
attackSurfaceScore =
  fipsWeight       * fipsValidatedScore     // 1 if CMVP-validated, partial credit otherwise
+ esvWeight        * esvValidatedScore      // 1 if SP 800-90B-validated entropy source, else 0
+ pqcReadinessWeight * pqcReadinessScore    // 1 = full PQC, 0.5 = hybrid, 0 = classical
+ eolWeight        * eolUrgencyScore        // 1 = EoL within 12 months, 0 = >5 years
+ postureWeight    * postureScore           // 1 = vendor commitment + active patches, 0 = abandoned
\`\`\`

The weights add to 1.0 and are tuned per persona (executive/architect/ops). The composite score
then drives the Critical / High / Medium / Low queue and the per-asset action guidance shown in
\`/report\` Recommended Actions.
`

export const KPIDashboardBuilder: React.FC = () => {
  const { addExecutiveDocument } = useModuleStore()
  const execData = useExecutiveModuleData()
  const globalPersona = usePersonaStore((s) => s.selectedPersona)

  // Scoped persona override (does not mutate global persona store)
  const [personaOverride, setPersonaOverride] = useState<KpiPersonaId | null>(null)
  const activePersona: KpiPersonaId = personaOverride ?? coercePersona(globalPersona)

  // CSWP.39 §5.4 — Sensitivity multiplier inputs (educational; defaults reflect common practice).
  const [sensHigh, setSensHigh] = useState('1.5')
  const [sensMed, setSensMed] = useState('1.0')
  const [sensLow, setSensLow] = useState('0.7')

  const dimensions = useMemo(
    () => buildDimensions(activePersona, SURFACE, execData, execData.country),
    [activePersona, execData]
  )

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const handleScoreChange = useCallback(
    (scores: Record<string, number>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        let weightedSum = 0
        let totalWeight = 0
        for (const d of dimensions) {
          if (d.disabled) continue
          const score = scores[d.id] ?? 0
          weightedSum += score * d.weight
          totalWeight += d.weight
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
            md += `| ${d.label} | _locked_ | ${Math.round(d.weight * 100)}% | ${d.target ?? '—'} |\n`
            continue
          }
          md += `| ${d.label} | ${scores[d.id] ?? 0}/100 | ${Math.round(d.weight * 100)}% | ${d.target ?? '—'} |\n`
        }

        // CSWP.39 §5.4 — Composite scoring formula + sensitivity multiplier.
        md += '\n' + FORMULA_EXPLAINER_MD + '\n'
        md += '## Sensitivity Multiplier (CSWP.39 §5.4)\n\n'
        md +=
          'The composite attack-surface score is multiplied by a sensitivity factor before queue placement. Educational defaults are tunable per organisation:\n\n'
        md += '| Data sensitivity | Multiplier |\n|---|---|\n'
        md += `| High | ${sensHigh || '1.5'} |\n`
        md += `| Medium | ${sensMed || '1.0'} |\n`
        md += `| Low | ${sensLow || '0.7'} |\n\n`

        addExecutiveDocument({
          id: `kpi-dashboard-${activePersona}-pqc-governance`,
          moduleId: 'pqc-governance',
          type: 'kpi-dashboard',
          title: `PQC Governance KPI Dashboard — ${activePersona}`,
          data: md,
          createdAt: Date.now(),
        })
      }, 500)
    },
    [dimensions, addExecutiveDocument, activePersona, sensHigh, sensMed, sensLow]
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
      {seedSources.length > 0 && (
        <PreFilledBanner
          summary={`KPI defaults derived from ${seedSources.join(' + ')}.`}
          onClear={() => {
            /* KPIs auto-recompute from data; nothing local to clear */
          }}
        />
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground flex-1">
          Adjust KPI sliders to reflect your organization&apos;s PQC migration progress. Vendor
          Readiness and threat-scoped KPIs auto-populate from the catalog, industry threats, and
          your assessment; weights adapt to the selected persona lens.
        </p>
        <KpiPersonaSelector value={activePersona} onChange={setPersonaOverride} />
      </div>

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
        allowWeightEditing={true}
        showExport={true}
        exportFilename={`pqc-governance-kpi-${activePersona}`}
        exportFormats={['markdown', 'csv', 'pdf']}
        includeTargetsInExport={true}
      />

      {/* CSWP.39 §5.4 — Sensitivity multiplier */}
      <div className="glass-panel p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Sensitivity Multiplier (CSWP.39 §5.4)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Tune the multiplier applied to the composite attack-surface score before queue
            placement. Educational defaults; values export with the dashboard markdown.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="cswp39-sens-high"
              className="text-xs font-medium text-foreground block mb-1"
            >
              High sensitivity
            </label>
            <input
              id="cswp39-sens-high"
              type="text"
              inputMode="decimal"
              className="w-full text-sm rounded-md border border-input bg-background p-2"
              value={sensHigh}
              onChange={(e) => setSensHigh(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="cswp39-sens-med"
              className="text-xs font-medium text-foreground block mb-1"
            >
              Medium sensitivity
            </label>
            <input
              id="cswp39-sens-med"
              type="text"
              inputMode="decimal"
              className="w-full text-sm rounded-md border border-input bg-background p-2"
              value={sensMed}
              onChange={(e) => setSensMed(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="cswp39-sens-low"
              className="text-xs font-medium text-foreground block mb-1"
            >
              Low sensitivity
            </label>
            <input
              id="cswp39-sens-low"
              type="text"
              inputMode="decimal"
              className="w-full text-sm rounded-md border border-input bg-background p-2"
              value={sensLow}
              onChange={(e) => setSensLow(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

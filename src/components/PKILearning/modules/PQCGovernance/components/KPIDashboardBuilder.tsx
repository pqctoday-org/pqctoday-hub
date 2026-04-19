// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { DataDrivenScorecard, KpiPersonaSelector } from '@/components/PKILearning/common/executive'
import type { KpiPersonaId } from '@/data/kpiCatalog'
import { KPI_PERSONAS, buildDimensions } from '@/data/kpiCatalog'

const SURFACE = 'governance' as const

function coercePersona(p: string | null | undefined): KpiPersonaId {
  if (p && (KPI_PERSONAS as readonly string[]).includes(p)) return p as KpiPersonaId
  return 'executive'
}

export const KPIDashboardBuilder: React.FC = () => {
  const { addExecutiveDocument } = useModuleStore()
  const execData = useExecutiveModuleData()
  const globalPersona = usePersonaStore((s) => s.selectedPersona)

  // Scoped persona override (does not mutate global persona store)
  const [personaOverride, setPersonaOverride] = useState<KpiPersonaId | null>(null)
  const activePersona: KpiPersonaId = personaOverride ?? coercePersona(globalPersona)

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
    [dimensions, addExecutiveDocument, activePersona]
  )

  return (
    <div className="space-y-6">
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
    </div>
  )
}

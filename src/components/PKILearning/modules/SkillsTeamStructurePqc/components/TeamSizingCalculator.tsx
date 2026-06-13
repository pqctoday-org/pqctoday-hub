// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { Calculator, Info } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { ExportableArtifact } from '../../../common/executive'
import { Button } from '@/components/ui/button'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { ROLE_CROSSWALK, CORE_ROLE_ORDER, ROLE_DETAIL, SIZING } from '../data/teamModel'

type Phase = 'firstTwoYears' | 'productionRollout'

/** Round up to a sensible whole-FTE count (never below the dedicated core). */
function variableFte(instances: number, ratio: number): number {
  if (instances <= 0) return 0
  return Math.ceil(instances / ratio)
}

const DEDICATED_CORE_COUNT = CORE_ROLE_ORDER.filter((r) => ROLE_DETAIL[r].dedicatedOverhead).length

export const TeamSizingCalculator: React.FC = () => {
  const [instances, setInstances] = useState<number>(2000)
  const [phase, setPhase] = useState<Phase>('firstTwoYears')
  const [otInScope, setOtInScope] = useState<boolean>(false)
  const [seedCleared, setSeedCleared] = useState(false)
  const { addExecutiveDocument } = useModuleStore()
  const { industry } = useExecutiveModuleData()

  const ratio =
    phase === 'firstTwoYears' ? SIZING.firstTwoYearsRatio : SIZING.productionRolloutRatio

  const variable = useMemo(() => variableFte(instances, ratio), [instances, ratio])

  // Dedicated overhead is staffed regardless of estate size. The variable FTE
  // pool is distributed to the scaling roles; the dedicated core is always on.
  const totalFte = useMemo(() => {
    // Dedicated core counts as ~1 FTE each (QRPM 1.0, Architect ~0.75, PMO ~0.75).
    const dedicated = DEDICATED_CORE_COUNT
    const ot = otInScope ? 1 : 0
    return Math.max(dedicated, variable) + ot
  }, [variable, otInScope])

  const band = useMemo(() => {
    if (instances < SIZING.partTimeBelow) {
      return {
        tone: 'text-status-warning',
        label: 'Small estate',
        note: `Below ${SIZING.partTimeBelow.toLocaleString()} instances: a part-time QRPM with consulting augmentation for the Cryptographic Architect role is viable.`,
      }
    }
    if (instances > SIZING.programOfficeAbove) {
      return {
        tone: 'text-status-error',
        label: 'Program-office estate',
        note: `Above ${SIZING.programOfficeAbove.toLocaleString()} instances: plan a dedicated program office with ${SIZING.programOfficeFteLow}–${SIZING.programOfficeFteHigh} FTEs at peak.`,
      }
    }
    return {
      tone: 'text-primary',
      label: 'Standard estate',
      note: 'Apply the sizing heuristic directly; keep the dedicated core staffed throughout.',
    }
  }, [instances])

  const exportMarkdown = useMemo(() => {
    let md = '# PQC Team Sizing Plan\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`
    md += `- **Cryptographic instances (CBOM):** ${instances.toLocaleString()}\n`
    md += `- **Phase:** ${phase === 'firstTwoYears' ? 'First two years (discovery, CBOM, risk scoring, pilot)' : 'Production rollout (mature tooling)'}\n`
    md += `- **Sizing ratio:** 1 FTE per ${ratio.toLocaleString()} instances\n`
    md += `- **OT in scope:** ${otInScope ? 'Yes (+1 OT Security Specialist)' : 'No'}\n`
    md += `- **Estimated total program FTEs:** ${totalFte}\n\n`
    md += `> ${band.note}\n\n`
    md += '## Core roles\n\n'
    md += '| Role | Typical FTE | Source | Dedicated overhead |\n'
    md += '|------|-------------|--------|--------------------|\n'
    for (const roleId of CORE_ROLE_ORDER) {
      const role = ROLE_CROSSWALK[roleId]
      const detail = ROLE_DETAIL[roleId]
      md += `| ${role.label} | ${role.typicalFte} | ${detail.source} | ${detail.dedicatedOverhead ? 'Yes' : 'No'} |\n`
    }
    md +=
      '\nSizing heuristic (Applied Quantum PQC Migration Framework, p. 161): one dedicated FTE per 500 cryptographic instances for the first two years, dropping to one per 1,000 during production rollout. QRPM, Cryptographic Architect, and PMO Analyst are dedicated overhead regardless of estate size.\n'
    return md
  }, [instances, phase, ratio, otInScope, totalFte, band])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `skills-team-${Date.now()}`,
      moduleId: 'skills-team-structure',
      type: 'skills-team-plan',
      title: 'PQC Team Sizing Plan',
      data: exportMarkdown,
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument, exportMarkdown])

  return (
    <div className="space-y-6">
      {!seedCleared && (
        <PreFilledBanner
          summary={`Default estate of 2,000 cryptographic instances${industry ? ` (${industry} context)` : ''}. Replace with your CBOM count.`}
          onClear={() => {
            setInstances(0)
            setSeedCleared(true)
          }}
        />
      )}
      <p className="text-sm text-muted-foreground">
        Convert your cryptographic estate size into a program FTE estimate. Team size depends on
        estate complexity, not on revenue or headcount.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <label htmlFor="sts-instances" className="block text-xs font-bold text-foreground mb-2">
            Cryptographic instances (CBOM)
          </label>
          <input
            id="sts-instances"
            type="number"
            min={0}
            step={100}
            value={instances}
            onChange={(e) => setInstances(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            TLS endpoints, certificates, HSMs, keys, libraries, etc.
          </p>
        </div>

        <div className="glass-panel p-4">
          <span className="block text-xs font-bold text-foreground mb-2">Program phase</span>
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Program phase">
            {(
              [
                ['firstTwoYears', `First two years (1 / ${SIZING.firstTwoYearsRatio})`],
                ['productionRollout', `Production rollout (1 / ${SIZING.productionRolloutRatio})`],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant="ghost"
                role="radio"
                aria-checked={phase === value}
                onClick={() => setPhase(value)}
                className={`justify-start text-left text-xs px-3 py-2 rounded border h-auto ${
                  phase === value
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-4">
          <span className="block text-xs font-bold text-foreground mb-2">OT in scope?</span>
          <Button
            variant="ghost"
            role="switch"
            aria-checked={otInScope}
            onClick={() => setOtInScope((v) => !v)}
            className={`w-full justify-start text-left text-xs px-3 py-2 rounded border h-auto ${
              otInScope
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground'
            }`}
          >
            {otInScope ? 'Yes — add OT Security Specialist' : 'No OT systems'}
          </Button>
          <p className="text-[10px] text-muted-foreground mt-2">
            OT Security Specialists are scarce; add ~1 FTE when ICS/SCADA is in scope.
          </p>
        </div>
      </div>

      {/* Result */}
      <div className="glass-panel p-6 text-center">
        <Calculator size={20} className="text-primary mx-auto mb-2" />
        <div className="text-4xl font-bold text-gradient">{totalFte}</div>
        <div className="text-sm text-muted-foreground mt-1">estimated program FTEs</div>
        <div className={`mt-3 text-xs font-bold ${band.tone}`}>{band.label}</div>
        <div className="flex items-start gap-2 justify-center mt-2 max-w-xl mx-auto">
          <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground text-left">{band.note}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Variable pool: {variable} FTE from the {ratio.toLocaleString()}-instance ratio &middot;
          dedicated core: {DEDICATED_CORE_COUNT} (QRPM, Cryptographic Architect, PMO Analyst)
          {otInScope ? ' · +1 OT specialist' : ''}.
        </p>
      </div>

      {/* Export */}
      <ExportableArtifact
        title="Team Sizing Plan Export"
        exportData={exportMarkdown}
        filename="pqc-team-sizing-plan"
        formats={['markdown', 'pdf']}
        onExport={handleExport}
        wideTable
      >
        <p className="text-sm text-muted-foreground">
          Export your sizing plan and core-role table as Markdown.
        </p>
      </ExportableArtifact>
    </div>
  )
}

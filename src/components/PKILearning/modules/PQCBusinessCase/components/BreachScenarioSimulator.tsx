// SPDX-License-Identifier: AGPL-3.0-only
import {
  BREACH_SCENARIO_READER_METHOD,
  BREACH_SCENARIO_EARLY_ACTION,
  breachScenarioMethodMarkdown,
} from '@/utils/breachScenarioReaderMethod'
import React, { useState, useMemo, useEffect } from 'react'
import { AlertTriangle, Info, TrendingUp, Shield } from 'lucide-react'
import {
  BreachCostModel,
  type BreachScenarioInputs,
} from '@/components/PKILearning/common/executive'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ForgeryRiskPanel } from './ForgeryRiskPanel'
import type { BreachOutput } from '../types'
import {
  DATA_SENSITIVITY_LABELS,
  DATA_SHELF_LIFE_YEARS,
  type DataSensitivityClass,
} from '@/utils/breachCostModel'
import { IBM_BASELINE_UNVERIFIED_NOTE } from '@/data/roiBaselines'
import {
  probabilityProvenance,
  probabilityProvenanceMarkdown,
  restoredProbabilityOrigin,
} from '@/utils/breachProbabilityOrigin'

function fmtCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const AVAILABLE_INDUSTRIES = [
  'Finance & Banking',
  'Healthcare',
  'Government & Defense',
  'Technology',
  'Telecommunications',
  'Energy & Utilities',
  'Retail & E-Commerce',
  'Aerospace',
  'Automotive',
  'Education',
  'Other',
]

interface BreachScenarioSimulatorProps {
  onOutput?: (output: BreachOutput) => void
}

export const BreachScenarioSimulator: React.FC<BreachScenarioSimulatorProps> = ({ onOutput }) => {
  const data = useExecutiveModuleData()
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  // Restore the last-saved scenario so the tool round-trips instead of
  // resetting to the assessment default on every visit. Previously only
  // `selectedIndustry` was saved/restored — the model's other 7 sliders
  // (severity, years-of-data, org size, HNDL factor, planning horizon,
  // discount rate, migration duration, region) reset to defaults on every
  // remount even though `industry` correctly persisted, live-verified.
  type SavedBreachScenarioInputs = { selectedIndustry: string } & Partial<BreachScenarioInputs>
  const savedInputs = useSavedArtifactInputs<SavedBreachScenarioInputs>('breach-scenario')
  const [selectedIndustry, setSelectedIndustry] = useState(
    savedInputs?.selectedIndustry ?? data.industry ?? 'Other'
  )
  const [modelInputs, setModelInputs] = useState<BreachScenarioInputs | null>(null)
  const [breachCosts, setBreachCosts] = useState<{
    classicalCost: number
    quantumCost: number
    delta: number
    pCrqc: number
    quantumALE: number
    latestSafeStartYear: number
    alreadyLate: boolean
    dataSensitivityClass: DataSensitivityClass
    yearsOfData: number
    hndlFactorPct: number
    annualBreachProbPct: number
  } | null>(null)

  const findings = useMemo(() => {
    if (!breachCosts) return []

    const items: string[] = []

    items.push(
      `A CRQC (cryptographically relevant quantum computer) has a ${Math.round(breachCosts.pCrqc * 100)}% chance of existing within the planning horizon (consensus scenario, GRI 2025) — the probability-weighted expected annual loss for the ${selectedIndustry} sector is ${fmtCurrency(breachCosts.quantumALE)}.`
    )

    if (breachCosts.alreadyLate) {
      items.push(
        `Migration is already overdue: it should have started by ${Math.round(breachCosts.latestSafeStartYear)} to keep the selected data class protected through the median CRQC arrival year.`
      )
    } else {
      items.push(
        `Migration should start no later than ${Math.round(breachCosts.latestSafeStartYear)} to keep the selected data class protected through the median CRQC arrival year (Mosca's theorem: shelf life + migration time ≤ time until CRQC).`
      )
    }

    if (breachCosts.delta > 5_000_000) {
      items.push(
        `If a CRQC already existed, the additional quantum risk exposure would exceed $5M — but that figure alone overstates near-term urgency versus the probability-weighted number above.`
      )
    }

    if (data.criticalThreatCount > 0) {
      items.push(
        `${data.criticalThreatCount} critical/high-severity quantum threats currently target this industry.`
      )
    }

    if (data.migrationDeadlineYear) {
      const yearsRemaining = data.migrationDeadlineYear - new Date().getFullYear()
      if (yearsRemaining <= 3) {
        items.push(
          `Regulatory deadline in ${data.migrationDeadlineYear} (${yearsRemaining} years) adds urgency to breach prevention through PQC adoption.`
        )
      }
    }

    return items
  }, [breachCosts, selectedIndustry, data.criticalThreatCount, data.migrationDeadlineYear])

  const exportMarkdown = useMemo(() => {
    if (!breachCosts) return ''
    let md = `# PQC Breach Scenario — ${selectedIndustry}\n\n`
    md += `**Generated:** ${new Date().toLocaleDateString()}\n\n`
    md += `| Metric | Value |\n|--------|-------|\n`
    md += `| Classical breach (per event) | ${fmtCurrency(breachCosts.classicalCost)} |\n`
    md += `| Quantum-enabled breach (per event, if CRQC exists) | ${fmtCurrency(breachCosts.quantumCost)} |\n`
    md += `| Additional quantum risk (if CRQC exists) | ${fmtCurrency(breachCosts.delta)} |\n`
    md += `| Probability CRQC exists within horizon | ${Math.round(breachCosts.pCrqc * 100)}% |\n`
    md += `| Probability-weighted expected annual loss | ${fmtCurrency(breachCosts.quantumALE)} |\n`
    md += `| Latest safe migration start year | ${Math.round(breachCosts.latestSafeStartYear)} |\n\n`
    if (modelInputs)
      md += probabilityProvenanceMarkdown(
        probabilityProvenance(
          modelInputs.annualBreachProbPct,
          modelInputs.orgSizeTier,
          restoredProbabilityOrigin(
            modelInputs.annualBreachProbabilityOrigin,
            modelInputs.annualBreachProbPct,
            modelInputs.orgSizeTier,
            true
          )
        )
      )
    if (modelInputs) {
      md += `## Selected model inputs\n\n`
      md += `- Breach severity multiplier: ${modelInputs.breachScale}; region preset: ${modelInputs.region}; migration-duration assumption: ${modelInputs.migrationDurationYears} years.\n`
      md += `- Corpus: ${modelInputs.yearsOfData} years; HNDL exposure: ${modelInputs.hndlFactorPct}%.\n`
      md += `- Data class: ${DATA_SENSITIVITY_LABELS[modelInputs.dataSensitivityClass]}; sample shelf-life preset: ${DATA_SHELF_LIFE_YEARS[modelInputs.dataSensitivityClass]} years; decryption gap: 0 (newest data assumed fresh).\n`
      md += `- Planning horizon: ${modelInputs.planningHorizonYears} years; annual discount rate: ${(modelInputs.discountRateAnnual * 100).toFixed(2)}%.\n\n`
    }
    md += breachScenarioMethodMarkdown()
    if (findings.length > 0) {
      md += `## Key findings\n\n`
      for (const f of findings) md += `- ${f}\n`
      md += `\n`
    }
    md += `*Illustrative — IBM Cost of a Data Breach 2025 per-sector baselines (one edition behind; IBM published its 2026 global report) and Global Risk Institute Quantum Threat Timeline 2025 baselines.*\n`
    md += `\n*${IBM_BASELINE_UNVERIFIED_NOTE}*\n`
    return md
  }, [breachCosts, selectedIndustry, findings, modelInputs])

  // Shared with the export below (`output:`) so Board Pitch Builder can read
  // the same numbers whether it's chained live via props (in the linear
  // wizard) or reads the last saved artifact (Simulation, Business Center).
  const outputPayload: BreachOutput | null = useMemo(
    () =>
      breachCosts
        ? {
            industry: selectedIndustry,
            classicalCostUSD: breachCosts.classicalCost,
            quantumCostUSD: breachCosts.quantumCost,
            deltaUSD: breachCosts.delta,
            pCrqc: breachCosts.pCrqc,
            quantumALEUSD: breachCosts.quantumALE,
            latestSafeStartYear: breachCosts.latestSafeStartYear,
            alreadyLate: breachCosts.alreadyLate,
            dataSensitivityClass: breachCosts.dataSensitivityClass,
            yearsOfData: breachCosts.yearsOfData,
            hndlFactorPct: breachCosts.hndlFactorPct,
            annualBreachProbPct: breachCosts.annualBreachProbPct,
            probabilityProvenance: modelInputs
              ? probabilityProvenance(
                  modelInputs.annualBreachProbPct,
                  modelInputs.orgSizeTier,
                  restoredProbabilityOrigin(
                    modelInputs.annualBreachProbabilityOrigin,
                    modelInputs.annualBreachProbPct,
                    modelInputs.orgSizeTier,
                    true
                  )
                )
              : undefined,
          }
        : null,
    [breachCosts, selectedIndustry, modelInputs]
  )

  useEffect(() => {
    if (onOutput && outputPayload) onOutput(outputPayload)
  }, [onOutput, outputPayload])

  return (
    <div className="space-y-8">
      {/* Industry selector */}
      <div className="glass-panel p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-sm font-medium text-foreground shrink-0">Industry Sector:</span>
          <FilterDropdown
            noContainer
            selectedId={selectedIndustry}
            onSelect={(id) => setSelectedIndustry(id)}
            items={AVAILABLE_INDUSTRIES.map((ind) => ({ id: ind, label: ind }))}
          />
          {savedInputs ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info size={12} />
              Restored from your last saved scenario
            </span>
          ) : (
            data.isAssessmentComplete &&
            data.industry && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info size={12} />
                Pre-selected from your assessment
              </span>
            )
          )}
        </div>
      </div>

      {/* Breach Cost Model */}
      <BreachCostModel
        industry={selectedIndustry}
        initialValues={savedInputs}
        onCostCalculated={setBreachCosts}
        onInputsChanged={setModelInputs}
      />

      {/* Summary Panel */}
      {breachCosts && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-status-warning" />
            <h3 className="text-lg font-bold text-foreground">Key Findings</h3>
          </div>
          <div className="space-y-2">
            {findings.map((finding, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-primary font-bold text-sm shrink-0 mt-0.5">&bull;</span>
                <p className="text-sm text-foreground/80">{finding}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What This Means */}
      {breachCosts && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              What This Means for Your Business Case
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-status-error" />
                <p className="text-sm font-medium text-foreground">Cost of Inaction</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Every year without PQC migration increases your exposure to quantum-enabled attacks.
                HNDL (Harvest Now, Decrypt Later) means adversaries are already collecting encrypted
                data that will become readable once quantum computers mature. The longer you wait,
                the more historical data is at risk.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-status-success" />
                <p className="text-sm font-medium text-foreground">Value of Early Action</p>
              </div>
              <p className="text-xs text-muted-foreground">{BREACH_SCENARIO_EARLY_ACTION}</p>
            </div>
          </div>
          {data.frameworksByIndustry.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Compliance context:</strong>{' '}
                {data.frameworksByIndustry.length} compliance framework
                {data.frameworksByIndustry.length !== 1 ? 's' : ''} apply to your industry.
                Non-compliance penalties amplify breach costs through regulatory fines, audit
                requirements, and potential loss of operating licenses.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Signature-forgery risk — the quantum attack class the cost model above cannot represent */}
      {breachCosts && <ForgeryRiskPanel />}

      {breachCosts && (
        <ExportableArtifact
          title="Breach Scenario — Export"
          exportData={exportMarkdown}
          filename="pqc-breach-scenario"
          formats={['markdown', 'pdf', 'docx']}
          onExport={() =>
            addExecutiveDocument({
              id: `breach-scenario-${Date.now()}`,
              moduleId: 'pqc-business-case',
              type: 'breach-scenario',
              title: `Breach Scenario — ${selectedIndustry} (${new Date().toLocaleDateString()})`,
              data: exportMarkdown,
              inputs: { selectedIndustry, ...modelInputs },
              output: outputPayload ?? undefined,
              createdAt: Date.now(),
            })
          }
        >
          <p className="text-sm text-muted-foreground">
            Export the breach scenario as markdown, PDF, or DOCX — also saved to your Command Center
            Risk Artifacts.
          </p>
        </ExportableArtifact>
      )}

      {/* How the number is built. Eight interacting parameters produced a
          headline figure with no on-page account of how — and the chain
          changed materially in the 2026-08-10 remediation, so the explanation
          has to describe the model that actually runs. (W4-1.) */}
      {breachCosts && (
        <details className="glass-panel p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            How this number is built
          </summary>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground/80">1. Cost of one breach today (SLE).</strong> The
              industry-average total breach cost from{' '}
              <a
                href="https://www.ibm.com/reports/data-breach"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                IBM&apos;s Cost of a Data Breach Report 2025
              </a>
              , multiplied by your severity setting. IBM&apos;s figure already includes detection,
              notification, lost business and reputational damage, so no separate reputational term
              is added on top — that would double-count.{' '}
              <span className="text-status-warning">{IBM_BASELINE_UNVERIFIED_NOTE}</span>
            </p>
            <p>
              <strong className="text-foreground/80">
                2. How much of the harvested corpus still matters.
              </strong>{' '}
              {BREACH_SCENARIO_READER_METHOD.freshness} Selected corpus: {breachCosts.yearsOfData}{' '}
              years; selected shelf-life preset:{' '}
              {DATA_SHELF_LIFE_YEARS[breachCosts.dataSensitivityClass]} years.
            </p>
            <p>
              <strong className="text-foreground/80">3. Quantum amplification.</strong>{' '}
              {BREACH_SCENARIO_READER_METHOD.amplification}
            </p>
            <p>
              <strong className="text-foreground/80">
                4. Weighting by whether a CRQC exists at all.
              </strong>{' '}
              {BREACH_SCENARIO_READER_METHOD.probability} Current modeled horizon value:{' '}
              {Math.round(breachCosts.pCrqc * 100)}%.
            </p>
            <p>
              <strong className="text-foreground/80">5. Present value.</strong>{' '}
              {BREACH_SCENARIO_READER_METHOD.presentValue}
            </p>
            <p className="pt-1 border-t border-border/50">
              Shelf-life presets, exposure settings and scenario curves are planning inputs. Treat
              the output as a structured argument, not a measurement or programme approval.
            </p>
          </div>
        </details>
      )}
    </div>
  )
}

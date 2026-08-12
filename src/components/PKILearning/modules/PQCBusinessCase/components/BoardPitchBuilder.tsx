// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo, useState } from 'react'
import { FileText, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PersonaPitchBanner } from './PersonaPitchBanner'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { useSavedArtifactInputs, useSavedArtifactOutput } from '@/hooks/useSavedArtifactInputs'
import { getPitchVariant } from './pitchVariants'
import type { FormData } from './pitchVariants'
import type { ROIOutput, BreachOutput, InactionOutput } from '../types'
import { IBM_BASELINE_UNVERIFIED_NOTE } from '@/data/roiBaselines'

const MODULE_ID = 'pqc-business-case'

function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}

interface BoardPitchBuilderProps {
  roiOutput?: ROIOutput | null
  breachOutput?: BreachOutput | null
  inactionOutput?: InactionOutput | null
}

export const BoardPitchBuilder: React.FC<BoardPitchBuilderProps> = ({
  roiOutput,
  breachOutput,
  inactionOutput,
}) => {
  const data = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const [seedCleared, setSeedCleared] = useState(false)
  // Restore the last-saved pitch so edits survive navigation — takes priority
  // over the freshly-computed assessment/ROI defaults below, same as the
  // Roadmap Builder's saved-plan restore.
  const savedFormData = useSavedArtifactInputs<FormData>('board-deck')

  // roiOutput/breachOutput/inactionOutput only arrive as live props inside the
  // linear `/learn/pqc-business-case` wizard (see PQCBusinessCaseModule),
  // which holds them in local state across its steps. Opened any other way —
  // the Simulation embed or the standalone Business Center route — those
  // props are always undefined, even if the user just ran the upstream tools
  // and exported them. Fall back to each tool's last saved output so the
  // cost-benefit/budget/urgency figures aren't silently generic placeholder
  // text outside that one wizard session.
  const savedRoiOutput = useSavedArtifactOutput<ROIOutput>('roi-model')
  const savedBreachOutput = useSavedArtifactOutput<BreachOutput>('breach-scenario')
  const savedInactionOutput = useSavedArtifactOutput<InactionOutput>('cost-of-inaction')
  const effectiveRoiOutput = roiOutput ?? savedRoiOutput ?? null
  const effectiveBreachOutput = breachOutput ?? savedBreachOutput ?? null
  const effectiveInactionOutput = inactionOutput ?? savedInactionOutput ?? null

  // Key the variant (and therefore the whole ArtifactBuilder below) on persona
  // so switching roles resets the form state to the new persona's defaults.
  const variant = useMemo(() => getPitchVariant(selectedPersona, data), [selectedPersona, data])

  const sections = useMemo(() => {
    return variant.sections.map((s) => ({
      ...s,
      fields: s.fields.map((f) => {
        if (
          (effectiveRoiOutput || effectiveInactionOutput) &&
          s.id === 'cost-benefit' &&
          f.id === 'analysis'
        ) {
          const parts: string[] = []
          if (effectiveRoiOutput) {
            parts.push(
              `Migration investment: ${formatCurrency(effectiveRoiOutput.totalCostUSD)} | 3-year ROI: ${effectiveRoiOutput.roiPercent.toFixed(0)}% | Payback: ${Math.round(effectiveRoiOutput.paybackMonths)} months | Annual breach cost savings: ${formatCurrency(effectiveRoiOutput.breachCostSavingsUSD)}`
            )
          }
          if (effectiveInactionOutput) {
            parts.push(
              `Cost of inaction (delaying ${effectiveInactionOutput.delayYears}yr): ${formatCurrency(effectiveInactionOutput.costOfInactionUSD)}`
            )
          }
          return { ...f, defaultValue: parts.join('\n') }
        }
        if (effectiveBreachOutput && s.id === 'quantum-urgency' && f.id === 'urgency') {
          return {
            ...f,
            defaultValue: `Classical breach cost: ${formatCurrency(effectiveBreachOutput.classicalCostUSD)} | Quantum-enabled breach cost: ${formatCurrency(effectiveBreachOutput.quantumCostUSD)} | Delta: ${formatCurrency(effectiveBreachOutput.deltaUSD)}\n\n${f.defaultValue}`,
          }
        }
        if (effectiveRoiOutput && s.id === 'budget' && f.id === 'amount') {
          return {
            ...f,
            defaultValue: formatCurrency(effectiveRoiOutput.totalCostUSD),
          }
        }
        return f
      }),
    }))
  }, [variant.sections, effectiveRoiOutput, effectiveBreachOutput, effectiveInactionOutput])

  const sources: string[] = []
  if (!seedCleared) {
    if (data.industry) sources.push(`industry (${data.industry})`)
    if (data.riskScore !== null) sources.push(`assessment risk score`)
    if (data.myFrameworks.length > 0)
      sources.push(
        `${data.myFrameworks.length} starred framework${data.myFrameworks.length !== 1 ? 's' : ''}`
      )
    if (data.myProducts.length > 0)
      sources.push(
        `${data.myProducts.length} product${data.myProducts.length !== 1 ? 's' : ''} from /migrate`
      )
    if (data.myThreats.length > 0)
      sources.push(
        `${data.myThreats.length} threat${data.myThreats.length !== 1 ? 's' : ''} from /threats`
      )
    if (data.myTimelineCountries.length > 0)
      sources.push(
        `${data.myTimelineCountries.length} deadline countr${data.myTimelineCountries.length !== 1 ? 'ies' : 'y'} from /timeline`
      )
  }

  /**
   * Basis-of-figures footer appended to every persona variant.
   *
   * This deck is the most outward-facing artifact the suite produces — it goes
   * in front of a board — and it carried no source attribution at all: zero
   * citations, zero URLs, while quoting ROI, breach and cost-of-inaction
   * figures inherited from three separately-sourced models. A reader could not
   * tell which numbers rest on published data and which are analyst estimates.
   * (Audit 2026-08-10, W5.)
   */
  const BASIS_OF_FIGURES = [
    '',
    '---',
    '',
    '## Basis of figures',
    '',
    `- **Breach cost baselines** — IBM Cost of a Data Breach, per-sector averages. Sectors without a dedicated IBM figure use a labelled proxy. ${IBM_BASELINE_UNVERIFIED_NOTE}`,
    '- **Annual breach probability** — Cyentia Institute, *Information Risk Insights Study (IRIS) 2025*, Figures 6 and 7, read from the report itself: 8.7% (firms under $10M revenue), 9.3% (typical firm), 12.8% ($10B-$100B). The tiers sit close together because IRIS 2025 finds they have converged.',
    '- **CRQC arrival probability** — Global Risk Institute, Quantum Threat Timeline Report 2025: a CRQC is "quite possible (28-49%) within the next 10 years, and likely (51-70%) in the next 15", from a survey of 26 experts.',
    '- **Migration cost, delay premium, and staffing** — analyst estimates for this organization, not cited figures.',
    '',
    '*Probability-weighted figures blend a "CRQC exists" and "no CRQC" outcome across the planning horizon; they are structured arguments, not measurements. Confirm every figure against your own finance function before it reaches a board paper.*',
    '',
  ].join('\n')

  const renderPreviewBound = useCallback(
    (formData: FormData) => variant.renderPreview(formData, data) + BASIS_OF_FIGURES,
    [variant, data, BASIS_OF_FIGURES]
  )

  const handleExport = useCallback(
    (formData: FormData) => {
      const markdown = variant.renderPreview(formData, data) + BASIS_OF_FIGURES
      addExecutiveDocument({
        id: `board-pitch-${selectedPersona ?? 'default'}-${Date.now()}`,
        moduleId: MODULE_ID,
        type: 'board-deck',
        title: variant.title,
        data: markdown,
        // Persist the edited form fields so the pitch is restorable (see savedFormData above).
        inputs: formData,
        createdAt: Date.now(),
      })
    },
    [variant, data, selectedPersona, addExecutiveDocument]
  )

  return (
    <div className="space-y-6">
      <PersonaPitchBanner persona={selectedPersona} objective={variant.objective} />

      {savedFormData && (
        <PreFilledBanner summary="Restored your last saved pitch — edit any field and re-export to update it." />
      )}

      {!savedFormData && sources.length > 0 && (
        <PreFilledBanner
          summary={`Seeded from ${sources.join(' + ')}.`}
          onClear={() => setSeedCleared(true)}
        />
      )}

      {(effectiveRoiOutput || effectiveBreachOutput || effectiveInactionOutput) && (
        <PreFilledBanner
          summary={[
            effectiveRoiOutput &&
              `ROI data ${roiOutput ? 'from Step 2' : 'from your last ROI Calculator export'} (investment: ${formatCurrency(effectiveRoiOutput.totalCostUSD)}, ROI: ${effectiveRoiOutput.roiPercent.toFixed(0)}%)`,
            effectiveBreachOutput &&
              `Breach scenario data ${breachOutput ? 'from Step 3' : 'from your last Breach Scenario Simulator export'} (delta: ${formatCurrency(effectiveBreachOutput.deltaUSD)})`,
            effectiveInactionOutput &&
              `Cost of inaction ${inactionOutput ? 'from Step 4' : 'from your last Cost of Inaction Analyzer export'} (${formatCurrency(effectiveInactionOutput.costOfInactionUSD)} over ${effectiveInactionOutput.delayYears}yr)`,
          ]
            .filter(Boolean)
            .join(' + ')}
        />
      )}

      <div className="glass-panel p-4 flex items-start gap-3">
        <FileText size={20} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">{variant.title}</p>
          <p className="text-xs text-muted-foreground">
            Every section is pre-populated from your assessment data. Edit any field inline, switch
            to Preview to see the formatted document, then export as Markdown or PPTX.
          </p>
          {data.isAssessmentComplete && (
            <p className="text-xs text-muted-foreground mt-2">
              Need the canonical board brief?{' '}
              <Link
                to="/report"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                Report Board Brief
                <ExternalLink size={10} />
              </Link>{' '}
              uses the same assessment data as a single-source view.
            </p>
          )}
        </div>
      </div>

      <ArtifactBuilder
        key={selectedPersona ?? 'default'}
        title={variant.title}
        description={variant.description}
        sections={sections}
        onExport={handleExport}
        exportFilename={variant.filename}
        renderPreview={renderPreviewBound}
        exportFormats={['markdown', 'pdf', 'pptx']}
        initialData={savedFormData}
      />

      <details className="glass-panel p-4">
        <summary className="text-sm font-medium text-foreground cursor-pointer">
          How this pitch is built
        </summary>
        <div className="mt-3 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Budget band:</strong> a base range keyed to your assessment risk level — Low/
            Moderate: $0.5M-$1.5M over 18-24 months; High: $1M-$3M over 24 months; Critical: $2M-$6M
            over 24-36 months.
          </p>
          <p>
            <strong>Scale multiplier:</strong> the band is then scaled by products in scope — ×1.5
            at 200+ products, ×1.2 at 50+, ×0.7 under 10, ×1 otherwise.
          </p>
          <p>
            <strong>Cost-of-inaction multiplier:</strong> the Cost-Benefit section frames inaction
            (penalties, breach response, contract loss, reputational damage) as an illustrative 3-5×
            the migration investment for critical/high risk, or 2-3× for moderate/low risk.
          </p>
          <p className="text-xs italic mt-2">
            Both figures are starting points for board discussion, not a quote — run the ROI
            Calculator (Step 2 of this workshop) for organization-specific numbers before committing
            to a budget ask.
          </p>
        </div>
      </details>
    </div>
  )
}

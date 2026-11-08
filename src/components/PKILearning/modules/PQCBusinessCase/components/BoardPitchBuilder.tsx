// SPDX-License-Identifier: AGPL-3.0-only
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
import {
  MODELLED_COST_NOTE,
  MODELLED_TOTAL_SENTENCE,
  NO_COST_ESTIMATE_NOTE,
} from './pitchVariants/sectionDefaults'
import type { FormData } from './pitchVariants'
import type { ROIOutput, BreachOutput, InactionOutput } from '../types'
import { IBM_BASELINE_UNVERIFIED_NOTE } from '@/data/roiBaselines'
import { productCountOutputNote } from './roiProductCount'

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
  const inactionSummary = effectiveInactionOutput
    ? effectiveInactionOutput.costOfInactionUSD >= 0
      ? `Incremental NPV of a ${effectiveInactionOutput.delayYears}-year delay: ${formatCurrency(effectiveInactionOutput.costOfInactionUSD)}`
      : `A ${effectiveInactionOutput.delayYears}-year delay lowers discounted NPV by ${formatCurrency(Math.abs(effectiveInactionOutput.costOfInactionUSD))}, while exposure remains higher for longer`
    : null

  // Key the variant (and therefore the whole ArtifactBuilder below) on persona
  // so switching roles resets the form state to the new persona's defaults.
  const variant = useMemo(() => getPitchVariant(selectedPersona, data), [selectedPersona, data])

  // Says so when the figures rest on the opening example or an unconfirmed restored count, so an
  // example never reaches a board slide looking like the reader's own estate.
  const countNote = productCountOutputNote(
    effectiveRoiOutput?.productsSource,
    effectiveRoiOutput?.productsToMigrate
  )

  const sections = useMemo(() => {
    const variantSections = variant.sections.map((s) => ({
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
              `Migration investment: ${formatCurrency(effectiveRoiOutput.totalCostUSD)}${countNote ? ` (${countNote})` : ''} | 3-year ROI: ${effectiveRoiOutput.roiPercent.toFixed(0)}% | Payback: ${Math.round(effectiveRoiOutput.paybackMonths)} months | Annual breach cost savings: ${formatCurrency(effectiveRoiOutput.breachCostSavingsUSD)}`
            )
          }
          if (effectiveInactionOutput) {
            parts.push(`${inactionSummary} (illustrative scenario; validate assumptions)`)
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
        // The amount now comes from the ROI model, so the breakdown must not
        // go on saying that no cost estimate is attached.
        if (
          effectiveRoiOutput &&
          s.id === 'budget' &&
          f.id === 'breakdown' &&
          typeof f.defaultValue === 'string'
        ) {
          return {
            ...f,
            // With products selected the first line is a different note, so the
            // modelled-total sentence goes in front of it instead.
            defaultValue: [
              f.defaultValue.includes(NO_COST_ESTIMATE_NOTE)
                ? f.defaultValue.replace(NO_COST_ESTIMATE_NOTE, MODELLED_COST_NOTE)
                : `${MODELLED_TOTAL_SENTENCE} ${f.defaultValue}`,
              countNote
                ? `\nCount behind the total: ${countNote}. Enter your own count in the ROI Calculator before presenting this figure.`
                : '',
            ].join(''),
          }
        }
        return f
      }),
    }))
    return [
      ...variantSections,
      {
        id: 'sources-assumptions',
        title: 'Sources and assumptions used',
        description:
          'Identify the source of each figure used in this proposal. For a sample, label invented inputs explicitly. For model outputs, record the model, input assumptions, source dates and limitations; consult the originating tool for its references. List only sources actually used.',
        fields: [
          {
            id: 'basis',
            label: 'Sources and assumptions used',
            type: 'textarea' as const,
            placeholder:
              'e.g. Fictional work-plan effort × sample daily rate + tooling allowance + reserve. State scope, uncertainty and what would refine the estimate.',
          },
        ],
      },
    ]
  }, [
    variant.sections,
    effectiveRoiOutput,
    effectiveBreachOutput,
    effectiveInactionOutput,
    inactionSummary,
    countNote,
  ])

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
    '- **Proposal figures** — entered estimates require a scope, model or quotation reference, reporting date and accountable owner. Catalogue coverage does not establish an estate cost.',
    effectiveRoiOutput || effectiveBreachOutput || effectiveInactionOutput
      ? `- **Imported financial scenarios** — inspect the saved model inputs and their baseline sources before adapting them. ${IBM_BASELINE_UNVERIFIED_NOTE}`
      : '- **Financial models** — no ROI, breach or delay-model output is attached; figures entered in this proposal have not been checked by a model.',
    '- **Funding** — distinguish total programme cost, existing commitments, the incremental request and gate-linked release conditions.',
    '',
    '*This is an educational proposal template, not an approved budget. Any loss probability or avoided-loss benefit remains a stated scenario assumption, not a measured outcome. Have the accountable finance and programme owners review the figures and decision rights.*',
    '',
  ].join('\n')

  // Source attribution belongs to this edited proposal, rather than an
  // unconditional list of datasets used by other tools. Older saved drafts
  // without this field remain editable and explicitly show the missing basis.
  const renderPreviewBound = useCallback(
    (formData: FormData) => {
      const basis = formData['sources-assumptions']?.basis
      const text = typeof basis === 'string' ? basis.trim() : ''
      return (
        variant.renderPreview(formData, data) +
        '\n\n---\n\n## Sources and assumptions used\n\n' +
        (text || '_Sources and assumptions not recorded. Review the basis of each figure._') +
        '\n' +
        BASIS_OF_FIGURES
      )
    },
    [variant, data, BASIS_OF_FIGURES]
  )

  const handleExport = useCallback(
    (formData: FormData) => {
      const markdown = renderPreviewBound(formData)
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
    [variant, renderPreviewBound, selectedPersona, addExecutiveDocument]
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
              `ROI data ${roiOutput ? 'from Step 2' : 'from your last ROI Calculator export'} (investment: ${formatCurrency(effectiveRoiOutput.totalCostUSD)}, ROI: ${effectiveRoiOutput.roiPercent.toFixed(0)}%${countNote ? `; ${countNote}` : ''})`,
            effectiveBreachOutput &&
              `Breach scenario data ${breachOutput ? 'from Step 3' : 'from your last Breach Scenario Simulator export'} (delta: ${formatCurrency(effectiveBreachOutput.deltaUSD)})`,
            effectiveInactionOutput &&
              `${inactionOutput ? 'Step 4' : 'Saved Cost of Inaction scenario'} (${inactionSummary})`,
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
            Draft fields can be pre-populated from assessment and saved scenarios. Record the
            sources and assumptions actually used, edit any field inline, switch to Preview to see
            the formatted document, then export as Markdown or PPTX.
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
            <strong>Programme budget:</strong> enter reviewed estimates for the named systems and
            services, planning horizon, dependencies and uncertainty. Catalogue coverage does not
            establish your organisation’s estate size or migration cost.
          </p>
          <p>
            <strong>Funding request:</strong> distinguish the total programme envelope, existing
            commitments, additional funding, annual allocations and the conditions for releasing
            each tranche.
          </p>
          <p>
            <strong>Benefits and avoided costs:</strong> enter documented scenario assumptions and
            their sources. The template does not infer a benefit multiple from the assessment risk
            level. Saved calculator outputs remain conditional on their inputs.
          </p>
          <p className="text-xs italic mt-2">
            Reconcile the proposal with the cost model and charter before submission. Your
            organisation’s governance determines approval authority; a completed template is not
            spending approval.
          </p>
        </div>
      </details>
    </div>
  )
}

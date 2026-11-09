// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { PIPELINE_STAGES } from '../data/pipelineStagesData'
import { ALGORITHM_LABELS } from '../data/platformEngConstants'
import {
  assessProtectionWindows,
  formatProtectionWindow,
  SAMPLE_COHORT_YEAR,
  windowOutcomeLabel,
} from '../utils/protectionWindows'

const CRQC_ITEMS = [2030, 2033, 2035, 2040].map((year) => ({
  id: String(year),
  label: `Illustrative scenario: ${year}`,
}))

export const QuantumThreatTimeline: React.FC = () => {
  const [crqcScenario, setCrqcScenario] = useState('2033')
  const [stageFilter, setStageFilter] = useState('All')
  const crqcYear = Number(crqcScenario)
  const assessment = assessProtectionWindows(PIPELINE_STAGES, crqcYear, stageFilter)
  const stageItems = [
    { id: 'All', label: 'All Stages' },
    ...PIPELINE_STAGES.map((stage) => ({ id: stage.id, label: stage.label })),
  ]

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Quantum Threat Timeline</h3>
        <p className="text-sm text-muted-foreground">
          Compare the fictional {SAMPLE_COHORT_YEAR} sample cohort with an illustrative CRQC
          horizon. Confidentiality asks how long recorded payloads must remain secret; authenticity
          asks how long signatures or credentials must remain trusted or usable. Signature windows
          are not HNDL. These inputs are planning assumptions, not forecasts or measurements.
        </p>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <FilterDropdown
            items={CRQC_ITEMS}
            selectedId={crqcScenario}
            onSelect={setCrqcScenario}
            label="CRQC Year"
            hideDefaultOption
            noContainer
            defaultIcon={<Calendar size={16} className="text-primary" />}
          />
          <FilterDropdown
            items={stageItems}
            selectedId={stageFilter}
            onSelect={setStageFilter}
            label="Pipeline Stage"
            defaultLabel="All Stages"
            noContainer
            defaultIcon={<Clock size={16} className="text-primary" />}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Model basis: cohort starts January 1, {SAMPLE_COHORT_YEAR} UTC; horizon is January 1,{' '}
          {crqcYear} UTC. Years are calendar years, days are 24 hours, and hours are 60 minutes.
          Open bounds have no assumed maximum.
        </p>
        <p className="text-sm font-bold">
          {assessment.assets.length} vulnerable assets in this cohort
        </p>
        <p className="text-xs text-muted-foreground">
          {assessment.notModeled} assets unassessed — no protection window modeled. An omitted
          purpose is not a claim that protection is unnecessary or established.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { name: 'Confidentiality windows', counts: assessment.confidentiality },
          { name: 'Authenticity windows', counts: assessment.authenticity },
        ].map(({ name, counts }) => (
          <section key={name} aria-label={name} className="glass-panel p-4 space-y-1">
            <h4 className="font-bold">{name}</h4>
            <p className="text-xs text-muted-foreground">
              {counts.total} explicitly modeled windows
            </p>
            <p>{counts.beyond} extend beyond horizon</p>
            <p>{counts.endsBy} end by horizon</p>
            <p>{counts.indeterminate} indeterminate</p>
            <p>{counts.unassessed} unassessed</p>
          </section>
        ))}
      </div>
      <div className="overflow-x-auto" role="region" aria-label="Protection window details">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {[
                'Asset / stage',
                'Recorded algorithm / key context',
                'Confidentiality',
                'Authenticity',
                'Sample PQC replacement',
              ].map((label) => (
                <th key={label} className="text-left p-2 text-muted-foreground font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assessment.assets.map((asset) => (
              <tr key={asset.id} className="border-b border-border/50">
                <td className="p-2 min-w-48">
                  <div className="text-xs font-bold">{asset.name}</div>
                  <div className="text-xs text-muted-foreground">{asset.stageName}</div>
                  <div className="text-xs text-muted-foreground">{asset.exposureWindow}</div>
                </td>
                <td className="p-2 text-xs">
                  {ALGORITHM_LABELS[asset.algorithm]} {asset.keySize}
                </td>
                {[
                  {
                    window: asset.protectionWindows?.confidentiality,
                    outcome: asset.confidentiality,
                  },
                  { window: asset.protectionWindows?.authenticity, outcome: asset.authenticity },
                ].map(({ window, outcome }, index) => (
                  <td key={index} className="p-2 min-w-40 text-xs">
                    <div>{formatProtectionWindow(window)}</div>
                    {window && (
                      <div className="mt-1 font-medium">{windowOutcomeLabel(outcome)}</div>
                    )}
                  </td>
                ))}
                <td className="p-2 text-xs font-mono">{asset.pqcReplacement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="glass-panel p-4 space-y-2 text-xs text-muted-foreground">
        <h4 className="font-bold text-foreground">
          Interpret the cohort, then reassess ongoing issuance
        </h4>
        <p>
          A short certificate window does not shorten a separately stated payload-confidentiality
          window. TLS payload confidentiality concerns key exchange, not certificate signing. An end
          by the horizon describes only this cohort, not the safety of an ongoing pipeline. Newly
          issued classical credentials require reassessment at their own issuance dates.
        </p>
        <p>
          With your production tools, inventory actual payload retention and signature/credential
          trust windows separately, retain their evidence and uncertainty, and test migration
          compatibility. Check applicable issuing guidance and system scope for obligations; these
          scenario years are not compliance deadlines or evidence that a replacement is deployed.
        </p>
      </div>
    </div>
  )
}

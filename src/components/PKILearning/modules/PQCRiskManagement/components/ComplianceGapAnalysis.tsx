// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Info, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { NssWorkedCases } from './NssWorkedCases'
import {
  CNSA_ACQUISITION_LABEL,
  CNSA_MANDATE_LABEL,
  CNSA_PHASE_OUT_LABEL,
} from '../data/cnsaLabels'
interface RiskEntry {
  id: string
  assetName: string
  currentAlgorithm: string
  threatVector: string
  likelihood: number
  impact: number
  mitigation: string
}
interface ComplianceGapAnalysisProps {
  riskEntries: RiskEntry[]
}

const CLASSICAL_PATTERNS = [
  'rsa',
  'ecdsa',
  'ecdh',
  'dh',
  'eddsa',
  'ed25519',
  'ed448',
  'x25519',
  'x448',
  'p-256',
  'p-384',
  'p-521',
  'secp',
  'aes-128',
  'des',
  '3des',
]
const PQC_PATTERNS = ['ml-kem', 'ml-dsa', 'slh-dsa', 'fn-dsa', 'lms', 'hss', 'xmss', 'frodo']

function classifyAlgorithm(algo: string): 'classical' | 'pqc' | 'unknown' {
  const lower = algo.toLowerCase()
  if (PQC_PATTERNS.some((p) => lower.includes(p))) return 'pqc'
  if (CLASSICAL_PATTERNS.some((p) => lower.includes(p))) return 'classical'
  return 'unknown'
}

// Oldest first. The CNSA 2.0 rows are the three dates of NSA's FAQ version 2.2 and apply to
// national security systems only; NIST IR 8547 is the separate NIST clock.
const MILESTONES = [
  { id: 'cnsa-acquisitions', label: CNSA_ACQUISITION_LABEL, year: CNSA_2_0.networkingRequired },
  { id: 'nist-deprecate', label: 'NIST Deprecation', year: NIST_DEPRECATION.deprecateClassical },
  { id: 'cnsa-phase-out', label: CNSA_PHASE_OUT_LABEL, year: CNSA_2_0.softwareExclusive },
  { id: 'cnsa-mandate', label: CNSA_MANDATE_LABEL, year: CNSA_2_0.networkingExclusive },
  { id: 'nist-disallow', label: 'NIST Disallowance', year: NIST_DEPRECATION.disallowClassical },
]
const NAME_LABELS = {
  pqc: 'PQC-name pattern',
  classical: 'Classical/symmetric name pattern',
  unknown: 'Name not classified',
}

export const ComplianceGapAnalysis: React.FC<ComplianceGapAnalysisProps> = ({ riskEntries }) => {
  const [crqcYear, setCrqcYear] = useState(2035)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const rows = riskEntries.map((entry) => ({
    entry,
    category: classifyAlgorithm(entry.currentAlgorithm),
  }))
  if (riskEntries.length === 0)
    return (
      <div className="space-y-6">
        <NssWorkedCases />
        <div className="glass-panel p-8 text-center space-y-4">
          <Info size={32} className="text-muted-foreground mx-auto" />
          <p>No risk register entries yet</p>
          <p className="text-sm text-muted-foreground">
            Add sample entries in the Risk Register Builder to inspect their name patterns.
            Framework applicability will remain unassessed.
          </p>
        </div>
      </div>
    )
  return (
    <div className="space-y-6">
      <NssWorkedCases />
      <aside
        aria-label="Name exercise scope"
        className="glass-panel p-4 text-sm text-muted-foreground"
      >
        The imported rows below recognize substrings in algorithm labels. This does not establish
        the operation, parameters, hybrid composition, implementation validation or applicable
        requirements. A PQC-name match is not compliance; an unknown name is not N/A or safe.
      </aside>
      <div className="glass-panel p-5 space-y-3">
        <h3 className="font-semibold text-foreground">
          Illustrative CRQC assumed year: {crqcYear}
        </h3>
        <input
          type="range"
          min={2028}
          max={2045}
          value={crqcYear}
          onChange={(e) => setCrqcYear(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="CRQC arrival year"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>2028</span>
          <span>2035</span>
          <span>2045</span>
        </div>
        <p className="text-xs text-muted-foreground">
          This selected year is an illustrative assumption, not a forecast or migration deadline. It
          does not determine framework applicability.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['pqc', 'classical', 'unknown'] as const).map((category) => (
          <div key={category} className="glass-panel p-4 border border-border text-center">
            <div className="text-3xl font-bold text-foreground">
              {rows.filter((r) => r.category === category).length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{NAME_LABELS[category]}</div>
          </div>
        ))}
      </div>
      <section className="glass-panel p-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground">
          Reference years — applicability not assessed
        </h4>
        <p className="text-xs text-muted-foreground">
          These imported reference years are not applied as requirements here. Confirm the source
          edition, system scope, operation and required parameters before using a date in a plan.
          This exercise has not confirmed applicability or approved an algorithm choice.
        </p>
        {MILESTONES.map((m) => (
          <p key={m.id} className="text-xs text-muted-foreground">
            {m.label}: {m.year} — applicability not assessed
          </p>
        ))}
      </section>
      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Sample algorithm-name review</h4>
        {rows.map(({ entry, category }) => (
          <div key={entry.id} className="glass-panel overflow-hidden">
            <Button
              variant="ghost"
              onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
              className="w-full h-auto flex items-center justify-between p-4 text-left whitespace-normal"
              aria-expanded={expandedRow === entry.id}
            >
              <span className="min-w-0">
                <span className="block font-medium">{entry.assetName}</span>
                <span className="block text-xs text-muted-foreground">
                  {entry.currentAlgorithm}
                </span>
              </span>
              <span className="ml-2 text-xs text-muted-foreground">{NAME_LABELS[category]}</span>
              <ChevronRight size={14} className="shrink-0" />
            </Button>
            {expandedRow === entry.id && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {MILESTONES.map((m) => (
                    <div key={m.id} className="rounded-lg p-3 border border-border text-xs">
                      <p>{m.label}</p>
                      <p>{m.year}</p>
                      <strong>Applicability not assessed</strong>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Review the cryptographic operation, key use, required profile and parameters,
                  supplier configuration and supporting evidence in your production tools before
                  selecting a replacement or deadline. Matching this label does not perform those
                  checks.
                </p>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}

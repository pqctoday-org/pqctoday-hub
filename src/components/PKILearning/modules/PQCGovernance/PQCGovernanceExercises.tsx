// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PQCGovernanceExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
}

const EXERCISES = [
  {
    id: 'governance-model',
    title: 'Centralized vs Federated Governance',
    badge: 'Governance Model',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    scenario:
      'Your organization has 12 business units across 4 countries. The CISO wants a single PQC policy, but regional teams argue that local compliance requirements (ANSSI in France, BSI in Germany, NIST in the US) demand autonomy. Two business units have already started independent PQC pilots.',
    hint: 'Use the RACI Matrix Builder (Step 1) to map decision rights. Model a hybrid governance structure where the CISO owns algorithm standards but regional leads own implementation timelines.',
    step: 0,
    stepLabel: 'Step 1',
    decisionRubric: [
      'Ensure every row in the RACI Matrix has exactly one Accountable (A) role so cross-regional pilots cannot drift into conflicting algorithm choices.',
      'Separate centralized policy ownership (approved algorithm baselines, exception criteria, charter authority) from federated execution (regional deployment schedules and local certification mapping).',
      'Distinguish binding jurisdiction-specific mandates (e.g., ANSSI certification rules, NSS CNSA 2.0, federal civilian EO 14412/OMB M-26-15) from advisory guidance (EU PQC Roadmap v1.1) and general cyber risk duties (DORA/NIS2).',
      'Define how the two existing pilots will be brought under the central CBOM and SteerCo review cadence without stalling momentum.',
    ],
  },
  {
    id: 'policy-exception',
    title: 'Policy Exception Handling',
    badge: 'Exception Process',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    scenario:
      'Your newly-published PQC policy mandates ML-KEM-768 for all key exchange by Q4 2027. However, your largest revenue-generating application depends on a vendor library that only supports ECDH. The vendor promises PQC support "in the next major release" but won\'t commit to a date. The compliance deadline is 14 months away.',
    hint: 'Use the Policy Generator (Step 2) to draft an exception clause. Then use the Escalation Framework (Step 4) Exception Request Builder to score this request and identify which approval tier it requires.',
    step: 1,
    stepLabel: 'Step 2',
    decisionRubric: [
      'Separate the business service (revenue-generating application) from the protected assets (long-lived secrets or sessions carried over ECDH) when evaluating HNDL urgency.',
      'Require a time-bound expiry date, contractual vendor commitment/SLA, and verifiable compensating controls (e.g., hybrid gateway wrapper or network isolation) rather than an open-ended waiver.',
      'Note that accelerated key rotation does not protect ciphertext already recorded under a quantum-vulnerable key exchange; pair it with boundary or migration controls.',
      'Confirm that the approver matches the risk tier (CISO or Executive Steering Committee if a binding regulatory deadline is at risk) and track the exception in your production GRC tool.',
    ],
  },
  {
    id: 'kpi-reporting',
    title: 'Board-Level KPI Reporting',
    badge: 'Board Reporting',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    scenario:
      'The board has asked for a quarterly PQC migration status update. Your migration program spans 200+ systems, 15 vendor dependencies, and 3 compliance frameworks. The board meeting is 45 minutes and PQC gets a 10-minute slot. The CFO wants cost metrics, the CRO wants risk reduction, and the CTO wants technical progress.',
    hint: 'Use the KPI Dashboard Builder (Step 3) to design a single-page board view. Select 4-6 metrics that span cost, risk, and technical progress. Consider the HNDL exposure clock as a unifying risk metric.',
    step: 2,
    stepLabel: 'Step 3',
    decisionRubric: [
      'Pair governance health KPIs (policy coverage, open time-bound exceptions, vendor contractual readiness) with delivery KPIs (CBOM coverage, systems migrated, budget variance).',
      'Distinguish catalogue reference figures from verified internal production inventory so the board sees real exposure rather than placeholder scores.',
      'Surface explicit board decisions needed in the 10-minute slot (e.g., Tier-4 escalations, risk-appetite adjustments, or next phase-gate funding release).',
      'Confirm that production reporting pulls from auditable sources (CBOM scanner, GRC exception register, ERP budget tracker) with change history.',
    ],
  },
  {
    id: 'escalation-scenario',
    title: 'Escalation Scenario: Critical Vendor Miss',
    badge: 'Escalation',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    scenario:
      'Six months before your CNSA 2.0 milestone deadline (equipment that cannot support CNSA 2.0 phased out by 31 December 2030, exceptions possible), your HSM vendor announces that ML-KEM support will be delayed by 12 months due to a supply chain issue. Your entire key management infrastructure depends on this vendor. Three regulated product lines face potential non-compliance. The program manager has already tried and failed to negotiate an interim solution.',
    hint: 'Use the Escalation Framework (Step 4) to determine which tier owns this decision. Score the situation using the Exception Request Builder — set Vendor Dependency and Compliance Window to "Yes" and identify appropriate compensating controls.',
    step: 3,
    stepLabel: 'Step 4',
    decisionRubric: [
      'Verify whether the affected systems are in scope as National Security Systems under CNSA 2.0 FAQ v2.2 (where formal exception channels exist) before asserting non-compliance.',
      'Escalate beyond Tier 2 (Program Manager) to Tier 3 (CISO) and Tier 4 (Executive Steering Committee), because a program-wide binding deadline and three regulated product lines are at risk.',
      'Pair the escalation with concrete options for leadership: formal NSS exception filing, alternate FIPS 140-3 PQC-capable HSM procurement, or application-boundary hybrid wrapping.',
      'Document residual risk, executive sign-off, and vendor accountability clauses in your production GRC and procurement systems.',
    ],
  },
]

export const PQCGovernanceExercises: React.FC<PQCGovernanceExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  const [openRubrics, setOpenRubrics] = useState<Record<string, boolean>>({})

  const toggleRubric = (id: string) => {
    setOpenRubrics((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Governance Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these fictional enterprise governance scenarios. Each exercise links directly
          to the matching workshop step &mdash; use the Decision Checklist to test your reasoning
          against executive governance expectations.
        </p>
      </div>

      <div className="space-y-4">
        {EXERCISES.map((exercise) => {
          const isOpen = Boolean(openRubrics[exercise.id])
          return (
            <div key={exercise.id} className="glass-panel p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground">{exercise.title}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${exercise.badgeColor}`}
                    >
                      {exercise.badge}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mb-2">{exercise.scenario}</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>How to approach:</strong> {exercise.hint}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRubric(exercise.id)}
                    aria-expanded={isOpen}
                    className="text-xs gap-1"
                  >
                    Decision Checklist
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={() => onNavigateToWorkshop(exercise.step)}
                    className="px-4 py-2 font-bold rounded-lg transition-colors text-sm shrink-0"
                  >
                    Open {exercise.stepLabel} →
                  </Button>
                </div>
              </div>
              {isOpen && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                  <div className="text-xs font-semibold text-foreground">
                    Executive Decision Checklist
                  </div>
                  <ul className="space-y-1.5">
                    {exercise.decisionRubric.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                        <CheckCircle2
                          size={14}
                          className="text-primary shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

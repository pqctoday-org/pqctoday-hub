// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
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
  },
  {
    id: 'escalation-scenario',
    title: 'Escalation Scenario: Critical Vendor Miss',
    badge: 'Escalation',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    scenario:
      'Six months before your CNSA 2.0 compliance deadline, your HSM vendor announces that ML-KEM support will be delayed by 12 months due to a supply chain issue. Your entire key management infrastructure depends on this vendor. Three regulated product lines face potential non-compliance. The program manager has already tried and failed to negotiate an interim solution.',
    hint: 'Use the Escalation Framework (Step 4) to determine which tier owns this decision. Score the situation using the Exception Request Builder — set Vendor Dependency and Compliance Window to "Yes" and identify appropriate compensating controls.',
    step: 3,
  },
]

export const PQCGovernanceExercises: React.FC<PQCGovernanceExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Governance Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these real-world governance scenarios. Each exercise presents a situation
          you&apos;re likely to encounter when establishing PQC governance in an enterprise. Click
          &quot;Go to Workshop&quot; to begin with the suggested tool.
        </p>
      </div>

      <div className="space-y-4">
        {EXERCISES.map((exercise) => (
          <div key={exercise.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
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
              <Button
                variant="gradient"
                onClick={() => onNavigateToWorkshop(exercise.step)}
                className="px-4 py-2 font-bold rounded-lg transition-colors text-sm shrink-0"
              >
                Go to Workshop
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface ComplianceStrategyExercisesProps {
  onNavigateToWorkshop: () => void
}

const EXERCISES = [
  {
    id: 'ex-1',
    title: 'Scenario: Multi-Jurisdiction Financial Institution',
    prompt:
      'Your bank operates in the US, EU, and Singapore. CNSA 2.0 requires PQC for NSS by 2030, ETSI has hybrid recommendations, and MAS (Singapore) is monitoring NIST standards. Map the overlapping requirements and identify the earliest binding deadline. What compliance conflicts exist between jurisdictions?',
    workshopHint:
      'Use the Jurisdiction Mapper (Step 1) to select US, EU, and Singapore. Compare the framework requirements side-by-side in the Regulatory Gap Assessment (Step 4).',
  },
  {
    id: 'ex-2',
    title: 'Scenario: Government Contractor Audit',
    prompt:
      'Your company supplies software to the US DoD and must comply with CMMC Level 3 and CNSA 2.0. An audit is scheduled for Q3 2027. Build an audit readiness checklist covering cryptographic inventory, policy documentation, and technical controls. Identify the top 5 gaps most auditors flag.',
    workshopHint:
      'Use the Audit Readiness Checklist (Step 2) to work through the control domains. The Regulatory Gap Assessment (Step 4) with US selected will highlight CNSA 2.0 common gaps.',
  },
  {
    id: 'ex-3',
    title: 'Scenario: Healthcare PQC Compliance Timeline',
    prompt:
      'A hospital network must protect patient records (30-year retention) while complying with HIPAA and the upcoming NIST deprecation of RSA/ECC by 2030. Build a compliance timeline that includes assessment, hybrid deployment, and full PQC migration phases. Where does the HNDL risk window overlap with compliance deadlines?',
    workshopHint:
      'Use the Compliance Timeline Builder (Step 3) to overlay NIST and HIPAA deadlines with migration phases. Factor in the 2035 NIST disallowance date against 30-year data retention.',
  },
  {
    id: 'ex-4',
    title: 'Scenario: Cross-Border Data Center Operator',
    prompt:
      'You operate data centers in Germany, France, and the UK. GDPR obligations apply alongside BSI TR-02102 and ANSSI hybrid PQC recommendations. Germany requires BSI-certified modules for classified workloads; France recommends hybrid schemes only. Identify where requirements align and where they conflict. What is your unified migration strategy?',
    workshopHint:
      'Use the Regulatory Gap Assessment (Step 4) with Germany, France, and UK selected. Note that BSI mandates hybrid ML-KEM + X25519 while ANSSI currently recommends hybrids pending further analysis — these are compatible approaches.',
  },
]

export const ComplianceStrategyExercises: React.FC<ComplianceStrategyExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Compliance Strategy Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these real-world compliance scenarios. Use the
          Workshop tab tools to model your answers.
        </p>
        <div className="space-y-4">
          {EXERCISES.map((exercise, idx) => (
            <div key={exercise.id} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                <span className="text-primary mr-2">{idx + 1}.</span>
                {exercise.title}
              </h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground italic">{exercise.workshopHint}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="gradient" onClick={onNavigateToWorkshop} className="px-6 py-2">
            Open Workshop &rarr;
          </Button>
        </div>
      </div>
    </div>
  )
}

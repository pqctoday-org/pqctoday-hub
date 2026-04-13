// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface PQCRiskManagementExercisesProps {
  onNavigateToWorkshop: () => void
}

const EXERCISES = [
  {
    title: 'Scenario: Financial Services HNDL',
    prompt:
      'Your bank stores wire transfer records encrypted with RSA-2048. Records must be retained for 7 years. A CRQC is estimated to arrive in 2034. Calculate the HNDL exposure window and recommend a migration timeline.',
    workshopStep: 0,
    workshopStepLabel: 'Step 1 — CRQC Scenario Planner',
  },
  {
    title: 'Scenario: Healthcare Data at Risk',
    prompt:
      'A hospital system uses ECDSA P-256 for signing electronic health records that must remain valid for 30 years. Identify the risk category, estimate a risk score (1–25), and propose a mitigation strategy.',
    workshopStep: 1,
    workshopStepLabel: 'Step 2 — Risk Register Builder',
  },
  {
    title: 'Scenario: Government Compliance Deadline',
    prompt:
      'Your agency must comply with CNSA 2.0 by 2030. You have 200+ systems using RSA-3072 and AES-128. Build a prioritized risk register with at least 4 entries covering different asset types and threat vectors.',
    workshopStep: 1,
    workshopStepLabel: 'Step 2 — Risk Register Builder',
  },
  {
    title: 'Scenario: Compliance Gap Analysis',
    prompt:
      'Using your completed risk register, run the Compliance Gap Analysis (Step 4). Set the CRQC year to 2032 and identify which assets would miss the NIST 2030 deprecation deadline. List the assets with the highest compliance gap risk and their recommended PQC replacements.',
    workshopStep: 3,
    workshopStepLabel: 'Step 4 — Compliance Gap Analysis',
  },
]

export const PQCRiskManagementExercises: React.FC<PQCRiskManagementExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Risk Management Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these real-world scenarios. Use the Workshop tab
          tools to model your answers.
        </p>
        <div className="space-y-4">
          {EXERCISES.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="bg-muted/50 rounded-lg p-3 border border-border flex-1">
                  <p className="text-xs text-muted-foreground italic">
                    Use the{' '}
                    <strong className="text-foreground">{exercise.workshopStepLabel}</strong> in the
                    Workshop tab to model your response.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={onNavigateToWorkshop}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  Open Workshop →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface MigrationProgramExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
}

const EXERCISES = [
  {
    id: 'ex-1',
    title: 'Scenario: Financial Institution Migration',
    primaryStep: 0,
    primaryStepLabel: 'Open Step 1: Roadmap Builder',
    prompt:
      'Your bank has 500+ applications using RSA-2048 and needs a risk-based PQC migration roadmap. NIST IR 8547 (final, October 2026) says quantum-vulnerable public-key algorithms are deprecated after 2030 and disallowed under NIST standards and guidelines after 2035; these are NIST transition dates, not automatically bank-specific legal deadlines. Map any requirements from your financial regulators separately. The CISO wants a 3-year roadmap. Build phased milestones, identify the top 5 stakeholders and their concerns, and define 4 KPIs. CNSA 2.0 applies to national security systems, not commercial banks.',
    workshopHint:
      'Use the Roadmap Builder (Step 1) to plan against the NIST IR 8547 transition windows: deprecation after 2030 and disallowance after 2035 under NIST standards and guidelines. Treat these as planning references for this commercial bank, then map any applicable sector rules separately. Map stakeholders in the Stakeholder Comms Planner (Step 2), define weighted KPIs in the KPI Tracker (Step 3), and review the Deployment Playbook (Step 4) for execution checklists.',
  },
  {
    id: 'ex-2',
    title: 'Scenario: Healthcare Provider PQC Rollout',
    primaryStep: 1,
    primaryStepLabel: 'Open Step 2: Stakeholder Comms',
    prompt:
      'A large hospital network needs to migrate electronic health record encryption to PQC algorithms while maintaining HIPAA compliance. Patient data must remain accessible throughout the transition. Design a communication plan that addresses concerns from clinical staff, IT teams, compliance officers, and third-party EHR vendors.',
    workshopHint:
      'Focus on the Stakeholder Comms Planner (Step 2) to build audience-specific messaging for each of the four groups. Use the Roadmap Builder (Step 1) to define a parallel-track migration that keeps EHR systems online. Reference the Deployment Playbook (Step 4) for rollback gates.',
  },
  {
    id: 'ex-3',
    title: 'Scenario: Government Agency Mandate',
    primaryStep: 2,
    primaryStepLabel: 'Open Step 3: KPI Tracker',
    prompt:
      'Your civilian federal agency must submit an annual prioritized inventory of quantum-vulnerable systems to ONCD and CISA under M-23-02, unless superseding guidance changes that cadence. It must also prepare and submit its PQC Migration Plan under OMB M-26-15. You have 200 systems across 15 departments with varying levels of crypto maturity. Create a KPI dashboard that tracks inventory quality and migration progress at department and agency levels, and define escalation criteria for departments falling behind schedule. National security systems are outside these OMB memo requirements.',
    workshopHint:
      'Use the KPI Tracker (Step 3) to model the 6 weighted dimensions at agency level. Add department-level milestones in the Roadmap Builder (Step 1). Escalation thresholds and gate criteria are covered in the Deployment Playbook (Step 4).',
  },
  {
    id: 'ex-4',
    title: 'Scenario: Supply Chain Migration Coordination',
    primaryStep: 1,
    primaryStepLabel: 'Open Step 2: Stakeholder Comms',
    prompt:
      'Your manufacturing firm depends on 80+ third-party software vendors for industrial control systems. Many have not published PQC roadmaps. You need a program management approach that tracks vendor readiness, sets contractual PQC milestones, and handles the risk of vendors who miss deadlines. Design the stakeholder communication and KPI strategy.',
    workshopHint:
      'Start with the Stakeholder Comms Planner (Step 2) to build a vendor communication cadence and escalation criteria. Use the KPI Tracker (Step 3) to weight vendor readiness assessment. The Deployment Playbook (Step 4) includes contingency runbooks for vendor substitution scenarios.',
  },
]

export const MigrationProgramExercises: React.FC<MigrationProgramExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Migration Program Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these real-world scenarios. Use the Workshop tab
          tools to model your answers.
        </p>
        <div className="space-y-4">
          {EXERCISES.map((exercise, idx) => (
            <div key={exercise.id} className="glass-panel p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">
                  <span className="text-primary mr-2">{idx + 1}.</span>
                  {exercise.title}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToWorkshop(exercise.primaryStep)}
                  className="shrink-0"
                >
                  {exercise.primaryStepLabel} &rarr;
                </Button>
              </div>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground italic">{exercise.workshopHint}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="gradient" onClick={() => onNavigateToWorkshop()} className="px-6 py-2">
            Open Workshop &rarr;
          </Button>
        </div>
      </div>
    </div>
  )
}

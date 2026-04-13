// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface MigrationProgramExercisesProps {
  onNavigateToWorkshop: () => void
}

const EXERCISES = [
  {
    id: 'ex-1',
    title: 'Scenario: Financial Institution Migration',
    prompt:
      'Your bank has 500+ applications using RSA-2048 and must comply with CNSA 2.0 by 2030. The CISO wants a 3-year migration roadmap. Build a phased roadmap with milestones, identify the top 5 stakeholders and their concerns, and define 4 KPIs to track progress. Consider regulatory deadlines from NIST, NSA, and your primary regulator.',
    workshopHint:
      'Use the Roadmap Builder (Step 1) to lay out phases against the CNSA 2.0 2030 deadline. Map stakeholders in the Stakeholder Comms Planner (Step 2). Define weighted KPIs in the KPI Tracker (Step 3). Review the Deployment Playbook (Step 4) for execution checklists.',
  },
  {
    id: 'ex-2',
    title: 'Scenario: Healthcare Provider PQC Rollout',
    prompt:
      'A large hospital network needs to migrate electronic health record encryption to PQC algorithms while maintaining HIPAA compliance. Patient data must remain accessible throughout the transition. Design a communication plan that addresses concerns from clinical staff, IT teams, compliance officers, and third-party EHR vendors.',
    workshopHint:
      'Focus on the Stakeholder Comms Planner (Step 2) to build audience-specific messaging for each of the four groups. Use the Roadmap Builder (Step 1) to define a parallel-track migration that keeps EHR systems online. Reference the Deployment Playbook (Step 4) for rollback gates.',
  },
  {
    id: 'ex-3',
    title: 'Scenario: Government Agency Mandate',
    prompt:
      'Your federal agency must report PQC migration progress quarterly to OMB under M-23-02. You have 200 systems across 15 departments with varying levels of crypto maturity. Create a KPI dashboard that tracks progress at both the department and agency level, and define escalation criteria for departments falling behind schedule.',
    workshopHint:
      'Use the KPI Tracker (Step 3) to model the 6 weighted dimensions at agency level. Add department-level milestones in the Roadmap Builder (Step 1). Escalation thresholds and gate criteria are covered in the Deployment Playbook (Step 4).',
  },
  {
    id: 'ex-4',
    title: 'Scenario: Supply Chain Migration Coordination',
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

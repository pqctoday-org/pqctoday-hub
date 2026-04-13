// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface PQCBusinessCaseExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
}

const EXERCISES = [
  {
    id: 'cost-justification',
    title: 'Cost Justification for CFO',
    badge: 'Financial',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    scenario:
      'Your CFO asks why the organization should invest $2M in PQC migration when "quantum computers are years away." Prepare a cost justification using breach cost data and compliance deadlines.',
    hint: 'Use the ROI Calculator (Step 1) to model the total cost of inaction vs. proactive migration. Consider HNDL risk for data already being harvested today.',
    step: 0,
  },
  {
    id: 'regulatory-urgency',
    title: 'Regulatory Deadline Pressure',
    badge: 'Compliance',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    scenario:
      'Your organization operates in a regulated industry (finance or healthcare) and your country has announced mandatory PQC deadlines. Build a case showing the cost of non-compliance vs. early adoption.',
    hint: 'Use the Breach Scenario Simulator (Step 2) to model quantum-amplified breach costs including regulatory fines. Compare with the migration investment required.',
    step: 1,
  },
  {
    id: 'board-presentation',
    title: 'Board Presentation Package',
    badge: 'Executive',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    scenario:
      'You have 10 minutes at the next board meeting to secure PQC migration funding. Create a complete executive brief that covers risk, cost-benefit, timeline, and recommended actions.',
    hint: 'Complete all three workshop steps, then use the Board Pitch Builder (Step 3) to generate a polished board memo. Export it as a document you could present.',
    step: 2,
  },
  {
    id: 'delay-analysis',
    title: 'Quantifying the Cost of Delay',
    badge: 'Risk',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    scenario:
      'A business unit leader proposes deferring PQC migration by 2 years to align with a major platform refresh. You need to show the board exactly how much this delay costs — in accumulated breach risk, migration complexity premiums, and regulatory fines — compared to migrating now.',
    hint: 'Use the Cost of Inaction Analyzer (Step 4). Select your industry, set delay to 2 years, and read off the cumulative cost delta. Use the 5-year comparison table to build your argument.',
    step: 3,
  },
]

export const PQCBusinessCaseExercises: React.FC<PQCBusinessCaseExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Business Case Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to practice building PQC investment cases. Each exercise
          guides you through the workshop tools &mdash; click &quot;Go to Workshop&quot; to begin.
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

// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface SkillsTeamStructureExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
}

const EXERCISES = [
  {
    id: 'size-the-team',
    title: 'Size a Bank vs. a Manufacturer',
    badge: 'Team Sizing',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    scenario:
      'You advise two firms. Firm A is a 50,000-employee bank with 2,000 TLS endpoints, 15 HSMs, and 200 vendor relationships. Firm B is a 200,000-employee manufacturer with 500 TLS endpoints concentrated in one ERP platform. Leadership at both assumes headcount should drive team size, and the manufacturer expects the bigger team.',
    hint: 'Use the Team Sizing Calculator (Step 1). Enter each estate size at the first-two-years ratio (1 FTE / 500 instances). Show that the bank — despite fewer employees — needs the larger program team because sizing follows the cryptographic estate, not headcount.',
    step: 0,
  },
  {
    id: 'small-estate',
    title: 'Right-Sizing a Sub-1,000 Estate',
    badge: 'Lean Team',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    scenario:
      'A mid-market company has roughly 600 cryptographic instances in its CBOM and no OT systems. The CFO will not approve a dedicated program office and wants to know the minimum viable team that still keeps the program credible to auditors.',
    hint: 'Use the Team Sizing Calculator (Step 1) with 600 instances and OT off. Note the "small estate" band: a part-time QRPM with consulting augmentation for the Cryptographic Architect is viable, while QRPM, Architect, and PMO Analyst remain the irreducible dedicated core.',
    step: 0,
  },
  {
    id: 'build-borrow-buy',
    title: 'Sourcing the Capability Stack',
    badge: 'Build / Borrow / Buy',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    scenario:
      'Your CISO wants to outsource the entire migration to a single consultancy for speed. You believe some capabilities must be built internally for lasting value, while others are genuinely scarce and should be borrowed. You have 20 minutes in the next leadership meeting to defend a sourcing model per capability.',
    hint: 'Review the Build/Borrow/Buy guidance in the Learn tab. Argue Build for program management, PKI modernization, and vendor governance (institutional value and outage risk); Buy the discovery tooling but run it internally; and Borrow strategic quantum CTI, which is specialized and scarce.',
    step: 0,
  },
  {
    id: 'champion-rollout',
    title: 'Stand Up a Crypto Champion Network',
    badge: 'Crypto Champions',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    scenario:
      "Your program has six platform teams (web, mobile, data, infrastructure, OT, identity) but only a four-person core team. Every new system design review is becoming a bottleneck because the Cryptographic Architect must personally approve crypto readiness. You need to scale the program's reach without hiring six more cryptographers.",
    hint: 'Use the Crypto Champion Builder (Step 2). Assign one named champion per platform and track the four commitments (foundations training, quarterly briefings, design-review sign-off, library-upgrade shepherding). Flag any unstaffed platform as a program risk before the next review cycle.',
    step: 1,
  },
]

export const SkillsTeamStructureExercises: React.FC<SkillsTeamStructureExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Team-Building Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these staffing scenarios. Each one mirrors a decision you face when standing
          up a PQC migration team &mdash; sizing, sourcing, and scaling. Click &quot;Go to
          Workshop&quot; to begin with the suggested tool.
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

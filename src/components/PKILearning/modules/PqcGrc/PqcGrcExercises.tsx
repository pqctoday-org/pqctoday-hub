// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface PqcGrcExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
}

const EXERCISES = [
  {
    id: 'board-buffer-red',
    title: 'The Compliance Buffer Goes Red',
    badge: 'Board KRI',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    scenario:
      'Two quarters before a CNSA 2.0 milestone, the Regulatory Compliance Buffer KRI drops below 6 months for your firmware-signing estate. Under the framework this is no longer amber — it is red, the threshold at which the board, not just the Steering Committee, must intervene. The CISO wants to keep it at SteerCo level to avoid alarming directors.',
    hint: 'Use the KRI Cascade Builder (Step 1). Confirm Regulatory Compliance Buffer sits at the board level and set its status to breach — the builder will flag that a red board KRI trips the board-intervention threshold, which is exactly the governance instrument the CISO is trying to bypass.',
    step: 0,
  },
  {
    id: 'cascade-design',
    title: 'Designing the Three-Level Cascade',
    badge: 'KRI Cascade',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    scenario:
      'A new program lead proposes a single 25-metric dashboard reviewed monthly by everyone. Directors find it unreadable, the SOC finds it too slow, and operational drift goes unnoticed for weeks. You must restructure the indicators so each audience sees the right metrics at the right cadence.',
    hint: 'Use the KRI Cascade Builder (Step 1) to place each indicator at board (quarterly), CISO (monthly), or operational (weekly / real-time) level. Watch the validation: every level must carry at least one KRI, or an audience is flying blind at its cadence.',
    step: 0,
  },
  {
    id: 'suppression-vs-escalate',
    title: 'Suppression List vs. Escalation',
    badge: 'GRC-SOC Handoff',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    scenario:
      'The SOC reports that cryptographic-drift alerts are 95% noise — all from legacy systems that GRC has formally deferred. The instinct is to suppress every deferred system. But one deferral is a 9-month-old IoT exception with no remediation plan, and another protects 25-year-retention HNDL-relevant archives.',
    hint: 'Use the Exception Register Triage (Step 2). Suppress only entries that are ≤ 6 months old and carry a remediation plan; everything stale or plan-less escalates instead of silencing the SOC. Note how the HNDL-relevant archive raises the cost of a wrong suppression.',
    step: 1,
  },
  {
    id: 'tabletop-gap',
    title: 'Stated Appetite vs. Actual Behavior',
    badge: 'Tabletop Exercise',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    scenario:
      'In an Ambiguous Cryptanalysis Paper tabletop, the risk-appetite statement says "zero tolerance for algorithm compromise," but the Steering Committee\'s actual behavior is "wait for peer review." The exercise has exposed a gap between stated appetite and operational practice — the most valuable finding GRC can surface.',
    hint: 'Revisit Risk Appetite & Regulatory Horizon in the Learn tab, then use the KRI Cascade Builder to define which indicator would have forced the decision earlier (e.g., a TTR-PQC or Material Developments Flag), so the next exercise tests a closed gap rather than an open one.',
    step: 0,
  },
]

export const PqcGrcExercises: React.FC<PqcGrcExercisesProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">GRC Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these governance scenarios drawn from the GRC function&apos;s real decisions
          — KRI thresholds, the GRC-SOC handoff, and the gap between stated risk appetite and
          operational behavior. Click &quot;Go to Workshop&quot; to begin with the suggested tool.
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

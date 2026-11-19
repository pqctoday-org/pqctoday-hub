// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
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
    hint: 'Use the ROI Calculator (Step 2) to model migration cost vs. conditional risk reduction. Separate gross program spend from net incremental spend, and document which data classes face HNDL exposure.',
    step: 1,
    stepLabel: 'Step 2',
    decisionRubric: [
      'Separate gross modernization spend (PKI automation, HSM refresh, FIPS 140-3 upgrades) from net incremental PQC spend so the CFO sees what is already funded.',
      'Explain that avoided-loss estimates are conditional risk-reduction scenarios — not guaranteed cash savings — and state the source and sensitivity of every assumption.',
      'Name both time-bound risks: HNDL for long-lived secrets carried over quantum-vulnerable key establishment, and TNFL for long-lived trust anchors and code/firmware signing.',
      'Replace catalogue product counts with your own production inventory and vendor quotes before requesting capital commitment.',
    ],
  },
  {
    id: 'regulatory-urgency',
    title: 'Regulatory Deadline Pressure',
    badge: 'Compliance',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    scenario:
      'Your organization operates in a regulated sector (finance or healthcare) with supervisory expectations for cryptographic risk management and upcoming national PQC roadmaps. Build a case showing the cost of delayed compliance readiness vs. phased early adoption.',
    hint: 'Use the Breach Scenario Simulator (Step 3) to model conditional quantum-amplified breach exposure and verify which obligations actually bind your scope (e.g., DORA/NIS2/HIPAA/GDPR risk-management duties vs. advisory roadmaps such as EU PQC Roadmap v1.1 or NSS-only CNSA 2.0).',
    step: 2,
    stepLabel: 'Step 3',
    decisionRubric: [
      'Confirm legal scope first: do not cite NSS-only CNSA 2.0 or federal-civilian EO 14412/OMB M-26-15 dates as binding on a private-sector bank or hospital unless contractually flowed down.',
      'Distinguish fixed PQC cutoff dates from general cyber risk-management and data-protection duties (DORA, NIS2, HIPAA, GDPR) and advisory roadmaps (EU PQC Roadmap v1.1).',
      'Include only organization-verified legal/regulatory consequence assumptions in the financial model rather than inventing automatic fine totals.',
      'Identify the production-tool evidence needed to support supervisory review (CBOM, vendor PQC attestations, FIPS 140-3 module status).',
    ],
  },
  {
    id: 'delay-analysis',
    title: 'Quantifying the Cost of Delay',
    badge: 'Risk',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    scenario:
      'A business unit leader proposes deferring PQC migration by 2 years to align with a major platform refresh. Compare the scenarios, identify the largest driver and show which assumptions must be validated before the result can support a board decision.',
    hint: 'Use the Cost of Inaction Analyzer (Step 4). Select your industry, compare start now with a 2-year delay, and read the incremental NPV. Use the 10-year comparison table and assumption panel to explain what drives the result.',
    step: 3,
    stepLabel: 'Step 4',
    decisionRubric: [
      'Compare start-now and 2-year-delay scenarios over the exact same 10-year horizon and discount rate, noting whether delay raises or lowers discounted cost under your assumptions.',
      'Test sensitivity across slow, consensus, and fast CRQC survey bands (GRI 2025) rather than relying on a single point estimate.',
      'Separate the business services being refreshed from the protected assets (long-lived secrets or trust anchors) whose exposure clock does not pause during a deferral.',
      'State which assumptions (delay premium, migration duration, data shelf life, verified regulatory consequences) Finance and Legal must validate before approving a deferral.',
    ],
  },
  {
    id: 'board-presentation',
    title: 'Board Presentation Package',
    badge: 'Executive',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    scenario:
      'You have 10 minutes at the next board meeting to secure PQC migration funding. Create a complete executive brief that covers risk, cost-benefit, timeline, and recommended actions.',
    hint: 'Work through the earlier steps, then use the Board Pitch Builder (Step 5) to generate a polished board memo. Export it as a document you could present.',
    step: 4,
    stepLabel: 'Step 5',
    decisionRubric: [
      'Leave programme budgets explicitly scoped to reviewed internal cost estimates and gate-linked tranches rather than unverified catalogue defaults.',
      'Structure the ask around clear board decisions: charter approval, Phase 1 discovery/inventory funding, and risk-appetite sign-off.',
      'Present uncertainty honestly (cost-model spread, CRQC scenario bands, vendor roadmap dependencies) so the board can challenge assumptions constructively.',
      'Align signatories, governance cadence, and fiduciary framing to your organization’s actual delegations and legal counsel review.',
    ],
  },
]

export const PQCBusinessCaseExercises: React.FC<PQCBusinessCaseExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  const [openRubrics, setOpenRubrics] = useState<Record<string, boolean>>({})

  const toggleRubric = (id: string) => {
    setOpenRubrics((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Business Case Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these fictional scenarios to practice building PQC investment cases. Each
          exercise guides you to the matching workshop step &mdash; use the Decision Checklist to
          verify your reasoning before presenting to leadership.
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

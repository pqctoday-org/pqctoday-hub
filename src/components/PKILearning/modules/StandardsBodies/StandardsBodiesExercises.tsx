// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface StandardsBodiesExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
}

const EXERCISES = [
  {
    id: 'multinational-vendor',
    title: 'Multinational Vendor PQC Certification Strategy',
    badge: 'Certification',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    scenario:
      "Your HSM vendor sells products to US federal agencies, EU government entities, and a Korean telecom. For each market: (1) US: Which certification program must your FIPS 203/204/205 implementation pass? Which body administers it, and which body wrote the underlying standard? (2) EU: If the customer requires CC-based certification, which EU scheme applies? Which body issues EUCC certificates, and which body maintains the Agreed Cryptographic Mechanisms (ACM) list? (3) Korea: Which national PQC competition produced Korea's approved algorithms? Which government agency ran the competition, and which algorithms were selected?",
    hint: 'Use the Organization Explorer (Step 2) to research each body, and the Coverage Grid (Step 4) to map which certification bodies operate in each region.',
    step: 1,
  },
  {
    id: 'ietf-vs-nist',
    title: 'IETF vs NIST — Protocol Integration Decision',
    badge: 'Protocol',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    scenario:
      'Your engineering team is adding PQC to a TLS 1.3 implementation. They ask: "Should we follow the NIST standard or the IETF standard?" Help them understand the relationship: (1) Which organization published the ML-KEM algorithm (FIPS 203)? What type of body is it? (2) Which IETF working group handles PQC integration into TLS? What RFC did they produce? (3) Are these in conflict, or complementary? How do NIST algorithm standards feed into IETF protocol standards?',
    hint: 'Use the Standards→Cert→Compliance Chain (Step 3, Scenario 4) and the Organization Explorer (Step 2) to compare NIST vs IETF decision-making processes.',
    step: 2,
  },
  {
    id: 'compliance-authorship',
    title: 'Compliance Framework Authorship Audit',
    badge: 'Compliance',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    scenario:
      'Your legal team is preparing a PQC compliance brief and lists the following mandates. For each, identify: (a) which organization authored it, (b) whether that organization is governmental or non-governmental, (c) whether compliance is mandatory or advisory, and (d) what underlying technical standards it references:\n\n• FIPS 140-3\n• CNSA 2.0\n• ETSI TS 103 744\n• NIS2 Directive\n• ANSSI PQC Position Paper',
    hint: 'Use the Body Classifier (Step 1) to verify your classifications, and the Organization Explorer (Step 2) to find the decision-making process and PQC outputs for each authoring organization.',
    step: 0,
  },
]

export const StandardsBodiesExercises: React.FC<StandardsBodiesExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Standards Bodies — Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Apply what you learned in the workshop to these real-world scenarios. Each exercise guides
          you through the workshop tools &mdash; click &quot;Go to Workshop&quot; to begin.
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
                <p className="text-sm text-foreground/80 mb-2 whitespace-pre-line">
                  {exercise.scenario}
                </p>
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

// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { claimText } from '../data/sourceClaims'

export interface WorkshopConfig {
  step: number
}

interface ExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: WorkshopConfig) => void
}

interface Scenario {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly badge: string
  readonly badgeColor: string
  readonly observe: string
  readonly config: WorkshopConfig
}

export const AICryptoAttacksExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'ex-secret-hunt',
      title: '1. Audit what pattern-based secret rules miss in CI and logs',
      description:
        'Open Secret Hunt (CI & Repo Hygiene) and run the sample pattern rules across the five dummy EXAMPLE_FAKE_ artifacts. Inspect the historical Git commit, crash dump, and CI workflow that evade simple prefix regexes.',
      badge: 'Keys in Software',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Only static prefix-shaped tokens trigger simple regex rules; split strings in commit history, diagnostic dumps, and custom CI variables evade naive matching—linking directly to ' +
        claimText('AI-2.5'),
      config: { step: 0 },
    },
    {
      id: 'ex-key-policy',
      title: '2. Flag wrap-export and IAM policy flaws in KMS/HSM templates',
      description:
        'Open KMS & HSM Key-Policy Review, inspect Template A (Legacy Release-Signing Key) and Template B (Cloud KMS App Role), flag the risky settings, and verify your review.',
      badge: 'KMS & HSM Policy',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Extractable wrapping policies (AI-5.1 Tookan formal model checking—not AI) and combined IAM operator/policy-admin permissions expose keys or policies even inside an HSM boundary, while AI automating API search remains hypothesised: ' +
        claimText('AI-5.4'),
      config: { step: 1 },
    },
    {
      id: 'ex-trace-learning',
      title: '3. Compare jitter and masking-order effects on synthetic trace waves',
      description:
        'Open Synthetic Trace Learning Lab. Start at Order 1 with Jitter = 0, then increase Jitter to 6 and compare the template vs shift-tolerant indicator scores; next raise Masking Order to 3.',
      badge: 'Side Channels',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'Jitter collapses fixed-window template alignment faster than shift-tolerant features, whereas higher masking orders suppress single-sample signal and demand far more traces and multivariate evaluation: ' +
        claimText('AI-4.7'),
      config: { step: 2 },
    },
    {
      id: 'ex-claim-sorter',
      title: '4. Sort 12 AI-and-crypto claims by maturity and target scope',
      description:
        'Open Claim & Rubric Sorter and classify the HAWK, 7-round AES-128, wolfSSL CVE-2026-5194, SALSA/VERDE, and KMS AI claims before opening Defence Planner to design layered controls.',
      badge: 'Rubric & Governance',
      badgeColor: 'bg-status-info/20 text-status-info border-status-info/50',
      observe:
        'Distinguishing demonstrated vs reported and full vs reduced scope reveals why FIPS 203–205 deadlines stay intact: ' +
        claimText('AI-6.4'),
      config: { step: 3 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through four evidence-grounded scenarios across keys in software, KMS/HSM policy
          review, synthetic trace sensitivity, and capability-rubric classification. Every lab uses
          Hub-authored toy data only—click &quot;Load &amp; Run&quot; to jump directly to the
          matching Workshop step.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary shrink-0" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the AI &amp; Cryptographic Threats quiz to test your understanding of the
                capability rubric, primary sources, and defensive priorities.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz?category=ai-crypto-threats')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2 shrink-0"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

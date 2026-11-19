// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface CryptoMgmtModernizationExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
}

const EXERCISES = [
  {
    id: 'cpm-vs-agility',
    title: 'Carving out CPM from crypto-agility',
    badge: 'Scope',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    scenario:
      'A vendor pitches their "crypto-agility platform" and claims it delivers full Cryptographic Posture Management. In 90 seconds, describe to your CFO the difference between the two and name three capabilities the platform must have beyond algorithm swap-ability for you to call it CPM.',
    hint: 'CPM answers "do we know what we have / is it healthy / can we prove it" across four asset classes. Agility only answers "can we change." Use the three-layer carve-out table in the Learn tab.',
    step: 0,
  },
  {
    id: '47-day-plan',
    title: 'Surviving the 47-day TLS cadence',
    badge: 'CLM',
    badgeColor: 'bg-accent/20 text-accent border-accent/50',
    scenario:
      'Your organization has 8,500 public TLS certs. In this sample estate, 62% renew via ACME and 38% via a manual ticket flow. The CA/B Forum 47-day cadence lands in March 2029. Sketch the rollout plan.',
    hint: 'Use the Inventory Lifecycle Simulator. Design KPIs: cert-expiry-risk (≤30 d), auto-renew %, cert MTTR, shadow-cert count. Treat it as a 3-year program, not a project.',
    step: 1,
  },
  {
    id: 'fips-revoke-response',
    title: 'A FIPS 140-3 cert goes historical',
    badge: 'FIPS Assurance',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    scenario:
      'The certificate covering your production Bouncy Castle FIPS module reaches its sunset date, and CMVP moves it to the Historical list. Your regulated workloads are required by policy to run inside a FIPS 140-3 validated boundary.',
    hint: "Use the Library & Hardware CBOM Builder to inventory affected deployments, then map remediation paths. The Assurance pillar's monthly FIPS monitor should have flagged this a day after CMVP posted the notice.",
    step: 2,
  },
  {
    id: 'hsm-pqc-swap',
    title: 'Azure Dedicated HSM is retiring; now what?',
    badge: 'Hardware',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    scenario:
      'Your KEK hierarchy lives inside Azure Dedicated HSM (Luna 7; Azure documents FIPS 140-2 L3 validated firmware 7.0.3, takes no new customers and supports existing ones until 31 July 2028). A major compliance audit is 6 months away and your policy requires active FIPS 140-3 L3 coverage.',
    hint: "Walk the hardware through the CBOM Builder's HSM view. Plan key export, envelope bridging, KMIP sync, pilot scope. Model cost/benefit in the No-Regret ROI Builder.",
    step: 2,
  },
  {
    id: 'board-roi',
    title: 'Board asks: "what do we get if quantum never happens?"',
    badge: 'ROI',
    badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
    scenario:
      'A skeptical board director asks for the CMM business case assuming CRQC never lands in the horizon. The CFO has allocated $2M/year but wants payback within 24 months.',
    hint: 'Use the No-Regret ROI Builder. Emphasize Scenario A. The five benefit streams should cover the ask on their own.',
    step: 3,
  },
  {
    id: 'shadow-cert-program',
    title: 'Shadow certs — where do they come from?',
    badge: 'Observability',
    badgeColor: 'bg-status-info/20 text-status-info border-status-info/50',
    scenario:
      "Passive CT-log scanning reveals 340 certs issued under your organization's domains that are not in your CLM inventory.",
    hint: 'Run them through the Inventory Lifecycle Simulator — Discover → Classify stages. Design the attribution workflow and feed remediations into KPIs.',
    step: 1,
  },
  {
    id: 'kpi-board-deck',
    title: 'Design the board slide',
    badge: 'Measurement',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    scenario:
      'You have 10 minutes on the agenda once a quarter. Pick 4–6 KPIs that fit on a single slide and answer "are we safer than last quarter?"',
    hint: 'Use the Posture KPI Dashboard Designer with audience=Board. Strong candidates: % scoped deployments using validated FIPS 140-3 modules, % certs auto-renewed, cert-expiry risk, policy-drift rate, crypto-debt trend.',
    step: 4,
  },
  {
    id: 'tool-only-cpm',
    title: 'Why "just buy the platform" fails',
    badge: 'Anti-pattern',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    scenario:
      'A vendor promises a turn-key CPM platform. Leadership asks: "If we buy it, are we done?" Give the two-sentence answer.',
    hint: "The platform supplies data; the program supplies ownership, iteration, and decision-making. The Learn tab's dual-loop section is the canonical reply.",
    step: 0,
  },
  {
    id: 'legacy-crypto-gateway',
    title: 'Crypto gateway or full migration — how do you decide?',
    badge: 'Mitigate/Migrate',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    scenario:
      'A 15-year-old PKI system issues SHA-1 certificates. The original development team is gone, the source code is partially unavailable, and the system cannot be taken offline. CSWP.39 §4.6 describes a "crypto gateway" option (a bump-in-the-wire). Walk through the decision: gateway now + sunset plan, or emergency migration?',
    hint: 'Use Step 8 (Implement — Mitigate or Migrate) to weigh agility criteria, then model the sunset date in Step 4 (No-Regret ROI Builder). A bump-in-the-wire gateway buys time when direct modification is infeasible, but it is not a permanent solution — confirm that the gateway itself is crypto-agile and pair it with a retirement date.',
    step: 7,
  },
  {
    id: 'clm-vendor-criteria',
    title: 'Evaluating CLM platform capabilities for PQC',
    badge: 'CLM Evaluation',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    scenario:
      'Your organization is issuing an RFP for a Certificate Lifecycle Management platform that must handle both 47-day public TLS renewals and future ML-DSA/hybrid certificate issuance. Define the non-negotiable technical capabilities and proof-of-concept tests.',
    hint: 'Use Step 9 (CLM Vendor Evaluator) to practice weighting fictional platform profiles on ACME/EST/CMP automation, HSM orchestration, hybrid certificate profiles, and CBOM/observability export. In production procurement, verify each vendor claim in a staging lab rather than accepting roadmap slides.',
    step: 8,
  },
]

export const CryptoMgmtModernizationExercises: React.FC<CryptoMgmtModernizationExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">CMM Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Ten scenarios that stress-test Cryptographic Posture Management thinking. Each links
          directly to the workshop step where you can model the decision.
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
                  <strong className="text-foreground">Hint:</strong> {exercise.hint}
                </p>
              </div>
              <Button
                variant="gradient"
                onClick={() => onNavigateToWorkshop(exercise.step)}
                className="whitespace-nowrap text-xs"
              >
                Open Step {exercise.step + 1}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

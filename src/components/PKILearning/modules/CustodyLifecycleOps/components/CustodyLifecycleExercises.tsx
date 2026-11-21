// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { claimText } from '../data/sourceClaims'

export interface CustodyLifecycleWorkshopConfig {
  step: number
  preset?: string
}

interface ExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: CustodyLifecycleWorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: CustodyLifecycleWorkshopConfig
}

export const CustodyLifecycleExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'w9-eip7702-and-departed-approver',
      title: '1. Revoke vs Reshare vs Sweep After Compromise & Staff Departure',
      description:
        'Open W9 (Revoke or Rotate Matrix). Classify an unauthorized EIP-7702 delegation on a hot EOA, a departed approver’s MPC seat and device, and a suspected single MPC share leak.',
      badge: 'W9 · Rotation',
      badgeColor: 'bg-primary/15 text-primary border-primary/40',
      observe:
        'See why pausing withdrawals does not clear on-chain EIP-7702 delegations and why MPC refresh requires old-epoch share erasure. ' +
        claimText('DA-16.8c'),
      config: { step: 0, preset: 'eip7702-delegation' },
    },
    {
      id: 'w14-alert-triage-stages',
      title: '2. Triage Pre-Signing vs Confirmed-Chain Custody Alerts',
      description:
        'Open W14 (Custody Alert Triage). Set severity and response (log, page, or auto-pause) for an off-hours allowlist change, a Safe ChangedGuard event, and an EIP-7702 type-4 delegation.',
      badge: 'W14 · Monitoring',
      badgeColor: 'bg-status-warning/15 text-status-warning border-status-warning/40',
      observe:
        'Compare what an automatic pause can stop at the pre-signing stage versus what remains possible once a delegation or Safe guard change is confirmed on-chain. ' +
        claimText('DA-22.3b'),
      config: { step: 3, preset: 'ev-3' },
    },
    {
      id: 'w16-poisoned-backup-dr',
      title: '3. Recover Without Restoring an Attacker Foothold',
      description:
        'Open W16 (Disaster Recovery Drill) and load Scenario C (backups taken after an attacker enrolled a rogue approver device). Compare restoring the latest snapshot vs a known-good pre-incident baseline.',
      badge: 'W16 · DR Drill',
      badgeColor: 'bg-status-success/15 text-status-success border-status-success/40',
      observe:
        'Validate configuration and authoritative inventory before restoring keys, and reconcile chain state before resuming signing. ' +
        claimText('DA-24.1'),
      config: { step: 5, preset: 'poisoned-backup' },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Scenarios</h2>
        <p className="text-muted-foreground text-sm">
          Work through three fictional custody-operations scenarios tied directly to Workshops W9,
          W14, and W16. Click &ldquo;Load &amp; Run&rdquo; to open the matching interactive decision
          drill.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                <Play size={14} fill="currentColor" aria-hidden="true" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Practice the Digital Assets quiz to test custody rotation, ceremonies, monitoring,
                access separation, disaster recovery, and decommissioning decisions.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz?category=digital-assets')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Digital Assets Quiz <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

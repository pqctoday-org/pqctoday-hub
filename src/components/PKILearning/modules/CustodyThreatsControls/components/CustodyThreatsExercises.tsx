// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { claimText } from '../data/sourceClaims'

export interface CustodyWorkshopConfig {
  step: number
  preset?: string
}

interface ExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: CustodyWorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: CustodyWorkshopConfig
}

export const CustodyThreatsExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'blind-delegatecall-swap',
      title: '1. Blind Signing vs Parse-Only vs Parse + Policy Gate',
      description:
        'Open Step 1 (Blind vs Clear Signing). Sign the benign transfer first, then inject the hidden delegatecall contract-upgrade payload with "Parse only" vs "Parse + policy check before sign".',
      badge: 'W1 · HSM',
      badgeColor: 'bg-primary/15 text-primary border-primary/40',
      observe:
        'Without in-boundary policy enforcement, CKM_ECDSA signs the delegatecall hash verbatim — parsing alone only prints a warning and refuses nothing. ' +
        claimText('DA-3.1n'),
      config: { step: 0, preset: 'delegatecall-swap' },
    },
    {
      id: 'frost-party-refusal',
      title: '2. 2-of-3 FROST Threshold Signing with Independent Party Policies',
      description:
        'Open Step 3 (Threshold Signing). Run the 3-round DKG, then test signing a transaction above Party 2’s local cap (Parties 1 & 3 approve) vs raising the amount above Party 3’s cap too.',
      badge: 'W3 · FROST',
      badgeColor: 'bg-status-warning/15 text-status-warning border-status-warning/40',
      observe:
        'A 2-of-3 quorum still succeeds when Party 2 alone refuses, but blocks when two parties refuse. Toggle "Share in host RAM" vs "Share inside HSM" to compare host-root exposure. ' +
        claimText('DA-3.10'),
      config: { step: 2, preset: 'party2-refuse' },
    },
    {
      id: 'combination-builder-treasury',
      title: '3. Design a Control Stack for Institutional Treasury Custody',
      description:
        'Open Step 4 (Control Combination Builder), select Institutional Treasury, and compare a policy-free HSM against MPC-in-HSM (mixed trust domains) + attested clear-signing approvers + timelock.',
      badge: 'W4 · Decision',
      badgeColor: 'bg-status-success/15 text-status-success border-status-success/40',
      observe:
        'See which incident patterns (Bybit UI tamper, Drift durable nonce, Binance signing-service abuse) are mitigated and which Rule G1 authority assumptions remain. ' +
        claimText('DA-3.5'),
      config: { step: 3, preset: 'treasury' },
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
          Work through these three fictional custody scenarios tied directly to Workshop Steps 1, 3,
          and 4. Click &ldquo;Load &amp; Run&rdquo; to jump straight to the matching interactive
          lab.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
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
                Practice the Digital Assets quiz to test custody threat paths, control boundaries,
                and authority assumptions.
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

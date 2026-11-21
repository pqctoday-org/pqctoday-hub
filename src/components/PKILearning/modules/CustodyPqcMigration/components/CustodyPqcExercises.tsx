// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { claimText } from '../data/sourceClaims'

export interface CustodyPqcWorkshopConfig {
  step: number
  preset?: string
}

interface ExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: CustodyPqcWorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: CustodyPqcWorkshopConfig
}

export const CustodyPqcExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'hndl-vs-forgery-mpc',
      title: '1. Pinpoint First-Break Quantum Exposure in a Cloud MPC Cluster',
      description:
        'Open Step 1 (Quantum Limits & HNDL Check), select the Cloud MPC Cluster scenario, and separate immediate harvest-now-decrypt-later channel/backup exposure from future on-chain signature forgery.',
      badge: 'W5 · Limits',
      badgeColor: 'bg-primary/15 text-primary border-primary/40',
      observe:
        'Even before a CRQC exists, recorded pairwise classical TLS traffic and RSA-OAEP share backups are harvestable today, while CMP/CGGMP21 internal Paillier messages rely on factoring. ' +
        claimText('DA-6.3a'),
      config: { step: 0, preset: 'mpc-cmp-cloud' },
    },
    {
      id: 'planner-eip7702-residual',
      title: '2. Classify 15 Custody Components & Audit EIP-7702 Residual Authority',
      description:
        'Open Step 2 (Custody Migration Planner), classify platform- vs account- vs chain-controlled components across Phases 0–4, then switch the Account Type selector to EIP-7702 Delegated EOA.',
      badge: 'W7 · Planner',
      badgeColor: 'bg-status-warning/15 text-status-warning border-status-warning/40',
      observe:
        'See why migrating transaction signatures before chain support fails validation, why leaving RSA backup wrapping in Phase 3 is flagged, and why an EIP-7702 EOA retains secp256k1 re-delegation and permit authority. ' +
        claimText('DA-15.2'),
      config: { step: 1, preset: 'eip7702-eoa' },
    },
    {
      id: 'hw-claim-four-part',
      title: '3. Separate Ideal Shamir vs SLIP-39 and Dissect Hardware Wallet Claims',
      description:
        'Run Step 3 (Shamir Seed & Envelope Demo) to test t-1 uniformity vs SLIP-39’s 4-byte digest and hybrid KEM-DEM envelopes, then open Step 4 (HW Wallet Claim Reader) to classify Trezor Safe 7 and Freedom Factory PQ1 claims.',
      badge: 'W8 & W13 · Seeds & HW',
      badgeColor: 'bg-status-success/15 text-status-success border-status-success/40',
      observe:
        'Device-integrity PQ firmware verification and ML-DSA attestation (Part 1) do not establish chain transaction signing (Part 2) or PQ approval signing. ' +
        claimText('DA-14.1'),
      config: { step: 3, preset: 'trezor-boot-attest' },
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
          Work through these three fictional custody migration scenarios tied to Workshop Steps 1,
          2, 3, and 4. Click &ldquo;Load &amp; Run&rdquo; to jump straight to the interactive lab.
          Educational exercises use sample data and do not certify or validate deployed custody
          systems.
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
                Practice the Digital Assets quiz to test custody PQC migration phases, threshold
                research status, SLIP-39 internals, hardware wallet claims, and smart-account
                residual dependencies.
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

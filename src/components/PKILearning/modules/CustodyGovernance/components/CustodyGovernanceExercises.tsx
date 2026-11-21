// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { claimText, analysisText } from '../data/sourceClaims'

export interface CustodyGovernanceWorkshopConfig {
  step: number
  preset?: string
  jurisdictions?: string[]
}

interface ExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: CustodyGovernanceWorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: CustodyGovernanceWorkshopConfig
}

export const CustodyGovernanceExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'eu-vs-hk-policy-free-hsm',
      title: '1. Audit a Policy-Free HSM Hot Wallet Across EU (MiCA/DORA) & Hong Kong (SFC)',
      description:
        'Load Preset A (Single-cluster policy-free HSM + host broker) in W11 with EU (MiCA + DORA) and Hong Kong (SFC) side by side. Inspect which controls report "no mapped control found (reviewer analysis)" and compare binding "shall" rules against SFC "should" expectations.',
      badge: 'W11 · GRC',
      badgeColor: 'bg-primary/15 text-primary border-primary/40',
      observe:
        'EU MiCA/DORA requires client segregation and full key-lifecycle rules (including key destruction) without fixing a cold-storage ratio, whereas HK SFC sets a 98% cold-storage "should" expectation. ' +
        claimText('DA-18.3'),
      config: {
        step: 0,
        preset: 'policy-free-hsm-hot',
        jurisdictions: ['eu-mica-dora', 'hk-sfc'],
      },
    },
    {
      id: 'ny-vs-sg-subcustody',
      title: '2. Compare Omnibus Sub-Custody Under New York (NYDFS) & Singapore (MAS / PSR)',
      description:
        'Load Preset D (Omnibus sub-custodian + browser multisig UI) with New York (NYDFS) and Singapore (MAS / PSR) side by side. Check the applicability gates to separate binding statutes (23 NYCRR §200.9, PSR Regs. 18B–18C & 18G) from supervisory guidance (NYDFS Sept 2025, MAS PS-G03) and inspect the separate US federal context band.',
      badge: 'W11 · Executive',
      badgeColor: 'bg-status-warning/15 text-status-warning border-status-warning/40',
      observe:
        'SEC SAB 122 and OCC Letters 1170/1184 stay in the context band rather than key-control rows; meanwhile sub-custody due diligence and statutory trust segregation surface immediately as unmapped controls. ' +
        claimText('DA-18.17'),
      config: {
        step: 0,
        preset: 'omni-subcustody',
        jurisdictions: ['ny-nydfs', 'sg-mas'],
      },
    },
    {
      id: 'dubai-vs-japan-assurance-limits',
      title:
        '3. Test an Air-Gapped Cold Vault Against Dubai (VARA), Japan (PSA) & Market-Practice Assurance',
      description:
        'Load Preset C (Air-gapped cold vault + full lifecycle) with Dubai (VARA) and Japan (PSA / Order) side by side, keeping the market-practice Insurer & Auditor columns enabled. Verify why mapping all 12 controls still requires checking VARA Company Rulebook Part VI.D, SOC 2 scope, and Proof-of-Reserves limits.',
      badge: 'W11 · Cert-Engineer',
      badgeColor: 'bg-status-success/15 text-status-success border-status-success/40',
      observe:
        'Even when every control row maps in the preset, W11 issues no compliance verdict — you must still check Rule G1 authority assumptions and assurance-report boundaries. ' +
        analysisText('DA-19.11'),
      config: {
        step: 0,
        preset: 'airgapped-cold-vault',
        jurisdictions: ['dubai-vara', 'jp-fsa'],
      },
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
          Work through these three fictional governance and assurance scenarios in Workshop W11
          (Regulation &amp; Assurance Control Mapper). Click &ldquo;Load &amp; Run&rdquo; to open
          the matching preset and jurisdiction comparison.
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
                Practice the Digital Assets quiz to test custody evaluation questions, regulatory
                applicability gates, insurance exclusions, and assurance boundaries.
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

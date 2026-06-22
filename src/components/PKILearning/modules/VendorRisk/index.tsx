// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { ClipboardCheck, ScrollText, Network, Package } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { InfrastructureSelector } from './components/InfrastructureSelector'
import { VendorScorecardBuilder } from './components/VendorScorecardBuilder'
import { ContractClauseGenerator } from './components/ContractClauseGenerator'
import { SupplyChainRiskMatrix } from './components/SupplyChainRiskMatrix'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'infrastructure-selector',
    title: 'Step 1: Your Infrastructure',
    description: 'Select the products in your infrastructure from the Migrate catalog.',
    icon: Package,
  },
  {
    id: 'vendor-scorecard',
    title: 'Step 2: Vendor Scorecard',
    description: 'Score your vendors on PQC readiness dimensions.',
    icon: ClipboardCheck,
  },
  {
    id: 'contract-clauses',
    title: 'Step 3: Contract Clauses',
    description: 'Generate PQC-ready contract clauses for vendor agreements.',
    icon: ScrollText,
  },
  {
    id: 'supply-chain-matrix',
    title: 'Step 4: Supply Chain Matrix',
    description: 'Map vendor dependencies across your infrastructure layers.',
    icon: Network,
  },
]

function ExercisesTab() {
  const exercises = [
    {
      title: 'Scenario: Critical Vendor Without PQC Roadmap',
      prompt:
        'Your organization relies on a TLS termination appliance vendor that has no published PQC roadmap. The vendor provides FIPS 140-3 validated modules but only supports classical algorithms. You need to present a risk assessment to leadership and draft contract language requiring PQC readiness by 2027. Use the Vendor Scorecard (Step 1) to score this vendor and the Contract Clause Generator (Step 2) to draft the requirements.',
    },
    {
      title: 'Scenario: Supply Chain Crypto Dependency Mapping',
      prompt:
        'Your enterprise uses 40+ software products across 7 infrastructure layers. A recent audit revealed that 60% of products lack CBOM delivery capability and only 25% support hybrid PQC modes. Use the Supply Chain Risk Matrix (Step 3) to visualize your exposure, then identify the 3 highest-risk infrastructure layers and propose a prioritized vendor engagement plan.',
    },
    {
      title: 'Scenario: Multi-Vendor FIPS Validation Gap',
      prompt:
        'Your compliance team discovered that several vendors claim "FIPS compliance" but only have FIPS 140-2 validation (not 140-3). NIST stopped accepting new FIPS 140-2 validation requests in September 2021, making FIPS 140-3 the only path for new CMVP certifications. You need to audit your vendor portfolio and replace FIPS 140-2-only products in critical roles. Score at least 3 vendors using the Vendor Scorecard and generate contract clauses that distinguish between FIPS 140-2 and 140-3 requirements.',
    },
  ]

  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Vendor &amp; Supply Chain Risk Exercises
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these real-world scenarios. Use the Workshop tab
          tools to model your answers.
        </p>
        <div className="space-y-4">
          {exercises.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground italic">
                  Use the Vendor Scorecard (Step 1), Contract Clause Generator (Step 2), and Supply
                  Chain Matrix (Step 3) in the Workshop tab to model your response.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const VendorRiskModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Assess vendor PQC readiness, build scorecards, and manage supply chain cryptographic risk."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={<ExercisesTab />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <InfrastructureSelector key={`selector-${configKey}`} />
        case 1:
          return <VendorScorecardBuilder key={`scorecard-${configKey}`} />
        case 2:
          return <ContractClauseGenerator key={`contract-${configKey}`} />
        case 3:
          return <SupplyChainRiskMatrix key={`matrix-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

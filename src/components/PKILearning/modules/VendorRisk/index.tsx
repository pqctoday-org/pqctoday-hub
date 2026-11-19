// SPDX-License-Identifier: AGPL-3.0-only
import { useState, type FC } from 'react'
import { ClipboardCheck, ScrollText, Network, Package, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Introduction } from './components/Introduction'
import { InfrastructureSelector } from './components/InfrastructureSelector'
import { VendorScorecardBuilder } from './components/VendorScorecardBuilder'
import type { ScorecardOutput } from './components/VendorScorecardBuilder'
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

function ExercisesTab({
  onNavigateToWorkshop,
}: {
  onNavigateToWorkshop?: (step?: number) => void
}) {
  const exercises = [
    {
      title: 'Scenario: Critical Vendor Without PQC Roadmap',
      step: 1,
      cta: 'Open Step 2: Vendor Scorecard',
      prompt:
        'Your organization relies on a TLS termination appliance vendor that has no published PQC roadmap. The vendor provides FIPS 140-3 validated modules but only supports classical algorithms. You need to present a risk assessment to leadership and draft contract language requiring PQC readiness aligned with your regulatory scope (for example, CNSA 2.0 FAQ v2.2 for NSS or EO 14412 / NIST IR 8547 targets for federal civilian systems). Use the Vendor Scorecard (Step 2) to score this vendor and the Contract Clause Generator (Step 3) to draft the requirements.',
      evidenceCheck:
        'In production, verify the vendor’s active CMVP certificate number and Security Policy (do not accept ACVP-only algorithm listings or "PQC-ready" marketing sheets as validation) and record a concrete substitution plan if the vendor declines contractual milestones.',
    },
    {
      title: 'Scenario: Supply Chain Crypto Dependency Mapping',
      step: 3,
      cta: 'Open Step 4: Supply Chain Matrix',
      prompt:
        'Your enterprise uses 40+ software products across 7 infrastructure layers. A recent audit revealed that 60% of products lack CBOM delivery capability and only 25% support hybrid PQC modes. Use the Supply Chain Risk Matrix (Step 4) to visualize your exposure, then identify the 3 highest-risk infrastructure layers and propose a prioritized vendor engagement plan.',
      evidenceCheck:
        'A supplier-provided CBOM improves component visibility by listing the algorithms the supplier records, but it does not by itself verify runtime configuration or hidden transitive libraries. Pair CBOM collection with active/passive endpoint testing on business-critical services.',
    },
    {
      title: 'Scenario: Multi-Vendor FIPS Validation Gap',
      step: 1,
      cta: 'Open Step 2: Vendor Scorecard',
      prompt:
        'Your compliance team discovered that several vendors claim "FIPS compliance" but only have FIPS 140-2 validation (not 140-3). The CMVP stopped accepting FIPS 140-2 submissions for new validation certificates on April 1, 2022 (with FIPS 140-2 certificates moving to the CMVP Historical list in September 2026). You need to audit your vendor portfolio and replace FIPS 140-2-only products in critical roles. Score at least 3 vendors using the Vendor Scorecard (Step 2) and generate contract clauses in Step 3 that distinguish between FIPS 140-2 Historical, FIPS 140-3 In Process, and active FIPS 140-3 CMVP validation.',
      evidenceCheck:
        'Verify three facts on the official NIST CMVP portal before accepting a claim: (1) active certificate status, (2) exact module version and tested operational environment in the Security Policy, and (3) CAVP/ACVP algorithm certificates for the specific PQC algorithms required. A Hub scorecard export is an educational template, not a procurement audit.',
    },
  ]

  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Vendor &amp; Supply Chain Risk Exercises
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these real-world scenarios. Select your
          infrastructure in Step 1, then use the Scorecard (Step 2), Contract Clauses (Step 3), and
          Supply Chain Matrix (Step 4) to model your answers.
        </p>
        <div className="space-y-4">
          {exercises.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">GRC decision &amp; evidence check:</strong>{' '}
                  {exercise.evidenceCheck}
                </p>
              </div>
              {onNavigateToWorkshop && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateToWorkshop(exercise.step)}
                    className="gap-1.5 border-primary text-primary hover:bg-primary/10"
                  >
                    {exercise.cta} <ArrowRight size={13} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const VendorRiskModule: FC = () => {
  const [scorecardOutput, setScorecardOutput] = useState<ScorecardOutput | null>(null)

  return (
    <ModuleShell
      manifest={manifest}
      description="Assess vendor PQC readiness, build scorecards, and manage supply chain cryptographic risk."
      learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
      exercises={(api) => <ExercisesTab onNavigateToWorkshop={api.goToWorkshop} />}
      workshopParts={PARTS}
      onReset={() => setScorecardOutput(null)}
      renderWorkshopStep={(index, configKey) => {
        switch (index) {
          case 0:
            return <InfrastructureSelector key={`selector-${configKey}`} />
          case 1:
            return (
              <VendorScorecardBuilder
                key={`scorecard-${configKey}`}
                onOutput={setScorecardOutput}
              />
            )
          case 2:
            return (
              <ContractClauseGenerator
                key={`contract-${configKey}`}
                scorecardOutput={scorecardOutput}
              />
            )
          case 3:
            return (
              <SupplyChainRiskMatrix
                key={`matrix-${configKey}`}
                scorecardOutput={scorecardOutput}
              />
            )
          default:
            return null
        }
      }}
    />
  )
}

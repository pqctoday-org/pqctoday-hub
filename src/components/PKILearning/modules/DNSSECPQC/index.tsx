// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Ruler, GitCompareArrows, ListChecks } from 'lucide-react'
import { DNSSECIntroduction } from './components/DNSSECIntroduction'
import { DNSSECExercises, type SimulationConfig } from './components/DNSSECExercises'
import { SignatureSizeExplorer } from './simulate/SignatureSizeExplorer'
import { ValidationChainWalkthrough } from './simulate/ValidationChainWalkthrough'
import { DeploymentRoadmapTracker } from './simulate/DeploymentRoadmapTracker'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'signature-size-explorer',
    title: 'Step 1: Signature Size Explorer',
    description:
      'Compare RSA, ECDSA, Ed25519, ML-DSA-44, and SLH-DSA sizes against the DNS UDP ceiling.',
    icon: Ruler,
  },
  {
    id: 'validation-chain-walkthrough',
    title: 'Step 2: PQ Validation Chain Walkthrough',
    description:
      'Root → TLD → domain trust chain: where algorithm 18 sits today vs. full deployment.',
    icon: GitCompareArrows,
  },
  {
    id: 'deployment-roadmap-tracker',
    title: 'Step 3: Deployment Roadmap Tracker',
    description: "Cloudflare's own roadmap vs. the DNS root's separate rollover estimate.",
    icon: ListChecks,
  },
]

export const DNSSECPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="DNSSEC & Post-Quantum Signatures"
    description="How DNS Security Extensions are moving to post-quantum signatures, grounded in Cloudflare's real 2026-09-10 deployment."
    learn={(api) => <DNSSECIntroduction onNavigateToSimulate={() => api.goToWorkshop()} />}
    exercises={(api) => (
      <DNSSECExercises
        onNavigateToSimulate={() => api.goToWorkshop()}
        onSetSimulationConfig={(config: SimulationConfig) =>
          api.openWorkshopStep(config.step, { highlightAlgorithm: config.highlightAlgorithm })
        }
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      switch (index) {
        case 0:
          return (
            <SignatureSizeExplorer
              key={`sizes-${configKey}`}
              initialHighlight={config?.highlightAlgorithm as string | undefined}
            />
          )
        case 1:
          return <ValidationChainWalkthrough key={`chain-${configKey}`} />
        case 2:
          return <DeploymentRoadmapTracker key={`roadmap-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

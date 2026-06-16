// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Map, Clock, Container, Shield, Activity, GitBranch } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { PlatformEngExercises } from './components/PlatformEngExercises'
import { PipelineCryptoInventory } from './workshop/PipelineCryptoInventory'
import { QuantumThreatTimeline } from './workshop/QuantumThreatTimeline'
import { ContainerSigningMigration } from './workshop/ContainerSigningMigration'
import { PolicyAsCodeEnforcer } from './workshop/PolicyAsCodeEnforcer'
import { CryptoPostureMonitor } from './workshop/CryptoPostureMonitor'
import { PlatformMigrationPlanner } from './workshop/PlatformMigrationPlanner'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'pipeline-crypto-inventory',
    title: 'Step 1: Pipeline Crypto Inventory',
    description:
      'Map every cryptographic primitive embedded in your CI/CD pipeline from source control to runtime. Identify HNDL exposure per stage.',
    icon: Map,
  },
  {
    id: 'quantum-threat-timeline',
    title: 'Step 2: Quantum Threat Timeline',
    description:
      'Model HNDL risk for each pipeline asset under different CRQC arrival scenarios. Understand why short-lived certs do not eliminate harvest risk.',
    icon: Clock,
  },
  {
    id: 'container-signing-migration',
    title: 'Step 3: Container Signing Migration',
    description:
      'Compare OCI artifact signing tools by PQC readiness. Walk through the ECDSA → ML-DSA migration path for cosign and Notation.',
    icon: Container,
  },
  {
    id: 'policy-as-code-enforcer',
    title: 'Step 4: Policy-as-Code Enforcer',
    description:
      'OPA and Kyverno rules that block quantum-vulnerable algorithm OIDs at Kubernetes admission time. Maps to SLSA supply chain levels.',
    icon: Shield,
  },
  {
    id: 'crypto-posture-monitor',
    title: 'Step 5: Crypto Posture Monitor',
    description:
      'Four-panel monitor: Prometheus metrics, SIEM queries, capacity planning calculators, and ACME certificate lifecycle with cert-manager v1.17+.',
    icon: Activity,
  },
  {
    id: 'platform-migration-planner',
    title: 'Step 6: Platform Migration Planner',
    description:
      'Six-phase migration runway: inventory → Root CA → TLS key exchange → artifact signing → CI identity → policy cut-over. Includes rollback decision tree.',
    icon: GitBranch,
  },
]

export const PlatformEngPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Inventory, migrate, and monitor every cryptographic primitive in your software delivery pipeline — CI/CD crypto assets, container signing, IaC defaults, policy enforcement, and posture monitoring with a quantum threat lens."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <PlatformEngExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <PipelineCryptoInventory key={`pipeline-${configKey}`} />
        case 1:
          return <QuantumThreatTimeline key={`timeline-${configKey}`} />
        case 2:
          return <ContainerSigningMigration key={`signing-${configKey}`} />
        case 3:
          return <PolicyAsCodeEnforcer key={`policy-${configKey}`} />
        case 4:
          return <CryptoPostureMonitor key={`monitor-${configKey}`} />
        case 5:
          return <PlatformMigrationPlanner key={`migration-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

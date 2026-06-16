// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Map, Database, RefreshCw, Cloud, GitBranch } from 'lucide-react'
import { SecretsManagementIntroduction } from './components/SecretsManagementIntroduction'
import { SecretsManagementExercises } from './components/SecretsManagementExercises'
import { SecretsArchitectureMapper } from './workshop/SecretsArchitectureMapper'
import { VaultPQCSimulator } from './workshop/VaultPQCSimulator'
import { RotationPolicyDesigner } from './workshop/RotationPolicyDesigner'
import { CloudSecretsComparator } from './workshop/CloudSecretsComparator'
import { PipelineIntegrationLab } from './workshop/PipelineIntegrationLab'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'secrets-architecture-mapper',
    title: 'Step 1: Architecture Mapper',
    description: 'Classify your secret types by PQC risk level and HNDL exposure.',
    icon: Map,
  },
  {
    id: 'vault-pqc-simulator',
    title: 'Step 2: Vault Transit Simulator',
    description: 'Simulate HashiCorp Vault transit engine operations with PQC algorithms.',
    icon: Database,
  },
  {
    id: 'rotation-policy-designer',
    title: 'Step 3: Rotation Policy Designer',
    description: 'Design PQC-aware rotation policies with automated TTL recommendations.',
    icon: RefreshCw,
  },
  {
    id: 'cloud-secrets-comparator',
    title: 'Step 4: Cloud Provider Comparator',
    description: 'Compare AWS, Azure, GCP, and HashiCorp Vault PQC readiness.',
    icon: Cloud,
  },
  {
    id: 'pipeline-integration-lab',
    title: 'Step 5: Pipeline Integration Lab',
    description:
      'Integrate PQC-safe secrets into Kubernetes, GitHub Actions, and Terraform pipelines.',
    icon: GitBranch,
  },
]

export const SecretsManagementPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Master PQC migration for secrets managers: classify secrets by risk, simulate Vault transit with ML-KEM, design rotation policies, and integrate into CI/CD pipelines."
    learn={(api) => <SecretsManagementIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <SecretsManagementExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <SecretsArchitectureMapper key={`mapper-${configKey}`} />
        case 1:
          return <VaultPQCSimulator key={`vault-${configKey}`} />
        case 2:
          return <RotationPolicyDesigner key={`rotation-${configKey}`} />
        case 3:
          return <CloudSecretsComparator key={`cloud-${configKey}`} />
        case 4:
          return <PipelineIntegrationLab key={`pipeline-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

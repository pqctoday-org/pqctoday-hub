// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import {
  Database,
  FileCheck,
  Lock,
  UserCheck,
  ShoppingCart,
  Network,
  Calculator,
} from 'lucide-react'
import { Introduction } from './components/Introduction'
import { AISecurityExercises } from './components/AISecurityExercises'
import { DataProtectionAnalyzer } from './workshop/DataProtectionAnalyzer'
import { DataAuthenticityVerifier } from './workshop/DataAuthenticityVerifier'
import { ModelWeightVault } from './workshop/ModelWeightVault'
import { AgentAuthDesigner } from './workshop/AgentAuthDesigner'
import { AgenticCommerceSimulator } from './workshop/AgenticCommerceSimulator'
import { Agent2AgentProtocol } from './workshop/Agent2AgentProtocol'
import { ScaleEncryptionPlanner } from './workshop/ScaleEncryptionPlanner'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'data-protection-analyzer',
    title: 'Step 1: Data Protection Analyzer',
    description:
      'Audit AI pipeline crypto operations — identify quantum-vulnerable touchpoints and HNDL exposure at each stage.',
    icon: Database,
  },
  {
    id: 'data-authenticity-verifier',
    title: 'Step 2: Data Authenticity Verifier',
    description:
      'Configure verification layers against synthetic data contamination. Visualize model collapse and compare signing overheads.',
    icon: FileCheck,
  },
  {
    id: 'model-weight-vault',
    title: 'Step 3: Model Weight Vault',
    description:
      'Configure encryption, key wrapping, and signing for model weights. Compare classical vs PQC overhead.',
    icon: Lock,
  },
  {
    id: 'agent-auth-designer',
    title: 'Step 4: Agent Auth Designer',
    description:
      'Design authentication architectures and delegation chains for AI agents with PQC credentials.',
    icon: UserCheck,
  },
  {
    id: 'agentic-commerce-simulator',
    title: 'Step 5: Agentic Commerce Simulator',
    description:
      'Step through agent-to-agent transaction flows with quantum overlay to identify vulnerable crypto.',
    icon: ShoppingCart,
  },
  {
    id: 'agent-to-agent-protocol',
    title: 'Step 6: Agent-to-Agent Protocol',
    description: 'Design PQC-secured communication protocols for autonomous agent interactions.',
    icon: Network,
  },
  {
    id: 'scale-encryption-planner',
    title: 'Step 7: Scale Encryption Planner',
    description:
      'Calculate PQC migration requirements at enterprise scale — key counts, KMS ops, HNDL risk windows.',
    icon: Calculator,
  },
]

export const AISecurityPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Quantum threats to AI systems — data pipeline protection, model weight security, agent authentication, agentic commerce, and encryption at scale."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <AISecurityExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step)}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <DataProtectionAnalyzer key={`dpa-${configKey}`} />
        case 1:
          return <DataAuthenticityVerifier key={`dav-${configKey}`} />
        case 2:
          return <ModelWeightVault key={`mwv-${configKey}`} />
        case 3:
          return <AgentAuthDesigner key={`aad-${configKey}`} />
        case 4:
          return <AgenticCommerceSimulator key={`acs-${configKey}`} />
        case 5:
          return <Agent2AgentProtocol key={`a2a-${configKey}`} />
        case 6:
          return <ScaleEncryptionPlanner key={`sep-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

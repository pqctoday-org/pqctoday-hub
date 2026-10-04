// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Cpu, ShieldCheck, Lock, Link2, AlertTriangle } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { ConfidentialComputingExercises } from './components/ConfidentialComputingExercises'
import { TEEArchitectureExplorer } from './workshop/TEEArchitectureExplorer'
import { AttestationWorkshop } from './workshop/AttestationWorkshop'
import { EncryptionMechanisms } from './workshop/EncryptionMechanisms'
import { TEEHSMTrustedChannel } from './workshop/TEEHSMTrustedChannel'
import { QuantumThreatMigration } from './workshop/QuantumThreatMigration'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'tee-architecture-explorer',
    title: 'Step 1: TEE Architecture Explorer',
    description:
      'Compare 7 TEE architectures by isolation scope, encryption, attestation, and PQC readiness.',
    icon: Cpu,
  },
  {
    id: 'attestation-workshop',
    title: 'Step 2: Attestation Workshop',
    description:
      'Step through remote attestation flows for Intel DCAP, ARM CCA, AMD SEV-SNP, and AWS Nitro.',
    icon: ShieldCheck,
  },
  {
    id: 'encryption-mechanisms',
    title: 'Step 3: Encryption Mechanisms',
    description:
      'Explore memory encryption engines, sealing key derivation, and Grover impact on AES key sizes.',
    icon: Lock,
  },
  {
    id: 'tee-hsm-channel',
    title: 'Step 4: TEE-HSM Trusted Channel',
    description:
      'Design mutual attestation and PQC key provisioning between TEE enclaves and HSMs.',
    icon: Link2,
  },
  {
    id: 'quantum-threat-migration',
    title: 'Step 5: Quantum Threat Migration',
    description:
      'Assess quantum risks per TEE component and build a prioritized PQC migration plan.',
    icon: AlertTriangle,
  },
]

export const ConfidentialComputingModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="TEE architectures, remote attestation, memory encryption, TEE-HSM integration, and quantum threat analysis for confidential computing."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <ConfidentialComputingExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <TEEArchitectureExplorer key={`tee-arch-${configKey}`} />
        case 1:
          return <AttestationWorkshop key={`attestation-${configKey}`} />
        case 2:
          return <EncryptionMechanisms key={`encryption-${configKey}`} />
        case 3:
          return <TEEHSMTrustedChannel key={`tee-hsm-${configKey}`} />
        case 4:
          return <QuantumThreatMigration key={`quantum-threat-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

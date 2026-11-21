// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { Eye, Users, KeyRound, Layers, Bot } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { CustodyThreatsIntroduction } from './components/CustodyThreatsIntroduction'
import {
  CustodyThreatsExercises,
  type CustodyWorkshopConfig,
} from './components/CustodyThreatsExercises'
import { BlindVsClearWorkshop } from './workshop/BlindVsClearWorkshop'
import { QuorumApprovalsWorkshop } from './workshop/QuorumApprovalsWorkshop'
import { ThresholdSigningWorkshop } from './workshop/ThresholdSigningWorkshop'
import { CombinationBuilderWorkshop } from './workshop/CombinationBuilderWorkshop'
import { AgentWalletScopeWorkshop } from './workshop/AgentWalletScopeWorkshop'

const PARTS: WorkshopPart[] = [
  {
    id: 'blind-vs-clear',
    title: 'Step 1: Blind vs Clear Signing (HSM)',
    description:
      'Sign a benign transfer and a hidden delegatecall contract upgrade with CKM_ECDSA on secp256k1, comparing blind signing, parse-only warnings, and in-boundary policy enforcement.',
    icon: Eye,
  },
  {
    id: 'quorum-approvals',
    title: 'Step 2: Quorum Approvals (ML-DSA-65 + secp256k1)',
    description:
      'Gate classical secp256k1 transaction signing behind 2-of-3 HSM ML-DSA-65 approvals over decoded payload, nonce, and expiry — and test tamper, expiry, and replay rejection.',
    icon: Users,
  },
  {
    id: 'threshold-signing',
    title: 'Step 3: Threshold Signing (RFC 9591 FROST)',
    description:
      'Execute 3-round DKG and 2-of-3 secp256k1_FROST signing with independent per-party policies, HSM ML-DSA-65 authentication, and the §5b host-RAM vs in-HSM conceptual toggle.',
    icon: KeyRound,
  },
  {
    id: 'combination-builder',
    title: 'Step 4: Control Combination Builder',
    description:
      'Assemble HSM, MPC, enclave, trusted display, and timelock controls across three account types to inspect mitigated incident patterns, Rule G1 assumptions, and residual risks.',
    icon: Layers,
  },
  {
    id: 'agent-wallet-scope',
    title: 'Step 5: Agent Wallet Scoping',
    description:
      'Set spend limits, signer-enforced allowlists, human approval thresholds, grant TTLs, and key isolation, then replay three AI agent mistake scenarios.',
    icon: Bot,
  },
]

export const CustodyThreatsControlsModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Who can make a custody system sign, and which control combinations stop unauthorized signing today — blind vs clear signing, exfiltration paths, adversary models, case studies, and hybrid MPC + HSM architectures."
    learn={(api) => (
      <CustodyThreatsIntroduction onNavigateToWorkshop={(step) => api.goToWorkshop(step)} />
    )}
    exercises={(api) => (
      <CustodyThreatsExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const preset = (config as CustodyWorkshopConfig | undefined)?.preset
      switch (index) {
        case 0:
          return <BlindVsClearWorkshop key={`w1-${configKey}`} initialPreset={preset} />
        case 1:
          return <QuorumApprovalsWorkshop key={`w2-${configKey}`} />
        case 2:
          return <ThresholdSigningWorkshop key={`w3-${configKey}`} initialPreset={preset} />
        case 3:
          return <CombinationBuilderWorkshop key={`w4-${configKey}`} initialPreset={preset} />
        case 4:
          return <AgentWalletScopeWorkshop key={`w6-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { KeyRound, GitBranch, ShieldAlert, Fingerprint, Network } from 'lucide-react'
import { StatefulSigsIntroduction } from './components/StatefulSigsIntroduction'
import { StatefulSigsExercises } from './components/StatefulSigsExercises'
import { LMSKeyGenDemo } from './workshop/LMSKeyGenDemo'
import { XMSSKeyGenDemo } from './workshop/XMSSKeyGenDemo'
import { StateManagementVisualizer } from './workshop/StateManagementVisualizer'
import { SLHDSALiveDemo } from './workshop/SLHDSALiveDemo'
import { ThresholdSigningDemo } from './workshop/ThresholdSigningDemo'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'lms-keygen',
    title: 'Step 1: LMS Key Generation',
    description: 'Explore LMS parameter sets, Merkle tree structure, and key/signature sizes.',
    icon: KeyRound,
  },
  {
    id: 'xmss-keygen',
    title: 'Step 2: XMSS Key Generation',
    description: 'Compare XMSS with LMS at equivalent security levels.',
    icon: GitBranch,
  },
  {
    id: 'state-management',
    title: 'Step 3: State Management',
    description: 'Simulate signing, key exhaustion, and catastrophic state loss.',
    icon: ShieldAlert,
  },
  {
    id: 'slh-dsa-live',
    title: 'Step 4: SLH-DSA Live Demo',
    description:
      'Generate real SLH-DSA keys, sign, and verify via PKCS#11 — compare stateless vs stateful.',
    icon: Fingerprint,
  },
  {
    id: 'threshold-signing',
    title: 'Step 5: Threshold Signing',
    description:
      'Distributed key control via the Haystack coalition construction (Kelsey, Lang, Lucks) — t-of-n trustees, simulated.',
    icon: Network,
  },
]

export const StatefulSignaturesModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Stateful Hash Signatures (LMS/XMSS)"
    description="Master hash-based digital signatures — LMS and XMSS standardized in NIST SP 800-208, with security based on hash function properties rather than new hardness assumptions."
    learn={(api) => <StatefulSigsIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <StatefulSigsExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const c = config as { paramId?: string } | undefined
      switch (index) {
        case 0:
          return <LMSKeyGenDemo key={`lms-${configKey}`} initialParamId={c?.paramId} />
        case 1:
          return <XMSSKeyGenDemo key={`xmss-${configKey}`} />
        case 2:
          return <StateManagementVisualizer key={`state-${configKey}`} />
        case 3:
          return <SLHDSALiveDemo key={`slhdsa-${configKey}`} />
        case 4:
          return <ThresholdSigningDemo key={`threshold-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

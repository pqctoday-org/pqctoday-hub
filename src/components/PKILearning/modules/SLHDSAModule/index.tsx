// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { KeyRound, Fingerprint, Lock, ArrowLeftRight } from 'lucide-react'
import { SLHDSAIntroduction } from './components/SLHDSAIntroduction'
import { SLHDSAExercises } from './components/SLHDSAExercises'
import { SLHDSALiveDemo } from '../StatefulSignatures/workshop/SLHDSALiveDemo'
import { SLHDSAComparison } from './workshop/SLHDSAComparison'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'keygen',
    title: 'Step 1: Key Generation & Parameter Explorer',
    description:
      'Generate SLH-DSA key pairs across all 12 FIPS 205 parameter sets. Observe key sizes and explore the FIPS 205 §11 internal parameter table.',
    icon: KeyRound,
  },
  {
    id: 'sign-verify',
    title: 'Step 2: Sign & Verify',
    description:
      'Sign messages in Pure SLH-DSA and HashSLH-DSA modes. Verify signatures via PKCS#11 with real WASM-backed crypto.',
    icon: Fingerprint,
  },
  {
    id: 'context-deterministic',
    title: 'Step 3: Context Strings & Deterministic Mode',
    description:
      'Explore context strings in pure and pre-hash signing. Verify with matching and mismatched contexts, then explicitly select deterministic or hedged signing and compare two signatures.',
    icon: Lock,
  },
  {
    id: 'comparison',
    title: 'Step 4: LMS vs XMSS vs SLH-DSA',
    description:
      'Compare all three hash-based signature schemes side by side: statefulness, signature sizes, signing speed, and deployment considerations.',
    icon: ArrowLeftRight,
  },
]

export const SLHDSAModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="SLH-DSA: Stateless Hash Signatures (FIPS 205)"
    description={
      <>
        Master FIPS 205 SLH-DSA &mdash; stateless hash-based signatures with no state management
        burden. Covers WOTS+, FORS, hypertree architecture, parameter trade-offs, context strings,
        and deterministic signing.
      </>
    }
    learn={(api) => <SLHDSAIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <SLHDSAExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <SLHDSALiveDemo key={`slhdsa-keygen-${configKey}`} context="slh-dsa" />
        case 1:
          return <SLHDSALiveDemo key={`slhdsa-sign-${configKey}`} context="slh-dsa" />
        case 2:
          return <SLHDSALiveDemo key={`slhdsa-ctx-${configKey}`} context="slh-dsa" />
        case 3:
          return <SLHDSAComparison key={`slhdsa-cmp-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

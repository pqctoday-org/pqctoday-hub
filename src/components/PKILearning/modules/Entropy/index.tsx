// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Dice5, BarChart3, ShieldCheck, Workflow, Combine } from 'lucide-react'
import { EntropyIntroduction } from './components/EntropyIntroduction'
import { EntropyExercises } from './components/EntropyExercises'
import { RandomGenerationDemo } from './workshop/RandomGenerationDemo'
import { EntropyTestingDemo } from './workshop/EntropyTestingDemo'
import { ESVWalkthroughDemo } from './workshop/ESVWalkthroughDemo'
import { DrbgArchitectureDemo } from './workshop/DrbgArchitectureDemo'
import { SourceCombiningDemo } from './workshop/SourceCombiningDemo'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'random-generation',
    title: 'Step 1: Random Byte Generation',
    description: 'Generate and compare random bytes from Web Crypto API and OpenSSL WASM.',
    icon: Dice5,
  },
  {
    id: 'entropy-testing',
    title: 'Step 2: Entropy Testing',
    description:
      'Visual checks, SP 800-90B health tests and primitive self-checks, shown as separate groups with their sample-size limits.',
    icon: BarChart3,
  },
  {
    id: 'esv-walkthrough',
    title: 'Step 3: ESV Validation',
    description: 'Walk through the NIST Entropy Source Validation process.',
    icon: ShieldCheck,
  },
  {
    id: 'drbg-state-machine',
    title: 'Step 4: DRBG State Machine',
    description:
      'Instantiate, generate and reseed an SP 800-90A HMAC_DRBG, and check it against NIST known-answer vectors.',
    icon: Workflow,
  },
  {
    id: 'source-combining',
    title: 'Step 5: Combining Sources',
    description:
      'Health-test raw source samples before conditioning, then judge a combined construction from stated assumptions.',
    icon: Combine,
  },
]

export const EntropyModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Entropy sources, SP 800-90A DRBGs, SP 800-90B entropy-source validation and SP 800-90C RBG constructions — why output tests are not entropy estimates, why a QRNG is judged by the same rules, and what random inputs ML-KEM, ML-DSA and SLH-DSA require."
    learn={(api) => <EntropyIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <EntropyExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const c = config as
        { sampleType?: 'good' | 'bad-zeros' | 'bad-pattern' | 'bad-increment' } | undefined
      switch (index) {
        case 0:
          return <RandomGenerationDemo key={`rng-${configKey}`} />
        case 1:
          return <EntropyTestingDemo key={`test-${configKey}`} initialSampleType={c?.sampleType} />
        case 2:
          return <ESVWalkthroughDemo key={`esv-${configKey}`} />
        case 3:
          return <DrbgArchitectureDemo key={`drbg-${configKey}`} />
        case 4:
          return <SourceCombiningDemo key={`combine-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

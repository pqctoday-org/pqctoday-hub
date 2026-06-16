// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Dice5, BarChart3, ShieldCheck, Atom, Combine } from 'lucide-react'
import { EntropyIntroduction } from './components/EntropyIntroduction'
import { EntropyExercises } from './components/EntropyExercises'
import { RandomGenerationDemo } from './workshop/RandomGenerationDemo'
import { EntropyTestingDemo } from './workshop/EntropyTestingDemo'
import { ESVWalkthroughDemo } from './workshop/ESVWalkthroughDemo'
import { QRNGDemo } from './workshop/QRNGDemo'
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
    description: 'Run simplified SP 800-90B statistical tests on generated random data.',
    icon: BarChart3,
  },
  {
    id: 'esv-walkthrough',
    title: 'Step 3: ESV Validation',
    description: 'Walk through the NIST Entropy Source Validation process.',
    icon: ShieldCheck,
  },
  {
    id: 'qrng-comparison',
    title: 'Step 4: QRNG Exploration',
    description: 'Compare pre-fetched quantum random data with local TRNG output.',
    icon: Atom,
  },
  {
    id: 'source-combining',
    title: 'Step 5: Combining Sources',
    description: 'Combine TRNG and QRNG entropy using the SP 800-90C XOR+conditioning framework.',
    icon: Combine,
  },
]

export const EntropyModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Master entropy sources, DRBG mechanisms, and quantum randomness — NIST SP 800-90 standards, entropy testing, TRNG vs QRNG, and combining sources for defense-in-depth."
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
        | { sampleType?: 'good' | 'bad-zeros' | 'bad-pattern' | 'bad-increment' }
        | undefined
      switch (index) {
        case 0:
          return <RandomGenerationDemo key={`rng-${configKey}`} />
        case 1:
          return <EntropyTestingDemo key={`test-${configKey}`} initialSampleType={c?.sampleType} />
        case 2:
          return <ESVWalkthroughDemo key={`esv-${configKey}`} />
        case 3:
          return <QRNGDemo key={`qrng-${configKey}`} />
        case 4:
          return <SourceCombiningDemo key={`combine-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

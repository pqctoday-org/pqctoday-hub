// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { BarChart3, KeyRound, PenLine, Shapes } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { PQC101Module } from './PQC101Module'
import { AlgorithmFamilyWorkshop } from './AlgorithmFamilyWorkshop'
import { AlgorithmComparisonTable } from './AlgorithmComparisonTable'
import { KeyGenWorkshop } from './KeyGenWorkshop'
import { SignatureDemo } from './SignatureDemo'
import { PQC101Exercises } from './PQC101Exercises'
import { Button } from '@/components/ui/button'
import manifest from './manifest'

const MODULE_ID = 'pqc-101'

const PARTS: WorkshopPart[] = [
  {
    id: 'algorithm-families',
    title: 'Step 1: Why PQC Works',
    description:
      'Explore why lattice, hash-based, and code-based algorithms resist quantum computers.',
    icon: Shapes,
  },
  {
    id: 'algorithm-comparison',
    title: 'Step 2: Algorithm Comparison',
    description: 'Compare classical and post-quantum algorithms side-by-side.',
    icon: BarChart3,
  },
  {
    id: 'key-generation',
    title: 'Step 3: Key Generation',
    description: 'Generate a real key pair with OpenSSL and observe size differences.',
    icon: KeyRound,
  },
  {
    id: 'signature-demo',
    title: 'Step 4: Signature Demo',
    description: 'Sign a message and see how digital signatures prove authenticity.',
    icon: PenLine,
  },
]

export const Module1: FC = () => {
  // Migrated onto ModuleShell (the shared stepper). The bespoke "curious mode"
  // tab/step filtering is dropped: the curious experience is owned by the
  // page-level CuriousModuleView (shown for every module), so this module no
  // longer needs to self-filter — it now behaves like every other lesson.
  const markStepComplete = useModuleStore((s) => s.markStepComplete)
  return (
    <ModuleShell
      manifest={manifest}
      title="PQC 101: Introduction"
      description="Understand the quantum threat, explore NIST PQC standards, and compare classical vs post-quantum cryptography."
      learn={(api) => (
        <>
          <PQC101Module />
          <div className="mt-6 flex justify-end">
            <Button
              variant="gradient"
              onClick={() => api.goToWorkshop()}
              className="px-6 py-2 font-bold rounded-lg transition-colors"
            >
              Go to Workshop &rarr;
            </Button>
          </div>
        </>
      )}
      exercises={(api) => (
        <PQC101Exercises
          onNavigateToWorkshop={() => api.goToWorkshop()}
          onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step)}
        />
      )}
      workshopParts={PARTS}
      renderWorkshopStep={(index, configKey) => {
        switch (index) {
          case 0:
            return (
              <AlgorithmFamilyWorkshop
                key={`families-${configKey}`}
                onComplete={() => markStepComplete(MODULE_ID, 'algorithm-families')}
              />
            )
          case 1:
            return <AlgorithmComparisonTable key={`comparison-${configKey}`} />
          case 2:
            return (
              <KeyGenWorkshop
                key={`keygen-${configKey}`}
                onComplete={() => markStepComplete(MODULE_ID, 'key-generation')}
              />
            )
          case 3:
            return (
              <SignatureDemo
                key={`sigdemo-${configKey}`}
                onComplete={() => markStepComplete(MODULE_ID, 'signature-demo')}
              />
            )
          default:
            return null
        }
      }}
    />
  )
}

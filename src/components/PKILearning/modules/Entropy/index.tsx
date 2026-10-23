// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useMemo, type FC } from 'react'
import { Dice5, BarChart3, ShieldCheck, Workflow, Combine, Microscope } from 'lucide-react'
import { EntropyIntroduction } from './components/EntropyIntroduction'
import { EntropyExercises } from './components/EntropyExercises'
import { RandomGenerationDemo } from './workshop/RandomGenerationDemo'
import { EntropyTestingDemo } from './workshop/EntropyTestingDemo'
import { ESVWalkthroughDemo } from './workshop/ESVWalkthroughDemo'
import { DrbgArchitectureDemo } from './workshop/DrbgArchitectureDemo'
import { SourceCombiningDemo } from './workshop/SourceCombiningDemo'
import { EntropyEvidenceLab } from './workshop/evidenceLab/EntropyEvidenceLab'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { useActiveLearnPathId } from '@/components/PKILearning/common/useLearnPath'
import { isInLearnPath } from '@/components/PKILearning/manifest/learnPathScope'
import {
  ModuleWorkshopNextContext,
  type ModuleWorkshopNext,
} from '@/components/Playground/contexts/WorkshopNavigationContext'
import manifest from './manifest'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useModuleStore } from '@/store/useModuleStore'
import { defaultEntropyLearnPath } from './learnPath'

// Titles carry no "Step N:" prefix: the stepper numbers the steps on the learner's path, and a path
// that hides a step (general practitioner: no ESV; certification engineer: no Random Byte
// Generation) would otherwise show a chip "1" over a title that says "Step 2".
const PARTS: WorkshopPart[] = [
  {
    id: 'random-generation',
    title: 'Random Byte Generation',
    description: 'Generate and compare random bytes from Web Crypto API and OpenSSL WASM.',
    icon: Dice5,
  },
  {
    id: 'entropy-testing',
    title: 'Entropy Testing',
    description:
      'Visual checks, SP 800-90B health tests and primitive self-checks, shown as separate groups with their sample-size limits.',
    icon: BarChart3,
  },
  {
    id: 'esv-walkthrough',
    title: 'ESV Validation',
    description: 'Walk through the CMVP Entropy Source Validation process.',
    icon: ShieldCheck,
  },
  {
    id: 'drbg-state-machine',
    title: 'DRBG State Machine',
    description:
      'Instantiate, generate and reseed an SP 800-90A HMAC_DRBG, and check it against NIST known-answer vectors.',
    icon: Workflow,
  },
  {
    id: 'source-combining',
    title: 'Combining Sources',
    description:
      'Health-test raw source samples before conditioning, then judge a combined construction from stated assumptions.',
    icon: Combine,
  },
  {
    id: 'entropy-evidence-lab',
    title: 'Entropy Evidence Lab (SP 800-90B)',
    description:
      'Run the NIST SP 800-90B estimators on real device recordings, a DRBG-output contrast set and synthetic failures — and conclude only what the evidence supports.',
    icon: Microscope,
  },
]

export const EntropyModule: FC = () => {
  const persona = usePersonaStore((state) => state.selectedPersona)
  const activePath = useModuleStore((state) => state.modules[manifest.id]?.activeLearnPath)
  const setActiveLearnPath = useModuleStore((state) => state.setActiveLearnPath)

  // The steps shown on the active path, in the stepper's order (ModuleShell applies the same rule).
  const activePathId = useActiveLearnPathId(manifest.id, manifest)
  const visibleSteps = useMemo(() => {
    const byId = new Map((manifest.workshopSteps ?? []).map((st) => [st.id, st]))
    const onPath = PARTS.map((_, i) => i).filter((i) =>
      isInLearnPath(byId.get(PARTS.at(i)?.id ?? ''), activePathId)
    )
    return onPath.length > 0 ? onPath : PARTS.map((_, i) => i)
  }, [activePathId])

  useEffect(() => {
    if (!persona || activePath) return
    const path = defaultEntropyLearnPath(persona)
    if (path) setActiveLearnPath(manifest.id, path)
  }, [activePath, persona, setActiveLearnPath])

  return (
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
      renderWorkshopStep={(index, configKey, config, goToStep) => {
        const c = config as
          { sampleType?: 'good' | 'bad-zeros' | 'bad-pattern' | 'bad-increment' } | undefined
        // The "next in sequence" card each step ends with names the next step on THIS path (and
        // opens it), and is dropped on the last one.
        const nextIndex = visibleSteps[visibleSteps.indexOf(index) + 1]
        const nextPart = nextIndex === undefined ? undefined : PARTS.at(nextIndex)
        const next: ModuleWorkshopNext | null =
          nextIndex === undefined || !nextPart
            ? null
            : {
                name: nextPart.title,
                description: nextPart.description,
                open: () => goToStep(nextIndex),
              }
        const step = (() => {
          switch (index) {
            case 0:
              return <RandomGenerationDemo key={`rng-${configKey}`} />
            case 1:
              return (
                <EntropyTestingDemo key={`test-${configKey}`} initialSampleType={c?.sampleType} />
              )
            case 2:
              return <ESVWalkthroughDemo key={`esv-${configKey}`} />
            case 3:
              return <DrbgArchitectureDemo key={`drbg-${configKey}`} />
            case 4:
              return <SourceCombiningDemo key={`combine-${configKey}`} />
            case 5:
              return <EntropyEvidenceLab key={`evidence-${configKey}`} />
            default:
              return null
          }
        })()
        return step ? (
          <ModuleWorkshopNextContext.Provider value={next}>
            {step}
          </ModuleWorkshopNextContext.Provider>
        ) : null
      }}
    />
  )
}

// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { KeyRound, FileSearch, Stamp } from 'lucide-react'
import { MediaDrmIntroduction } from './components/MediaDrmIntroduction'
import { MediaDrmExercises } from './components/MediaDrmExercises'
import { KeyLadderExplorer } from './workshop/KeyLadderExplorer'
import { SpecVsQuantum } from './workshop/SpecVsQuantum'
import { ProvenanceAlgorithmCheck } from './workshop/ProvenanceAlgorithmCheck'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'key-ladder-explorer',
    title: 'Step 1: Key Ladder Explorer',
    description:
      'Walk the key ladder of AACS or CI Plus rung by rung: the primitive the specification names, where it says so, and which NIST IR 8547 table lists the public-key rungs.',
    icon: KeyRound,
  },
  {
    id: 'spec-vs-quantum',
    title: 'Step 2: Spec vs Quantum',
    description:
      'Compare four editions: the public-key mechanisms each one specifies, and what its text says about quantum computing, which is a statement about one document and not about anyone’s plans.',
    icon: FileSearch,
  },
  {
    id: 'provenance-algorithm-check',
    title: 'Step 3: Provenance Algorithm Check',
    description:
      'Pick a signature algorithm and see whether C2PA 2.4 allows it for new claim signatures, together with the COSE documents and trust-chain pieces a post-quantum signature would also touch.',
    icon: Stamp,
  },
]

export const MediaDrmPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="The AACS key ladder, CI Plus conditional access, the MovieLabs ECP specification, streaming licenses and C2PA Content Credentials, read from the editions and set against NIST IR 8547."
    learn={(api) => <MediaDrmIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <MediaDrmExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <KeyLadderExplorer key={`ladder-${configKey}`} />
        case 1:
          return <SpecVsQuantum key={`spec-${configKey}`} />
        case 2:
          return <ProvenanceAlgorithmCheck key={`prov-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

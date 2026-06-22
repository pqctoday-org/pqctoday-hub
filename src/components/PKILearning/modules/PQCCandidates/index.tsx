// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Workflow, Boxes, GitCompare, ShieldOff, Compass, Globe } from 'lucide-react'
import { CandidatesIntroduction } from './components/CandidatesIntroduction'
import { CandidatesExercises } from './components/CandidatesExercises'
import { StandardizationLifecycle } from './workshop/StandardizationLifecycle'
import { FamilyMathExplainer } from './workshop/FamilyMathExplainer'
import { CandidateComparator } from './workshop/CandidateComparator'
import { CryptanalysisTimeline } from './workshop/CryptanalysisTimeline'
import { FutureRoundsForecaster } from './workshop/FutureRoundsForecaster'
import { WorldwideStandardizationMap } from './workshop/WorldwideStandardizationMap'
import type { FamilyId } from './data/families'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'lifecycle',
    title: 'Step 1: Standardisation Lifecycle',
    description:
      'Pick a candidate and advance it through the NIST rounds; cryptanalysis events fire in context.',
    icon: Workflow,
  },
  {
    id: 'family-math',
    title: 'Step 2: Family Math Explainer',
    description:
      'Animated visualisers for MPCitH, multivariate, isogeny, and lattice constructions.',
    icon: Boxes,
  },
  {
    id: 'comparator',
    title: 'Step 3: Candidate Comparator',
    description: 'Sort, filter, and find the right candidate for a given use case across the nine.',
    icon: GitCompare,
  },
  {
    id: 'cryptanalysis',
    title: 'Step 4: Cryptanalysis Timeline',
    description:
      'Every attack and reparameterisation event, with the affected schemes and their response.',
    icon: ShieldOff,
  },
  {
    id: 'future-rounds',
    title: 'Step 5: Future Rounds Forecaster',
    description: 'Where each candidate is likely to land, and what comes after the 9.',
    icon: Compass,
  },
  {
    id: 'worldwide-map',
    title: 'Step 6: Worldwide Standardisation Map',
    description:
      'Parallel, aligned, and overlay tracks: KpqC, CACR, ISO/IEC, IETF, ETSI, CRYPTREC, BSI, ANSSI.',
    icon: Globe,
  },
]

export const PQCCandidatesModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="PQC Candidates & Standardisation Lifecycle"
    description="How NIST evaluates new post-quantum mechanisms, the nine third-round signature on-ramp candidates across four math families, and the worldwide parallel tracks that decide what actually ships."
    learn={(api) => <CandidatesIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <CandidatesExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const c = config as { candidateId?: string; familyId?: string } | undefined
      switch (index) {
        case 0:
          return (
            <StandardizationLifecycle
              key={`lifecycle-${configKey}`}
              initialCandidateId={c?.candidateId}
            />
          )
        case 1:
          return (
            <FamilyMathExplainer
              key={`family-${configKey}`}
              initialFamilyId={c?.familyId as FamilyId | undefined}
            />
          )
        case 2:
          return (
            <CandidateComparator
              key={`comparator-${configKey}`}
              initialCandidateId={c?.candidateId}
            />
          )
        case 3:
          return <CryptanalysisTimeline />
        case 4:
          return <FutureRoundsForecaster />
        case 5:
          return <WorldwideStandardizationMap />
        default:
          return null
      }
    }}
  />
)

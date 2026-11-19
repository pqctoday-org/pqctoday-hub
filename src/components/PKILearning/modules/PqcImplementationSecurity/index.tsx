// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { Timer, ShieldAlert, Cpu, ClipboardCheck } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { ImplSecurityIntroduction } from './components/ImplSecurityIntroduction'
import { ImplSecurityExercises } from './components/ImplSecurityExercises'
import { TimingLeakInspector } from './workshop/TimingLeakInspector'
import { FoRejectionLab } from './workshop/FoRejectionLab'
import { MaskingCostExplorer } from './workshop/MaskingCostExplorer'
import { TvlaEvidenceScope } from './workshop/TvlaEvidenceScope'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'timing-leak-lab',
    title: 'Step 1: Timing Leak Inspector',
    description:
      'Compare vulnerable vs. constant-time ML-KEM and ML-DSA snippets covering KyberSlash division timing, rejection-sampling branches, early-exit memcmp, and cache indexing.',
    icon: Timer,
  },
  {
    id: 'fo-rejection-audit',
    title: 'Step 2: FO Implicit Rejection Lab',
    description:
      'Step through valid vs. 1-bit tampered ML-KEM.Decaps traces to verify constant-time K̄ = J(z || c) selection and expose broken error-oracle anti-patterns.',
    icon: ShieldAlert,
  },
  {
    id: 'masking-budget',
    title: 'Step 3: Masking & Fault Cost Explorer',
    description:
      'Explore illustrative order-of-magnitude cycle, RAM, and randomness trade-offs across masking orders and fault countermeasures for ML-KEM, ML-DSA, NTT, and Keccak.',
    icon: Cpu,
  },
  {
    id: 'tvla-evidence-scope',
    title: 'Step 4: TVLA & Certification Evidence Scope',
    description:
      'Scope TVLA, FIPS 140-3 non-invasive mitigation, and EUCC AVA_VAN.4/5 evidence using Yes/No/Unknown triage where unanswered items never mean low exposure.',
    icon: ClipboardCheck,
  },
]

export const PqcImplementationSecurityModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Identify and mitigate timing, cache, power/EM, and fault-injection side channels across ML-KEM, ML-DSA, and SLH-DSA, and scope verifiable TVLA, FIPS 140-3, and EUCC evaluation evidence."
    learn={(api) => <ImplSecurityIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <ImplSecurityExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <TimingLeakInspector key={`timing-${configKey}`} />
        case 1:
          return <FoRejectionLab key={`fo-${configKey}`} />
        case 2:
          return <MaskingCostExplorer key={`masking-${configKey}`} />
        case 3:
          return <TvlaEvidenceScope key={`tvla-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

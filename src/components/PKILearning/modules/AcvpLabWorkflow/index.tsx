// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { FileJson, ListChecks, Scale } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { AcvpLabIntroduction } from './components/AcvpLabIntroduction'
import { AcvpLabExercises } from './components/AcvpLabExercises'
import { ReviewStatusNotice } from './components/ReviewStatusNotice'
import { EvidenceClassifier } from './workshop/EvidenceClassifier'
import { VectorSetAnatomy } from './workshop/VectorSetAnatomy'
import { ResponseArtifactLab } from './workshop/ResponseArtifactLab'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'evidence-classifier',
    title: 'Step 1: Evidence Classifier',
    description:
      'Classify ten test-log observations into the eight evidence classes and see the highest claim each one permits.',
    icon: Scale,
  },
  {
    id: 'vector-set-anatomy',
    title: 'Step 2: Vector Set Anatomy',
    description:
      'Open a public NIST ACVP-Server sample vector set and predict, group by group, what standard PKCS#11 calls can answer. Step 3 then shows what the engines’ test-only inputs add.',
    icon: ListChecks,
  },
  {
    id: 'response-artifact-lab',
    title: 'Step 3: Response Artifact Lab',
    description:
      'Generate response.json and evidence.json on a real engine, compare with NIST’s expected results, and audit the evidence.',
    icon: FileJson,
  },
]

export const AcvpLabWorkflowModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="ACVP Lab Workflow: From Vector Set to Evidence"
    description="How algorithm validation testing runs end to end — and how to state a result at exactly the evidence level it reached."
    learn={(api) => <AcvpLabIntroduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
    exercises={(api) => (
      <AcvpLabExercises onOpenWorkshopStep={(step) => api.openWorkshopStep(step)} />
    )}
    workshopParts={PARTS}
    toolsIntro="Many of these products hold NIST CAVP algorithm validation certificates for algorithms such as ML-KEM and ML-DSA; each product's entry says whether a CAVP certificate is linked. They are products that were tested, not tools for running ACVP tests."
    renderWorkshopStep={(index, configKey) => {
      const body = (() => {
        switch (index) {
          case 0:
            return <EvidenceClassifier key={`classifier-${configKey}`} />
          case 1:
            return <VectorSetAnatomy key={`anatomy-${configKey}`} />
          case 2:
            return <ResponseArtifactLab key={`artifact-${configKey}`} />
          default:
            return null
        }
      })()
      return (
        <div className="space-y-4">
          <ReviewStatusNotice includeImportDisclaimer={index === 2} />
          {body}
        </div>
      )
    }}
  />
)

// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { FileJson, ListChecks, Scale } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { AcvpLabIntroduction } from './components/AcvpLabIntroduction'
import { AcvpLabExercises } from './components/AcvpLabExercises'
import { DraftStatusNotice } from './components/DraftStatusNotice'
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
      'Open a public NIST ACVP-Server sample vector set and predict, group by group, what a PKCS#11 interface can answer.',
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
    description="How algorithm validation testing runs end to end — and how to state a result at exactly the evidence level it reached. Draft awaiting validation-lab practitioner review."
    learn={(api) => <AcvpLabIntroduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
    exercises={(api) => (
      <AcvpLabExercises onOpenWorkshopStep={(step) => api.openWorkshopStep(step)} />
    )}
    workshopParts={PARTS}
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
          <DraftStatusNotice includeImportDisclaimer={index === 2} />
          {body}
        </div>
      )
    }}
  />
)

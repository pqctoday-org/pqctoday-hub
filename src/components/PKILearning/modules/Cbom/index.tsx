// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Layers, FileText, ShieldCheck, Fingerprint } from 'lucide-react'
import { CbomIntroduction } from './components/CbomIntroduction'
import { CbomExercises } from './components/CbomExercises'
import { SourceCoverageMapper } from './workshop/SourceCoverageMapper'
import { FormatChooser } from './workshop/FormatChooser'
import { CbomVerify } from './workshop/CbomVerify'
import { KeyCorrelator } from './workshop/KeyCorrelator'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'source-coverage-mapper',
    title: 'Step 1: Source Coverage Mapper',
    description: 'Reuse the tools you already run; find the discovery blind spots.',
    icon: Layers,
  },
  {
    id: 'format-chooser',
    title: 'Step 2: Format Chooser',
    description: 'CycloneDX vs SPDX — pick the right BOM format for a CBOM.',
    icon: FileText,
  },
  {
    id: 'cbom-verify',
    title: 'Step 3: Policy-as-Code Verify',
    description: 'Evaluate the inventory against a quantum-safe policy.',
    icon: ShieldCheck,
  },
  {
    id: 'key-correlator',
    title: 'Step 4: Key Correlator',
    description: 'Collapse four artifacts into one logical key by SPKI fingerprint.',
    icon: Fingerprint,
  },
]

export const CbomModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Cryptography Bill of Materials (CBOM)"
    description="Choose a format, discover all your cryptography — including the crypto nobody tracks — and make the inventory machine-verifiable."
    learn={(api) => <CbomIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <CbomExercises onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <SourceCoverageMapper key={`coverage-${configKey}`} />
        case 1:
          return <FormatChooser key={`format-${configKey}`} />
        case 2:
          return <CbomVerify key={`verify-${configKey}`} />
        case 3:
          return <KeyCorrelator key={`correlator-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

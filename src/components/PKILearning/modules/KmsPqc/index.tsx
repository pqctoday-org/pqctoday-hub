// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { KeyRound, Lock, Shuffle, CalendarClock, Globe, ArrowLeftRight } from 'lucide-react'
import { KmsPqcIntroduction } from './components/KmsPqcIntroduction'
import { KmsPqcExercises } from './components/KmsPqcExercises'
import { KeyHierarchyDesigner } from './workshop/KeyHierarchyDesigner'
import { EnvelopeEncryptionDemo } from './workshop/EnvelopeEncryptionDemo'
import { HybridKeyWrapping } from './workshop/HybridKeyWrapping'
import { KmsRotationPlanner } from './workshop/KmsRotationPlanner'
import { KmipProtocolExplorer } from './workshop/KmipProtocolExplorer'
import { KmsMigrationRunbook } from './workshop/KmsMigrationRunbook'
import { AwsKmsPolicyLab } from './workshop/AwsKmsPolicyLab'
import { CloudKmsKeyExchange } from './workshop/CloudKmsKeyExchange'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'key-hierarchy',
    title: 'Step 1: Key Hierarchy',
    description: 'Design a 3-level PQC key hierarchy with Root KEK, Zone KEK, and DEK.',
    icon: KeyRound,
  },
  {
    id: 'envelope-encryption',
    title: 'Step 2: Envelope Encryption',
    description: 'Compare ML-KEM envelope encryption vs classical RSA-OAEP key wrapping.',
    icon: Lock,
  },
  {
    id: 'hybrid-wrapping',
    title: 'Step 3: Hybrid Wrapping',
    description: 'Explore X25519+ML-KEM-768 hybrid combiners with per-provider API mapping.',
    icon: Shuffle,
  },
  {
    id: 'rotation-planner',
    title: 'Step 4: Rotation Planner',
    description:
      'Plan PQC key rotation with provider-specific strategies and compliance deadlines.',
    icon: CalendarClock,
  },
  {
    id: 'kmip-explorer',
    title: 'Step 5: KMIP Protocol',
    description:
      'Explore KMIP v3.0 operations, PQC key type mappings, and cross-provider key sync.',
    icon: Globe,
  },
  {
    id: 'aws-policy-lab',
    title: 'Step 6: AWS Policy Lab',
    description:
      'Check every CreateKey Allow path within this lab’s supported IAM sample fragment, and see why post-quantum TLS is a client setting.',
    icon: Lock,
  },
  {
    id: 'cloud-kms-exchange',
    title: 'Step 7: Cloud KMS Key Exchange',
    description:
      'Simulate importing a key into AWS KMS, Google Cloud KMS and Azure: the classical RSA flow next to the HPKE flow, on selectable PKCS#11 engines.',
    icon: ArrowLeftRight,
  },
]

export const KmsPqcModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Master PQC key management patterns: envelope encryption with ML-KEM, hybrid key wrapping, and cross-provider KMS strategies."
    learn={(api) => <KmsPqcIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <KmsPqcExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <KeyHierarchyDesigner key={`hierarchy-${configKey}`} />
        case 1:
          return <EnvelopeEncryptionDemo key={`envelope-${configKey}`} />
        case 2:
          return <HybridKeyWrapping key={`hybrid-${configKey}`} />
        case 3:
          return <KmsRotationPlanner key={`rotation-${configKey}`} />
        case 4:
          return (
            <>
              <KmipProtocolExplorer key={`kmip-${configKey}`} />
              <div className="mt-8">
                <KmsMigrationRunbook />
              </div>
            </>
          )
        case 5:
          return <AwsKmsPolicyLab key={`aws-${configKey}`} />
        case 6:
          return <CloudKmsKeyExchange key={`cloud-kms-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

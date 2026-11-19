// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { Layers, CloudCog, ShieldAlert, ClipboardCheck } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { CloudPqcIntroduction } from './components/CloudPqcIntroduction'
import { CloudPqcExercises } from './components/CloudPqcExercises'
import { CloudEstateMapper } from './workshop/CloudEstateMapper'
import { ProviderCapabilityMatrix } from './workshop/ProviderCapabilityMatrix'
import { EdgeTlsKmsPlanner } from './workshop/EdgeTlsKmsPlanner'
import { SaasBoundaryChecklist } from './workshop/SaasBoundaryChecklist'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'estate-mapper',
    title: 'Step 1: Cloud Estate Mapper',
    description:
      'Separate customer-controlled vs. provider-managed crypto surfaces and distinguish cloud services from protected assets.',
    icon: Layers,
  },
  {
    id: 'provider-capabilities',
    title: 'Step 2: Provider Capability Matrix',
    description:
      'Filter late-2026 AWS, Azure, and GCP PQC capabilities with regional caveats and exact production verification commands.',
    icon: CloudCog,
  },
  {
    id: 'edge-tls-kms-plan',
    title: 'Step 3: Edge TLS & KMS Cutover Lab',
    description:
      'Diagnose middlebox ClientHello truncation, edge-vs-origin TLS mismatch, RSA-only BYOK import, and FIPS 140-2 Historical cutover.',
    icon: ShieldAlert,
  },
  {
    id: 'saas-boundary-check',
    title: 'Step 4: SaaS Boundary Checklist',
    description:
      'Scope SaaS and multi-account PQC evidence using Yes/No/Unknown triage where unanswered items never mean low exposure.',
    icon: ClipboardCheck,
  },
]

export const CloudPqcModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Plan and verify post-quantum migration across AWS, Azure, GCP, and SaaS: shared-responsibility boundaries, hybrid edge/origin TLS, cloud KMS/BYOK constraints, and vendor evidence scoping."
    learn={(api) => <CloudPqcIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <CloudPqcExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <CloudEstateMapper key={`estate-${configKey}`} />
        case 1:
          return <ProviderCapabilityMatrix key={`provider-${configKey}`} />
        case 2:
          return <EdgeTlsKmsPlanner key={`cutover-${configKey}`} />
        case 3:
          return <SaasBoundaryChecklist key={`saas-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

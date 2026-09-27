// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import type { FC } from 'react'
import type { CertWorkshopStepProps } from '@/components/PKILearning/modules/CryptoProductCertification/data/types'
import { FipsLevelPlanner } from './FipsLevelPlanner'
import { PciEvidenceReview } from './PciEvidenceReview'

export const STEP_COMPONENTS: ReadonlyMap<string, FC<CertWorkshopStepProps>> = new Map<
  string,
  FC<CertWorkshopStepProps>
>([
  ['fips-level-planner', FipsLevelPlanner],
  ['pci-evidence-review', PciEvidenceReview],
])

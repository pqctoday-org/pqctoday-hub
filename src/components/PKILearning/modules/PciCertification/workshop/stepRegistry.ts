// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import type { FC } from 'react'
import type { CertWorkshopStepProps } from '@/components/PKILearning/modules/CryptoProductCertification/data/types'
import { PciEvidenceReview } from './PciEvidenceReview'

export const STEP_COMPONENTS: ReadonlyMap<string, FC<CertWorkshopStepProps>> = new Map<
  string,
  FC<CertWorkshopStepProps>
>([['pci-evidence-review', PciEvidenceReview]])

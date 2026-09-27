// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import type { FC } from 'react'
import type { CertWorkshopStepProps } from '@/components/PKILearning/modules/CryptoProductCertification/data/types'
import { CcClaimDecoder } from './CcClaimDecoder'
import { EidasTrace } from './EidasTrace'

export const STEP_COMPONENTS: ReadonlyMap<string, FC<CertWorkshopStepProps>> = new Map<
  string,
  FC<CertWorkshopStepProps>
>([
  ['cc-claim-decoder', CcClaimDecoder],
  ['eidas-trace', EidasTrace],
])

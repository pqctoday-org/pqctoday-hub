// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Workshop-step registry: manifest step id → the owner's step component
 * (build spec §4). index.tsx renders from this; the parity test pins that it
 * covers exactly the manifest's steps.
 */
import type { FC } from 'react'
import type { CertWorkshopStepProps } from '../data/types'
import { SchemeSelector } from './SchemeSelector'
import { BoundaryDrawer } from './BoundaryDrawer'
import { Capstone } from './Capstone'
import { ChangeAnalyzer } from './ChangeAnalyzer'
import { EvidenceExchange } from './EvidenceExchange'

export const STEP_COMPONENTS: ReadonlyMap<string, FC<CertWorkshopStepProps>> = new Map<
  string,
  FC<CertWorkshopStepProps>
>([
  ['scheme-selector', SchemeSelector],
  ['boundary-drawer', BoundaryDrawer],
  ['capstone', Capstone],
  ['change-analyzer', ChangeAnalyzer],
  ['evidence-exchange', EvidenceExchange],
])

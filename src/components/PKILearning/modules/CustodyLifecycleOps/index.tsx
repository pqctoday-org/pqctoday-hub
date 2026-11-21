// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import {
  RefreshCw,
  LifeBuoy,
  ScrollText,
  BellRing,
  ShieldCheck,
  DatabaseBackup,
  Trash2,
} from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { CustodyLifecycleIntroduction } from './components/CustodyLifecycleIntroduction'
import {
  CustodyLifecycleExercises,
  type CustodyLifecycleWorkshopConfig,
} from './components/CustodyLifecycleExercises'
import { RevokeOrRotateWorkshop } from './workshop/RevokeOrRotateWorkshop'
import { RecoveryInheritanceWorkshop } from './workshop/RecoveryInheritanceWorkshop'
import { CeremonyScriptReviewWorkshop } from './workshop/CeremonyScriptReviewWorkshop'
import { AlertTriageWorkshop } from './workshop/AlertTriageWorkshop'
import { AccessMatrixReviewWorkshop } from './workshop/AccessMatrixReviewWorkshop'
import { DrDrillWorkshop } from './workshop/DrDrillWorkshop'
import { DecommissionChecklistWorkshop } from './workshop/DecommissionChecklistWorkshop'

const PARTS: WorkshopPart[] = [
  {
    id: 'revoke-or-rotate',
    title: 'W9: Revoke or Rotate Matrix',
    description:
      'Classify twelve custody items — including an EOA hot wallet, Safe owner, MPC share, departed approver, token allowance, and EIP-7702 delegation — across revoke, rotate, reshare, and sweep.',
    icon: RefreshCw,
  },
  {
    id: 'recovery-and-inheritance-planner',
    title: 'W10: Recovery & Inheritance Planner',
    description:
      'Design recovery mechanisms, delays, guardian channels, and heir paths across three holder profiles and test them against five disruption events.',
    icon: LifeBuoy,
  },
  {
    id: 'ceremony-script-review',
    title: 'W12: Ceremony Script Review',
    description:
      'Audit a sample key-ceremony script to flag eight planted defects while respecting what CA/B Forum TLS BR §6.1.1.1 permits.',
    icon: ScrollText,
  },
  {
    id: 'alert-triage',
    title: 'W14: Custody Alert Triage',
    description:
      'Triage twelve replayed signing-path, HSM, governance, and on-chain events across pre-signing, mempool, and confirmed-chain finality stages.',
    icon: BellRing,
  },
  {
    id: 'access-matrix-review',
    title: 'W15: Access Matrix Review',
    description:
      'Audit a ten-role custody permission matrix on effective permissions to identify eight separation-of-duties and path-isolation conflicts.',
    icon: ShieldCheck,
  },
  {
    id: 'dr-drill',
    title: 'W16: Disaster Recovery Drill',
    description:
      'Select backup sources, restore ordering, quorum checks, and chain reconciliation across primary HSM site loss, MPC vendor outage, and poisoned backups.',
    icon: DatabaseBackup,
  },
  {
    id: 'decommission-checklist',
    title: 'W17: Decommission Checklist',
    description:
      'Order retirement steps and keep-vs-destroy decisions for a hot-wallet address, an end-of-life HSM model, and a departed approver’s MPC share.',
    icon: Trash2,
  },
]

export const CustodyLifecycleOpsModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="How digital-asset custody keys are created, guarded, watched, recovered, and retired in daily operation — DKG & refresh, rotation vs sweeps, recovery & inheritance, ceremonies, monitoring, access separation, backup & DR, and safe decommissioning."
    learn={(api) => (
      <CustodyLifecycleIntroduction onNavigateToWorkshop={(step) => api.goToWorkshop(step)} />
    )}
    exercises={(api) => (
      <CustodyLifecycleExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const preset = (config as CustodyLifecycleWorkshopConfig | undefined)?.preset
      switch (index) {
        case 0:
          return <RevokeOrRotateWorkshop key={`w9-${configKey}`} initialPreset={preset} />
        case 1:
          return <RecoveryInheritanceWorkshop key={`w10-${configKey}`} />
        case 2:
          return <CeremonyScriptReviewWorkshop key={`w12-${configKey}`} />
        case 3:
          return <AlertTriageWorkshop key={`w14-${configKey}`} initialPreset={preset} />
        case 4:
          return <AccessMatrixReviewWorkshop key={`w15-${configKey}`} />
        case 5:
          return <DrDrillWorkshop key={`w16-${configKey}`} initialPreset={preset} />
        case 6:
          return <DecommissionChecklistWorkshop key={`w17-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

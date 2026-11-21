// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { ShieldAlert, Route, KeyRound, Cpu } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { CustodyPqcIntroduction } from './components/CustodyPqcIntroduction'
import {
  CustodyPqcExercises,
  type CustodyPqcWorkshopConfig,
} from './components/CustodyPqcExercises'
import { QuantumLimitsCheckWorkshop } from './workshop/QuantumLimitsCheckWorkshop'
import { CustodyMigrationPlannerWorkshop } from './workshop/CustodyMigrationPlannerWorkshop'
import { ShamirSeedBackupWorkshop } from './workshop/ShamirSeedBackupWorkshop'
import { HwWalletClaimReaderWorkshop } from './workshop/HwWalletClaimReaderWorkshop'

const PARTS: WorkshopPart[] = [
  {
    id: 'quantum-limits-check',
    title: 'Step 1: Quantum Limits & HNDL Check',
    description:
      'Inspect what a CRQC breaks first in each custody combination (on-chain key, attestation chain, share transport, or HSM channel) and identify which party-to-party messages face harvest-now-decrypt-later exposure today.',
    icon: ShieldAlert,
  },
  {
    id: 'custody-migration-planner',
    title: 'Step 2: Custody Migration Planner',
    description:
      'Classify 15 custody components across platform-, account-, and chain-controlled clocks, assign phases 0–4, evaluate smart-account residual classical dependencies and recovery horizons, and export CSV or Markdown.',
    icon: Route,
  },
  {
    id: 'shamir-seed-backup',
    title: 'Step 3: Shamir Seed & Envelope Demo',
    description:
      'Run an interactive GF(256) secret-sharing demo separating ideal Shamir t-1 uniformity from SLIP-39 4-byte digest validation, and compare RSA/ECDH share wrapping against a hybrid KEM-DEM envelope.',
    icon: KeyRound,
  },
  {
    id: 'hw-wallet-claim-reader',
    title: 'Step 4: HW Wallet Claim Reader',
    description:
      'Sort hardware wallet product statements into the four architectural layers (device integrity, transaction signing, seed/derivation, host channel/display) and assign maturity labels.',
    icon: Cpu,
  },
]

export const CustodyPqcMigrationModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="What a quantum attacker changes for digital-asset custody and how to migrate — HSM/MPC/enclave quantum deltas, PQ threshold MPC research, SLIP-39 seed backups, hardware wallet claims, PQ smart accounts, and phased migration."
    learn={(api) => (
      <CustodyPqcIntroduction onNavigateToWorkshop={(step) => api.goToWorkshop(step)} />
    )}
    exercises={(api) => (
      <CustodyPqcExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const preset = (config as CustodyPqcWorkshopConfig | undefined)?.preset
      switch (index) {
        case 0:
          return <QuantumLimitsCheckWorkshop key={`w5-${configKey}`} initialPreset={preset} />
        case 1:
          return <CustodyMigrationPlannerWorkshop key={`w7-${configKey}`} initialPreset={preset} />
        case 2:
          return <ShamirSeedBackupWorkshop key={`w8-${configKey}`} />
        case 3:
          return <HwWalletClaimReaderWorkshop key={`w13-${configKey}`} initialPreset={preset} />
        default:
          return null
      }
    }}
  />
)

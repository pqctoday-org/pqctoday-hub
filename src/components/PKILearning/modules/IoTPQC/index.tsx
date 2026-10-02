// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Cpu, FileCode, Network, Link2, KeyRound, Radio } from 'lucide-react'
import { IoTPQCIntroduction } from './components/IoTPQCIntroduction'
import { IoTPQCExercises } from './components/IoTPQCExercises'
import {
  ConstrainedAlgorithmExplorer,
  type AlgorithmExplorerConfig,
} from './workshop/ConstrainedAlgorithmExplorer'
import {
  FirmwareSigningSimulator,
  type FirmwareSigningConfig,
} from './workshop/FirmwareSigningSimulator'
import {
  ConstrainedHandshakeVisualizer,
  type HandshakeConfig,
} from './workshop/ConstrainedHandshakeVisualizer'
import { CertChainAnalyzer, type CertChainConfig } from './workshop/CertChainAnalyzer'
import { FleetKeyManager } from './workshop/FleetKeyManager'
import { LpwanAirtimeSimulator, type LpwanConfig } from './workshop/LpwanAirtimeSimulator'
import type { FleetConfig } from './data/fleetTypes'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

// ids must equal manifest.workshopSteps[].id, in the same order (parity test)
const PARTS: WorkshopPart[] = [
  {
    id: 'constrained-algorithm',
    title: 'Step 1: Algorithm Explorer',
    description:
      'Check which KEMs and signatures fit each device class when the device verifies, signs or runs key establishment — with Cortex-M4 benchmark sources.',
    icon: Cpu,
  },
  {
    id: 'firmware-signing',
    title: 'Step 2: Firmware Signing',
    description:
      'Sign and verify a SUIT-style manifest for real with ML-DSA or LMS in the SoftHSM, and see the COSE envelope and CNSA 2.0 status.',
    icon: FileCode,
  },
  {
    id: 'constrained-handshake',
    title: 'Step 3: Constrained Handshake',
    description:
      'Compare DTLS 1.3 and EDHOC sizes, datagrams and 802.15.4 frames, and what PQC keys cost in BLE Mesh and Matter provisioning.',
    icon: Network,
  },
  {
    id: 'cert-chain',
    title: 'Step 4: Certificate Chain',
    description:
      'Size a chain with the issuer’s signature in each certificate, the root left out, and compare compression, C509, raw keys, MTC and resumption.',
    icon: Link2,
  },
  {
    id: 'fleet-key-manager',
    title: 'Step 5: Fleet Key Manager',
    description:
      'Plan a fleet-wide key rotation: per-cell network time against head-end HSM throughput, with known-answer tests for the primitives.',
    icon: KeyRound,
  },
  {
    id: 'lpwan-airtime',
    title: 'Step 6: LPWAN Airtime',
    description:
      'Deliver a signed firmware update over Wi-SUN, NB-IoT or LoRaWAN and see what the signature really costs next to the image and delivery mode.',
    icon: Radio,
  },
]

type StepConfig = Record<string, unknown> | undefined

export const IoTPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="PQC for constrained devices — algorithm fit by device class, firmware signing, constrained handshakes, certificate size, fleet keys and LPWAN airtime."
    learn={(api) => <IoTPQCIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <IoTPQCExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config?: StepConfig) => {
      const initial = config && (config as { step?: number }).step === index ? config : undefined
      switch (index) {
        case 0:
          return (
            <ConstrainedAlgorithmExplorer
              key={`constrained-${configKey}`}
              initial={initial as AlgorithmExplorerConfig | undefined}
            />
          )
        case 1:
          return (
            <FirmwareSigningSimulator
              key={`firmware-${configKey}`}
              initial={initial as FirmwareSigningConfig | undefined}
            />
          )
        case 2:
          return (
            <ConstrainedHandshakeVisualizer
              key={`handshake-${configKey}`}
              initial={initial as HandshakeConfig | undefined}
            />
          )
        case 3:
          return (
            <CertChainAnalyzer
              key={`cert-chain-${configKey}`}
              initial={initial as CertChainConfig | undefined}
            />
          )
        case 4:
          return (
            <FleetKeyManager
              key={`fleet-${configKey}`}
              initial={initial as Partial<FleetConfig> | undefined}
            />
          )
        case 5:
          return (
            <LpwanAirtimeSimulator
              key={`lpwan-${configKey}`}
              initial={initial as LpwanConfig | undefined}
            />
          )
        default:
          return null
      }
    }}
  />
)

// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Radio, Hash, Globe, Network, Server } from 'lucide-react'
import { QKDIntroduction } from './components/QKDIntroduction'
import { QKDExercises } from './components/QKDExercises'
import { BB84Simulator } from './workshop/BB84Simulator'
import { PostProcessingDemo } from './workshop/PostProcessingDemo'
import { DeploymentExplorer } from './workshop/DeploymentExplorer'
import { ProtocolIntegrationDemo } from './workshop/ProtocolIntegrationDemo'
import { HSMKeyDerivationDemo } from './workshop/HSMKeyDerivationDemo'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'bb84-simulator',
    title: 'Part 1: BB84 Protocol',
    description: 'Visual simulation of the BB84 quantum key distribution protocol.',
    icon: Radio,
  },
  {
    id: 'post-processing',
    title: 'Part 2: Post-Processing',
    description: 'Error correction, privacy amplification, and hybrid key derivation.',
    icon: Hash,
  },
  {
    id: 'deployment-explorer',
    title: 'Part 3: Global Deployments',
    description: 'Interactive explorer of worldwide QKD deployments and adoption trends.',
    icon: Globe,
  },
  {
    id: 'protocol-integration',
    title: 'Part 4: QKD + Classical Protocols',
    description: 'Integrate QKD keys into TLS 1.3, IKEv2, MACsec, and SSH nonce/PSK fields.',
    icon: Network,
  },
  {
    id: 'hsm-derivation',
    title: 'Part 5: HSM Key Derivation',
    description: 'Use QKD secret as NIST SP 800-108 key material inside an HSM (PKCS#11).',
    icon: Server,
  },
]

export const QKDModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Explore QKD fundamentals, BB84 protocol simulation, classical post-processing, and global deployment landscape."
    learn={(api) => <QKDIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <QKDExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.part, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const c = config as
        | {
            eveEnabled?: boolean
            numQubits?: number
            protocol?: 'tls' | 'ikev2' | 'macsec' | 'ssh'
          }
        | undefined
      switch (index) {
        case 0:
          return (
            <BB84Simulator
              key={`bb84-${configKey}`}
              initialEveEnabled={c?.eveEnabled}
              initialNumQubits={c?.numQubits}
            />
          )
        case 1:
          return <PostProcessingDemo key={`post-${configKey}`} />
        case 2:
          return <DeploymentExplorer key={`deploy-${configKey}`} />
        case 3:
          return (
            <ProtocolIntegrationDemo key={`protocol-${configKey}`} initialProtocol={c?.protocol} />
          )
        case 4:
          return <HSMKeyDerivationDemo key={`hsm-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

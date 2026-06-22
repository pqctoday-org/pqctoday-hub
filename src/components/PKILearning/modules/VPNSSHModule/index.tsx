// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Shield, Terminal, GitCompareArrows } from 'lucide-react'
import { VPNSSHIntroduction } from './components/VPNSSHIntroduction'
import { VPNSSHExercises, type SimulationConfig } from './components/VPNSSHExercises'
import { SSHConfigGenerator } from './components/SSHConfigGenerator'
import { IKEv2HandshakeSimulator } from './simulate/IKEv2HandshakeSimulator'
import { SSHKeyExchangeSimulator } from './simulate/SSHKeyExchangeSimulator'
import { ProtocolComparisonTable } from './simulate/ProtocolComparisonTable'
import type { IKEv2Mode } from './data/ikev2Constants'
import type { SSHKexAlgorithm } from './data/sshConstants'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'ikev2-handshake',
    title: 'Step 1: IKEv2 Handshake',
    description: 'Step through IKEv2 handshake in Classical, Hybrid, and Pure PQC modes.',
    icon: Shield,
  },
  {
    id: 'ssh-key-exchange',
    title: 'Step 2: SSH Key Exchange',
    description: 'Compare SSH KEX algorithms: curve25519, sntrup761, and mlkem768.',
    icon: Terminal,
  },
  {
    id: 'protocol-comparison',
    title: 'Step 3: Protocol Comparison',
    description: 'IKEv2 vs SSH vs WireGuard vs TLS 1.3 — sizes, RTTs, and features.',
    icon: GitCompareArrows,
  },
]

export const VPNSSHModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="VPN/IPsec & SSH PQC"
    description="Explore post-quantum key exchange in IKEv2, SSH, and WireGuard protocols."
    learn={(api) => <VPNSSHIntroduction onNavigateToSimulate={() => api.goToWorkshop()} />}
    exercises={(api) => (
      <>
        <VPNSSHExercises
          onNavigateToSimulate={() => api.goToWorkshop()}
          onSetSimulationConfig={(config: SimulationConfig) =>
            api.openWorkshopStep(config.step, {
              ikev2Mode: config.ikev2Mode,
              sshKex: config.sshKex,
            })
          }
        />
        <div className="mt-6">
          <SSHConfigGenerator />
        </div>
      </>
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      switch (index) {
        case 0:
          return (
            <IKEv2HandshakeSimulator
              key={`ikev2-${configKey}`}
              initialMode={config?.ikev2Mode as IKEv2Mode | undefined}
            />
          )
        case 1:
          return (
            <SSHKeyExchangeSimulator
              key={`ssh-${configKey}`}
              initialKex={config?.sshKex as SSHKexAlgorithm | undefined}
            />
          )
        case 2:
          return <ProtocolComparisonTable key={`compare-${configKey}`} />
        default:
          return null
      }
    }}
  />
)

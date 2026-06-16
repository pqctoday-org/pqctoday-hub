// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'vpn-ssh-pqc',
  lm_id: 'LM-009',
  title: 'VPN/IPsec & SSH',
  description:
    'IKEv2 and SSH key exchange with PQC: hybrid ML-KEM integration, WireGuard Rosenpass, and protocol size comparison.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 6,
  learnSections: [
    { id: 'ikev2', label: 'IKEv2 & IPsec with ML-KEM' },
    { id: 'ssh', label: 'SSH PQC Key Exchange (sntrup761, ML-KEM)' },
    { id: 'wireguard', label: 'WireGuard Rosenpass & Protocol Comparison' },
  ],
  workshopSteps: [
    { id: 'ikev2-handshake', label: 'IKEv2 Handshake' },
    { id: 'ssh-key-exchange', label: 'SSH Key Exchange' },
    { id: 'protocol-comparison', label: 'Protocol Comparison' },
  ],
  playgroundTool: 'vpn-sim',
  taxonomy: { algorithms: ['ML-KEM', 'ECDH'], standards: ['RFC 9442'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.VPNSSHModule })),
}

export default manifest

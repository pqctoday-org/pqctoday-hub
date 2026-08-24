// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'vpn-ssh-pqc',
  contentVersion: 2,
  lm_id: 'LM-009',
  title: 'VPN/IPsec & SSH',
  description:
    'IKEv2 and SSH key exchange with PQC: hybrid ML-KEM integration, WireGuard Rosenpass, and protocol size comparison.',
  whyThisMatters:
    "IKEv2 and SSH key exchange are two of the most widely deployed protocols on earth — hybrid ML-KEM support already exists in production tools like WireGuard's Rosenpass, making this one of the more immediately actionable PQC migrations.",
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 6,
  learnSections: [
    { id: 'ikev2', label: 'IKEv2 & IPsec ML-KEM' },
    { id: 'ssh', label: 'SSH PQC Key Exchange' },
    { id: 'wireguard', label: 'WireGuard Rosenpass' },
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

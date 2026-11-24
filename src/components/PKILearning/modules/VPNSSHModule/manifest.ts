// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'vpn-ssh-pqc',
  whyThisMatters:
    'IKEv2 and SSH key exchange are two of the most widely deployed protocols on earth — hybrid ML-KEM key exchange (mlkem768x25519-sha256) was added in OpenSSH 9.9 and made the default in OpenSSH 10.0, making this one of the more immediately actionable PQC migrations.',
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
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'ikev2-handshake',
    text: 'Choose a key exchange mode — Classical, Hybrid or Pure PQC — and an ML-KEM size, then press Start Daemon: a real IKEv2 exchange runs between initiator and responder, phase by phase in the diagram.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.VPNSSHModule })),
}

export default manifest

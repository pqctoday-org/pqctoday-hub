// SPDX-License-Identifier: GPL-3.0-only
export interface OpsExercise {
  title: string
  prompt: string
}

export const OPS_QUANTUM_EXERCISES: OpsExercise[] = [
  {
    title: 'Scenario: Kubernetes Certificate Migration',
    prompt:
      'Your Kubernetes cluster uses cert-manager with Let\u2019s Encrypt for 500 TLS certificates. ML-DSA certificates are 10x larger. Walk through the impact on: CRD storage, etcd size limits, cert-manager renewal performance, and ingress controller memory. Use the workshop tools to plan the migration.',
  },
  {
    title: 'Scenario: VPN Fleet Upgrade',
    prompt:
      'Your organization has 2,000 remote workers on IPsec VPN with ECDH key exchange. 30% of VPN concentrators are end-of-life. Design the phased upgrade: which devices first, hybrid vs. pure PQC, monitoring thresholds, and rollback procedures.',
  },
  {
    title: 'Scenario: Monitoring Threshold Recalibration',
    prompt:
      'After PQC migration, your TLS handshake latency increases from 5ms to 12ms. Your alerting threshold is 10ms. Recalibrate monitoring: which metrics need new baselines, how to distinguish PQC-normal from degraded performance, and what new alerts to add.',
  },
]

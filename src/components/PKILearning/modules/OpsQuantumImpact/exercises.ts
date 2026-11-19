// SPDX-License-Identifier: AGPL-3.0-only
import { MEASURED_HANDSHAKE_FACTS, formatBytes } from '../VPNSSHModule/data/measuredHandshakeFacts'
export interface OpsExercise {
  title: string
  prompt: string
  recommendedStep: number
  recommendedStepLabel: string
  decisionChecklist: string[]
}

export const OPS_QUANTUM_EXERCISES: OpsExercise[] = [
  {
    title: 'Scenario: Kubernetes Certificate Migration',
    prompt:
      'Your Kubernetes cluster uses cert-manager with Let\u2019s Encrypt for 500 TLS certificates. ML-DSA signatures and public keys are far larger than ECDSA ones (in GSMA PQ.04 Table 5, an ML-DSA-65 signature is 3,309 bytes against 64 bytes for ECDSA-256). Walk through the impact on: CRD storage, etcd size limits, cert-manager renewal performance, and ingress controller memory. Use the workshop tools to plan the migration.',
    recommendedStep: 2,
    recommendedStepLabel: 'Open Step 3: How to Act',
    decisionChecklist: [
      'Confirm whether your cert-manager version and CA backend actually support the target PQC key algorithm or Merkle Tree Certificate plan before scheduling cutover.',
      'Measure actual Secret/chain byte sizes, etcd object quotas, and ingress memory in a non-production cluster rather than relying on sample estimates.',
      'Verify renewal error alerts and rollback paths before shortening certificate validity windows.',
    ],
  },
  {
    title: 'Scenario: VPN Fleet Upgrade',
    prompt:
      'Your organization has 2,000 remote workers on IPsec VPN with ECDH key exchange. 30% of VPN concentrators are end-of-life. Design the phased upgrade: which devices first, hybrid vs. pure PQC, monitoring thresholds, and rollback procedures.',
    recommendedStep: 2,
    recommendedStepLabel: 'Open Step 3: How to Act',
    decisionChecklist: [
      'Separate end-of-life hardware replacement from firmware-upgradable gateways, prioritizing internet-facing concentrators protecting long-lived traffic.',
      'Test hybrid IKEv2 (RFC 9370 additional key exchange in IKE_INTERMEDIATE) with RFC 7383 fragmentation or TCP encapsulation (RFC 9329) across restricted-MTU links before production rollout.',
      'Define explicit canary metrics (tunnel setup failures, rekey drops, MTU fragmentation) and a timed rollback trigger per concentrator wave.',
    ],
  },
  {
    title: 'Scenario: Monitoring Threshold Recalibration',
    prompt: `Fictional example: your handshake alerts were tuned on classical TLS handshakes. After PQC migration they fire, because handshakes are larger (in the Hub's sample capture ${formatBytes(MEASURED_HANDSHAKE_FACTS.classical.totalBytes)} bytes for ${MEASURED_HANDSHAKE_FACTS.classical.label}, ${formatBytes(MEASURED_HANDSHAKE_FACTS.hybrid.totalBytes)} for ${MEASURED_HANDSHAKE_FACTS.hybrid.label} and ${formatBytes(MEASURED_HANDSHAKE_FACTS.pqc.totalBytes)} for ${MEASURED_HANDSHAKE_FACTS.pqc.label}; no handshake time was measured). Recalibrate monitoring: which metrics need new baselines, how to distinguish PQC-normal from degraded performance, and what new alerts to add.`,
    recommendedStep: 0,
    recommendedStepLabel: 'Open Step 1: Why It Matters',
    decisionChecklist: [
      'Collect the negotiated TLS key-exchange group separately from the cipher suite; TLS_AES_256_GCM_SHA384 alone cannot distinguish X25519MLKEM768 from X25519.',
      'Re-baseline handshake byte and latency percentiles from your own staged captures with your actual certificate chain and resumption mix.',
      'Alert on missing group telemetry as an observability gap rather than treating unobserved connections as compliant.',
    ],
  },
]

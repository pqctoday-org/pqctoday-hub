// SPDX-License-Identifier: AGPL-3.0-only
import { MEASURED_HANDSHAKE_FACTS, formatBytes } from '../VPNSSHModule/data/measuredHandshakeFacts'

export interface ArchExercise {
  title: string
  prompt: string
  recommendedStep: number
  recommendedStepLabel: string
  decisionFocus: string
  evidenceToVerify: string
}

export const ARCH_QUANTUM_EXERCISES: ArchExercise[] = [
  {
    title: 'Scenario: HSM Root of Trust Migration',
    prompt:
      'Your PKI hierarchy uses an RSA-4096 root CA on a FIPS 140-2 HSM (whose CMVP certificate moved to the Historical List in September 2026). The HSM vendor announces ML-DSA support on a FIPS 140-3 platform for Q3 2027. Design the migration path: How do you maintain chain of trust during the transition? What hybrid certificate strategy would you use? How do you handle cross-signed certificates?',
    recommendedStep: 2,
    recommendedStepLabel: 'Step 3: How to Act',
    decisionFocus:
      'Decide whether to stand up a parallel PQC root CA or cross-sign during the transition, and establish the hardware refresh trigger for FIPS 140-3 compliance.',
    evidenceToVerify:
      'Verify the target HSM CMVP certificate number and Security Policy (approved PQC algorithms vs. non-approved mode), PKCS#11 v3.2 mechanism support, and relying-party trust-store acceptance in a staging PKI.',
  },
  {
    title: 'Scenario: Microservice Mesh PQC Rollout',
    prompt:
      'Your architecture has 200 microservices using mutual TLS with ECDSA certificates. You need to migrate to hybrid TLS without service disruption. Design the phased rollout: which services first, how to handle mixed environments, and what monitoring to add.',
    recommendedStep: 4,
    recommendedStepLabel: 'Step 5: Strangler Fig',
    decisionFocus:
      'Sequence service-mesh ingress gateways and high-sensitivity east-west routes first, using a PQC API gateway to isolate legacy services that cannot upgrade immediately.',
    evidenceToVerify:
      'Capture negotiated TLS key-exchange groups (e.g., X25519MLKEM768) in mesh telemetry, verify fallback and retry behavior under packet fragmentation, and measure P99 handshake latency on representative staging traffic.',
  },
  {
    title: 'Scenario: IoT Certificate Size Constraint',
    prompt: `Fictional example: your IoT architecture uses 3-level cert chains on devices with a 16 KiB (16,384-byte) TLS buffer limit. In the Hub's measured capture the ML-DSA-65 Certificate message, with only a leaf and an intermediate, is ${formatBytes(MEASURED_HANDSHAKE_FACTS.pqc.certificateMessageBytes)} bytes (${formatBytes(MEASURED_HANDSHAKE_FACTS.classical.certificateMessageBytes)} bytes with RSA-2048), and a third level would add to it. Measure your own chain. Evaluate alternatives: Merkle Tree Certificates, SLH-DSA parameter trade-offs, or redesigning the chain depth. Use the workshop tools to document your analysis.`,
    recommendedStep: 3,
    recommendedStepLabel: 'Step 4: Architecture Readiness',
    decisionFocus:
      'Choose between flattening the chain depth, using ML-DSA-44 or compact certificate schemes (such as Merkle Tree Certificates), or offloading full-chain validation to an edge gateway.',
    evidenceToVerify:
      'Measure the exact DER-encoded chain size, OCSP stapling payload, and DTLS/TLS retransmit buffer usage on target device firmware rather than relying on sample estimates.',
  },
  {
    title: 'Scenario: Choosing Trust Hardware',
    prompt:
      'Your architecture needs keys rooted in hardware: a boot-time root of trust, long-term custody of signing keys, and keys released only to an attested workload. Open Step 6, Trust Hardware Selector, in the Workshop tab: compare the eight kinds in the grid, work through "Pick the right one" and "How they combine", then write down which kind you would use for each need and what you would ask each vendor to document.',
    recommendedStep: 5,
    recommendedStepLabel: 'Step 6: Trust Hardware Selector',
    decisionFocus:
      'Separate boot-time root of trust (TPM 2.0 / Caliptra), long-term signing custody (on-prem or cloud HSM), and attested key release (TEE + KMS/HSM release policy) instead of expecting one device to cover all three.',
    evidenceToVerify:
      'Distinguish shipping products with active CMVP certificates from specifications or roadmaps, and confirm attestation verification policies and firmware-update signing mechanisms with each vendor.',
  },
]

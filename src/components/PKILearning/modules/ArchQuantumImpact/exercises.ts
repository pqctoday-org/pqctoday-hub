// SPDX-License-Identifier: AGPL-3.0-only
import { MEASURED_HANDSHAKE_FACTS, formatBytes } from '../VPNSSHModule/data/measuredHandshakeFacts'

export interface ArchExercise {
  title: string
  prompt: string
}

export const ARCH_QUANTUM_EXERCISES: ArchExercise[] = [
  {
    title: 'Scenario: HSM Root of Trust Migration',
    prompt:
      'Your PKI hierarchy uses an RSA-4096 root CA on a FIPS 140-2 HSM. The HSM vendor announces ML-DSA support for Q3 2027. Design the migration path: How do you maintain chain of trust during the transition? What hybrid certificate strategy would you use? How do you handle cross-signed certificates?',
  },
  {
    title: 'Scenario: Microservice Mesh PQC Rollout',
    prompt:
      'Your architecture has 200 microservices using mutual TLS with ECDSA certificates. You need to migrate to hybrid TLS without service disruption. Design the phased rollout: which services first, how to handle mixed environments, and what monitoring to add.',
  },
  {
    title: 'Scenario: IoT Certificate Size Constraint',
    prompt: `Fictional example: your IoT architecture uses 3-level cert chains on devices with a 16 KiB (16,384-byte) TLS buffer limit. In the Hub's measured capture the ML-DSA-65 Certificate message, with only a leaf and an intermediate, is ${formatBytes(MEASURED_HANDSHAKE_FACTS.pqc.certificateMessageBytes)} bytes (${formatBytes(MEASURED_HANDSHAKE_FACTS.classical.certificateMessageBytes)} bytes with RSA-2048), and a third level would add to it. Measure your own chain. Evaluate alternatives: Merkle Tree Certificates, SLH-DSA parameter trade-offs, or redesigning the chain depth. Use the workshop tools to document your analysis.`,
  },
  {
    title: 'Scenario: Choosing Trust Hardware',
    prompt:
      'Your architecture needs keys rooted in hardware: a boot-time root of trust, long-term custody of signing keys, and keys released only to an attested workload. Open Step 6, Trust Hardware Selector, in the Workshop tab: compare the eight kinds in the grid, work through "Pick the right one" and "How they combine", then write down which kind you would use for each need and what you would ask each vendor to document.',
  },
]

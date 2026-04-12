// SPDX-License-Identifier: GPL-3.0-only
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
    prompt:
      'Your IoT architecture uses 3-level cert chains on devices with 16KB TLS buffer limits. ML-DSA-65 certificates would create 12KB chains. Evaluate alternatives: Merkle Tree Certificates, SLH-DSA parameter trade-offs, or redesigning the chain depth. Use the workshop tools to document your analysis.',
  },
]

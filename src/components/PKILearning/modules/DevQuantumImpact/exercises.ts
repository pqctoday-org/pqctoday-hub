// SPDX-License-Identifier: GPL-3.0-only
export interface DevExercise {
  title: string
  prompt: string
}

export const DEV_QUANTUM_EXERCISES: DevExercise[] = [
  {
    title: 'Scenario: JWT Signature Migration',
    prompt:
      'Your API uses ECDSA-P256 for JWT signing. Tokens are stored in cookies and URL parameters. ML-DSA-65 signatures are 3309 bytes vs. 64 bytes for ECDSA. Walk through the impact: cookie size limits, URL length limits, API gateway header limits. Use the workshop tools to assess your readiness and plan the migration.',
  },
  {
    title: 'Scenario: Crypto Library Upgrade',
    prompt:
      'Your Node.js application uses the crypto module with ECDH for key exchange. Node.js announces ML-KEM support in a future version. Map the code changes needed: key generation, key exchange, TLS configuration. Use the skills assessment to rate your current knowledge.',
  },
  {
    title: 'Scenario: Hybrid TLS Deployment',
    prompt:
      'Your microservice architecture has 50 services communicating over mutual TLS. You need to migrate to hybrid TLS (X25519MLKEM768) without breaking backward compatibility. Design the phased rollout using the action plan builder.',
  },
]

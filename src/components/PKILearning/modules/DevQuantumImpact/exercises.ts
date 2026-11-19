// SPDX-License-Identifier: AGPL-3.0-only
export interface DevExercise {
  title: string
  prompt: string
}

export const DEV_QUANTUM_EXERCISES: DevExercise[] = [
  {
    title: 'Scenario: JWT Signature Migration',
    prompt:
      'Your API uses ECDSA P-256 (64-byte raw signature) for JWT signing, with tokens stored in cookies and URL parameters. ML-DSA-65 signatures are 3,309 bytes (4,412 base64url chars before header/payload). Evaluate cookie 4 KiB limits, URL length caps, and API gateway header limits, and decide which tokens must move to opaque reference tokens or Authorization headers. Use the Token Size Analyzer and workshop checklists to plan verification in your own stack.',
  },
  {
    title: 'Scenario: Crypto Library Upgrade',
    prompt:
      'Your Node.js application uses node:crypto ECDH for key exchange. Upgrading to Node.js 24+ (built on OpenSSL 3.5+) exposes native ML-KEM and ML-DSA APIs (generateKeyPairSync, encapsulate, decapsulate). Map the required changes across key generation, KEM encapsulation/decapsulation (which differs from symmetric DH), TLS group configuration, and negative tests for decapsulation failure. Use the skills assessment and API Migration Decision Lab to plan your checks.',
  },
  {
    title: 'Scenario: Hybrid TLS Deployment',
    prompt:
      'Your microservice architecture has 50 services communicating over mutual TLS. You need to migrate to hybrid TLS (X25519MLKEM768, group ID 0x11EC) without breaking backward compatibility or hitting middlebox ClientHello fragmentation limits. Design the phased rollout, telemetry checks for negotiated group downgrade, and staging interoperability tests using the action plan builder.',
  },
]

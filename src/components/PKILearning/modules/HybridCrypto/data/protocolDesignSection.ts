// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const PROTOCOL_DESIGN_SECTION: SourcedSectionData = {
  id: 'protocol-design-principles',
  title: 'Principles for developing post-quantum cryptographic protocols',
  lead: 'This section introduces protocol design considerations for adapting cryptographic protocols for a quantum-capable threat landscape.',
  nice: [{ id: 'S0968', statement: 'Skill in developing cryptographic protocols' }],
  blocks: [
    {
      heading: 'Secure channel goals and the quantum shift',
      sentences: [
        {
          id: 'S0968-01',
          text: 'RFC 9846 states that a secure channel should provide server and optional client authentication, confidentiality so data sent after establishment is visible only to endpoints, and integrity so modifications are detected.',
          sourceId: 'RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1',
          edition: 'RFC 9846 — The Transport Layer Security (TLS) Protocol Version 1.3, 2026-07',
          locator: 'Section 1, Introduction',
        },
        {
          id: 'S0968-04',
          text: 'RFC 9846 requires application protocols using TLS to specify how TLS works with the application protocol, including how and when handshaking occurs and how identity verification is done.',
          sourceId: 'RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1',
          edition: 'RFC 9846 — The Transport Layer Security (TLS) Protocol Version 1.3, 2026-07',
          locator: 'Section 1, Introduction',
        },
        {
          id: 'S0968-05',
          text: 'ETSI TR 103 965 notes that against a quantum adversary, the security of some classically secure schemes is uncertain, while for others security holds but parameters need adjustment to keep the same level.',
          sourceId: 'ETSI-TR-103-965',
          edition: 'Impact of Quantum Computing on Cryptographic Security Proofs, 2024-10',
          locator: 'Clause 1, Scope, PDF page 7',
        },
      ],
    },
    {
      heading: 'Adapting protocols from Diffie-Hellman to KEMs',
      bridge: 'This section examines KEM-based designs and protocol adaptation.',
      sentences: [
        {
          id: 'S0968-10',
          text: 'ETSI TR 103 966 notes that some protocols designed for traditional Diffie-Hellman rely on functionality that may not hold for post-quantum or hybrid key encapsulation, so the protocol would need adaptation to a different mechanism.',
          sourceId: 'ETSI-TR-103-966',
          edition: 'Deployment Considerations for Hybrid Schemes, 2024-10',
          locator: 'Clause 6.3.1, Protocol, PDF page 17',
        },
        {
          id: 'S0968-08',
          text: 'The Internet-Draft "ML-KEM Security Considerations" notes that, unlike Diffie-Hellman, where both parties exchange public keys and can compute in parallel, a KEM produces a ciphertext derived from one party\'s public key and does not allow parallel computation.',
          sourceId: 'ML-KEM-Security-Considerations',
          edition: 'ML-KEM Security Considerations, 2026-05',
          locator: 'Section 1, Introduction',
        },
        {
          id: 'S0968-09',
          text: 'NIST SP 800-227 contrasts Diffie-Hellman, which can be viewed as generating a shared secret before a key-derivation step, with KEMs, which by definition output a key ready to use.',
          sourceId: 'NIST SP 800-227',
          edition: 'Recommendations for Key-Encapsulation Mechanisms, 2025-09',
          locator: 'Section 4.3, Post Processing of the Shared Secret Key, PDF page 27',
        },
      ],
    },
    {
      heading: 'Hybrid key exchange design and safety properties',
      bridge:
        'When protocols combine classical and post-quantum key encapsulation, combiner design and input handling become central concerns.',
      sentences: [
        {
          id: 'S0968-13',
          text: 'In the Internet-Draft "Hybrid PQ/T Key Encapsulation Mechanisms", the UniversalCombiner, a hybrid-KEM combiner, computes over shared secrets, ciphertexts, and encapsulation keys from both components, so the hybrid KEM is secure if either component is secure, with no further assumptions on the components.',
          sourceId: 'Hybrid-PQ-T-Key-Encapsulation-Mechanisms',
          edition: 'Hybrid PQ/T Key Encapsulation Mechanisms, 2026-07',
          locator: 'Section 5.1.3, Combiners',
        },
        {
          id: 'S0968-14',
          text: 'RFC 9954 recommends constant-length public keys, ciphertexts, and secrets, warning that variable-length secrets are dangerous because processing them with hash functions may introduce a timing side channel.',
          sourceId: 'RFC-9954-Hybrid-Key-Exchange-in-TLS-1-3',
          edition: 'RFC 9954 — Hybrid Key Exchange in TLS 1.3, 2026-07',
          locator: 'Section 6, Security Considerations',
        },
        {
          id: 'S0968-15',
          text: 'RFC 9954 requires KEMs used in its hybrid construction to be designed for security under public key reuse, noting that some IND-CPA-secure post-quantum KEMs without countermeasures are completely insecure under reuse.',
          sourceId: 'RFC-9954-Hybrid-Key-Exchange-in-TLS-1-3',
          edition: 'RFC 9954 — Hybrid Key Exchange in TLS 1.3, 2026-07',
          locator: 'Section 6, Security Considerations',
        },
      ],
    },
    {
      heading: 'Authentication binding and crypto agility',
      bridge:
        'Protocol design also extends to protecting handshake authentication and preparing implementations for future algorithm transitions.',
      sentences: [
        {
          id: 'S0968-18',
          text: 'The Internet-Draft "Preventing Key Reuse and Cross-Key Forgeries in Composite ML-DSA" says that reusing component keys or combining component signatures across keys can enable mix-and-match forgeries, and that binding both signatures to a hash of the exact composite public-key bytes prevents cross-key recombination.',
          sourceId: 'Preventing-Key-Reuse-and-Cross-Key-Forgeries-in-Composite-ML',
          edition: 'Preventing Key Reuse and Cross-Key Forgeries in Composite ML-DSA, 2026-07',
          locator: 'Section 1, Introduction',
        },
        {
          id: 'S0968-16',
          text: 'The IETF draft on IKEv2 downgrade prevention defines an IKEv2 extension, signalled by the IKE_SA_INIT_FULL_TRANSCRIPT_AUTH notification; when both peers support it, they directly authenticate both IKE_SA_INIT messages, and if at least one authentication key is uncompromised, any modification is detected.',
          sourceId: 'draft-ietf-ipsecme-ikev2-downgrade-prevention',
          edition:
            'Downgrade Prevention for the Internet Key Exchange Protocol Version 2 (IKEv2), 2026-05',
          locator: 'Section 5, Downgrade Attacks Prevention',
        },
        {
          id: 'S0968-19',
          text: 'NIST CSWP 39 states that crypto agility is achieved when a security protocol implementation can easily transition between cipher suites, and recommends modular implementations to easily accommodate new algorithms or cipher suites.',
          sourceId: 'NIST CSWP 39',
          edition: 'Considerations for Achieving Crypto Agility: Strategies and Practices, 2026-06',
          locator: 'Section 3, Crypto Agility for Security Protocols, PDF page 12',
        },
      ],
    },
  ],
}

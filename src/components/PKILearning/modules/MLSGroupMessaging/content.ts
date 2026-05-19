// SPDX-License-Identifier: GPL-3.0-only

export interface LearnChapter {
  id: string
  title: string
  body: string[]
}

export const LEARN_CHAPTERS: LearnChapter[] = [
  {
    id: 'what-is-mls',
    title: 'What MLS solves',
    body: [
      "Messaging Layer Security (RFC 9420, July 2023) is the IETF's answer to a question Signal's Double Ratchet can't scale to: how do you give a group of thousands of participants forward secrecy AND post-compromise security AND asynchronous key agreement, all at once, with sub-second key updates?",
      "Signal's pairwise ratchet hits an O(N²) ceiling around 100 members. MLS replaces that with a tree-based key encapsulation scheme — TreeKEM — that scales to thousands while keeping the same forward-secrecy guarantees.",
      'In practice: WhatsApp, Webex, AWS Wickr, and Cisco MLS-over-Webex all deploy or pilot MLS for federated group messaging. The protocol is also the foundation for upcoming PQ secure-messaging standards (draft-ietf-mls-pq-ciphersuites).',
    ],
  },
  {
    id: 'treekem',
    title: 'TreeKEM — the ratchet tree',
    body: [
      'Every member of an MLS group is a leaf of a left-balanced binary tree. Each internal node holds a key pair derived from the path of its descendants. A member knows the secret keys for every node on the path from their leaf to the root.',
      'When member i sends a Commit (add / remove / update operation), they refresh every node on their direct path with fresh HPKE keys and encrypt the new path secrets to the resolution of each node so the right subset of the group learns the new secrets.',
      "The root secret of the tree advances with every Commit — that's the group's next epoch secret. Application AEAD keys derive from that. Compromise one epoch's secret and nothing before or after it leaks (forward secrecy + post-compromise security).",
    ],
  },
  {
    id: 'key-schedule',
    title: 'Key schedule — from group secret to keys',
    body: [
      "The MLS key schedule (RFC 9420 §8.1) takes the new epoch's commit secret + transcript hash and runs them through a chain of HKDF-Extract / HKDF-Expand steps to derive: a join secret, encryption secret, authentication secret, exporter secret, and confirmation key.",
      'Each AEAD application message uses a per-member, per-generation key derived from the encryption secret via a per-leaf hash ratchet. Lose any one message key, and the rest are still safe.',
      'Cryptographically the schedule is RFC 9180-style HPKE labelled extract/expand. Every Extract is one HMAC; every Expand is iterated HMAC. In our PKCS#11 provider those HMACs all run inside the HSM.',
    ],
  },
  {
    id: 'ciphersuites',
    title: 'Ciphersuites — baseline, PQ, hybrid',
    body: [
      'MLS RFC 9420 defines seven baseline ciphersuites combining one of {DHKEM(X25519), DHKEM(P-256), DHKEM(X448), DHKEM(P-384), DHKEM(P-521)} × one of {HKDF-SHA256, HKDF-SHA384, HKDF-SHA512} × one of {AES-128-GCM, AES-256-GCM, ChaCha20-Poly1305} × Ed25519 / ECDSA-P-* / Ed448.',
      '`draft-ietf-mls-pq-ciphersuites-04` (WG Last Call, March 2026) registers PQ ciphersuites using ML-KEM-768 + ML-DSA-65 (and 87 for higher security levels) — replacing the DH-based KEM and the signature scheme atomically.',
      '`draft-ietf-mls-combiner-02` (expired, WGLC revival pending) specifies a hybrid combiner: run two parallel MLS sessions (one classical, one PQ) and XOR the application keys, so an attacker must break both to forge messages.',
    ],
  },
  {
    id: 'provider-architecture',
    title: 'How our HSM provider plugs into OpenMLS',
    body: [
      'OpenMLS — the only production-grade open-source MLS implementation in active use — talks to crypto through a single trait, `OpenMlsCrypto`. The trait has ~15 functions: hash, HMAC, HKDF extract/expand, AEAD seal/open, signature key generation, sign, verify, HPKE seal/open/setup/derive.',
      'Our `openmls_pqctoday_crypto` Rust crate (in `pqctoday-hsm/openmls-provider/`) implements that trait by routing each operation through PKCS#11 v3.2 against softhsmv3. Signature keys generate as token objects with `CKA_SENSITIVE=TRUE` and `CKA_EXTRACTABLE=FALSE`; what OpenMLS stores as the "private key" is an opaque `HsmKeyHandle` blob, not raw key material.',
      'HPKE for the X25519 + SHA-256 + AES-128-GCM suite runs end-to-end through the HSM: ECDH via `CKM_ECDH1_DERIVE`, HKDF via PKCS#11 HMAC, AEAD via `CKM_AES_GCM`. Wire-interop with `hpke-rs` (the reference) is verified in both directions by integration tests.',
    ],
  },
  {
    id: 'pq-roadmap',
    title: 'The road to PQ MLS',
    body: [
      'Two things have to converge for production PQ MLS: (1) the upstream OpenMLS workspace registers `draft-ietf-mls-pq-ciphersuites` in `openmls_traits::types::Ciphersuite`, and (2) our provider wires `CKM_ML_KEM_*` and `CKM_ML_DSA` through. softhsmv3 already implements both (FIPS 203 + FIPS 204), so the provider side is one match-arm extension once upstream lands the registry.',
      "A parallel path is the hybrid combiner: classical + PQ MLS sessions XOR'd together. This is the path most enterprise messaging vendors are watching, because it lets them ship MLS today and turn on PQ when their HSM fleet is ready, without re-keying.",
      'Status snapshot (May 2026): PQ ciphersuite drafts are in WG Last Call; the combiner draft expired and awaits revival. Three to six month timeline for stabilisation is realistic.',
    ],
  },
]

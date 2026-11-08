// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'mls-group-messaging',
  version: '1.0.0',
  lastReviewed: '2026-08-22',
  lastEdited: '2026-11-01',

  standards: [
    getStandard('RFC 9420'),
    getStandard('RFC 9180'),
    // Current revision (-07). The module's narratives, mlsData.ts and MLSIntroduction.tsx name
    // the same revision as this citation, which is what the accuracy checker opens.
    getStandard('draft-ietf-mls-pq-ciphersuites-07'),
    getStandard('draft-ietf-mls-combiner-02'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 5869'),
    getStandard('draft-ietf-mls-extensions-11'),
  ],

  algorithms: [
    getAlgorithm('X25519'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
  ],

  deadlines: [],

  narratives: {
    keyConcepts:
      'MLS (RFC 9420) provides asynchronous group key establishment with forward secrecy and post-compromise security for groups from two to thousands, using TreeKEM: every member is a leaf of a binary tree, and a Commit that carries a path refreshes the sender\'s direct path with fresh HPKE keys, advancing a shared epoch secret that the whole group derives its next application keys from. Recovery from a compromised member is conditional: it starts only when the group processes a Commit that replaces that member\'s leaf key with a fresh one the attacker never saw. `draft-ietf-mls-pq-ciphersuites` (-07, 1 November 2026; datatracker on 8 November 2026: IESG state "Publication Requested") registers eleven ML-KEM cipher suites, hybrid and pure, the first eight with traditional signatures and the last three with ML-DSA-44, ML-DSA-65 and ML-DSA-87; `draft-ietf-mls-combiner-02` specifies a hybrid path — run a traditional and a PQ MLS session in parallel and combine them by importing a secret exported from the PQ session as a Pre-Shared Key (PSK) into the traditional session.',
    workshopSummary:
      "TreeKEM Ratchet Tree Visualizer: watch a Commit refresh a sender's direct path and advance the group epoch secret. OpenMLS ↔ PKCS#11 Provider Architecture: see how `openmls_pqctoday_crypto` routes OpenMLS's ~15-function `OpenMlsCrypto` trait through PKCS#11 v3.2 against softhsmv3, with signature keys generated as non-extractable HSM token objects.",
  },
}

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
      "Messaging Layer Security (RFC 9420, July 2023) is the IETF's protocol for efficient asynchronous group key establishment, giving groups from two to thousands of participants forward secrecy AND post-compromise security.",
      'RFC 9420 describes the Double Ratchet as the common solution for two parties and sender keys as the common strategy for larger groups, where post-compromise security is difficult to achieve. MLS replaces both with a tree-based key encapsulation scheme — TreeKEM — that provides forward secrecy and post-compromise security for groups from two to thousands.',
      '',
    ],
  },
  {
    id: 'treekem',
    title: 'TreeKEM — the ratchet tree',
    body: [
      'Every member of an MLS group is a leaf of a left-balanced binary tree. Each internal node holds a key pair derived from the path of its descendants. A member knows the secret keys for every node on the path from their leaf to the root.',
      'When member i sends a Commit (add / remove / update operation), they refresh every node on their direct path with fresh HPKE keys and encrypt the new path secrets to the resolution of each node so the right subset of the group learns the new secrets.',
      "A Commit that carries a path derives a fresh commit secret from the root path secret and mixes it with the previous epoch's init secret to start the next epoch; application AEAD keys derive from that epoch's secrets (RFC 9420, section 12.4). A Commit that only adds members, injects a PSK or reinitialises may leave out the path; its commit secret is then the all-zero vector, so no fresh secret enters the key schedule.",
      "Forward secrecy needs members to delete old keys: removing past ratchet-tree private keys protects earlier epochs, and deleting each message key after use protects earlier messages (RFC 9420, section 16.6). Post-compromise security is conditional. Suppose an attacker copies Bob's leaf and tree keys at one moment. A message sent by anyone only steps a one-way hash ratchet and adds no fresh randomness. A Commit by another member encrypts its new path secrets to nodes whose private keys Bob, and so the attacker, still holds, so an attacker who sees the Commit can follow it. Recovery begins when the group processes a Commit that replaces Bob's leaf with a fresh key pair whose private key the attacker never saw: Bob's own Commit with a path, or another member's Commit that includes Bob's Update proposal (an Update proposal has no effect until it is committed).",
      "These guarantees model a one-time snapshot of a member's secrets. An attacker who keeps control of Bob's device, or who holds Bob's signature key, can keep reading the new secrets or can impersonate Bob: with the signature key the attacker can create LeafNodes and KeyPackages in Bob's name and, where the application allows external Commits, insert itself into the group. Groups can require a pre-shared key from joiners to raise that cost (RFC 9420, sections 16.5 and 12.4.3.2).",
    ],
  },
  {
    id: 'key-schedule',
    title: 'Key schedule — from group secret to keys',
    body: [
      "The MLS key schedule (RFC 9420) takes, among its inputs, the previous epoch's init secret, the current epoch's commit secret, and the current epoch's GroupContext object and runs them through a chain of Extract / Expand steps from the KDF to derive the encryption secret, exporter secret, and confirmation key.",
      'Each AEAD application message uses a per-member, per-generation key derived from the encryption secret via a per-leaf hash ratchet. Lose any one message key, and the rest are still safe.',
      'Cryptographically the schedule is RFC 9180-style HPKE labelled extract/expand. Every Extract is one HMAC; every Expand is iterated HMAC. In our PKCS#11 provider those HMACs all run inside the HSM.',
    ],
  },
  {
    id: 'ciphersuites',
    title: 'Ciphersuites — baseline, PQ, hybrid',
    body: [
      'MLS RFC 9420 registers seven fixed cipher suites (0x0001 to 0x0007), each pairing a specific DHKEM, KDF, AEAD, hash and signature scheme; MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519 is the mandatory-to-implement suite.',
      '`draft-ietf-mls-pq-ciphersuites-07` (1 November 2026) registers eleven ML-KEM cipher suites: hybrid (ML-KEM with X25519, P-256 or P-384) and pure ML-KEM. The first eight combine the KEM with a traditional signature algorithm; the last three also use post-quantum signatures (ML-DSA-44, ML-DSA-65 and ML-DSA-87).',
      '`draft-ietf-mls-combiner-02` (expired, WGLC revival pending) specifies a hybrid combiner: run two MLS sessions in parallel (one traditional, one PQ) and combine them by exporting a secret from the PQ session and importing it as a Pre-Shared Key (PSK) into the traditional session, to achieve amortized PQ confidentiality and authenticity. It is an architecture, not a single cipher suite: each session names its own cipher suite (a traditional one and a pure post-quantum one), and the combiner does not change how cipher suites compute group keys (section 8.1 of the draft).',
    ],
  },
  {
    id: 'provider-architecture',
    title: 'How our HSM provider plugs into OpenMLS',
    body: [
      'OpenMLS — the only production-grade open-source MLS implementation in active use — talks to crypto through a single trait, `OpenMlsCrypto`. The trait has ~15 functions: hash, HMAC, HKDF extract/expand, AEAD seal/open, signature key generation, sign, verify, HPKE seal/open/setup/derive.',
      'Our `openmls_pqctoday_crypto` Rust crate (in `pqctoday-hsm/openmls-provider/`) implements that trait by routing each operation through PKCS#11 v3.2 against softhsmv3. Signature keys generate as token objects with `CKA_SENSITIVE=TRUE` and `CKA_EXTRACTABLE=FALSE`; what OpenMLS stores as the "private key" is an opaque `HsmKeyHandle` blob, not raw key material, so raw private-key bytes are not returned to OpenMLS through this interface. In this sample the token is a software module loaded into the same process, so the key bytes still exist in that process\'s memory; a production HSM has to demonstrate tamper resistance, isolation from the host and assurance separately.',
      'HPKE for the X25519 + SHA-256 + AES-128-GCM suite runs end-to-end through the HSM: ECDH via `CKM_ECDH1_DERIVE`, HKDF via PKCS#11 HMAC, AEAD via `CKM_AES_GCM`. Wire-interop with `hpke-rs` (the reference) is verified in both directions by integration tests.',
    ],
  },
  {
    id: 'pq-roadmap',
    title: 'The road to PQ MLS',
    body: [
      'Two things have to converge for production PQ MLS: (1) the upstream OpenMLS workspace registers `draft-ietf-mls-pq-ciphersuites` in `openmls_traits::types::Ciphersuite`, and (2) our provider wires `CKM_ML_KEM_*` and `CKM_ML_DSA` through.',
      'A parallel path is the hybrid combiner: a traditional and a PQ MLS session run in parallel and combined through a PSK exported from the PQ session. This is the path most enterprise messaging vendors are watching, because it lets them ship MLS today and turn on PQ when their HSM fleet is ready, without re-keying.',
      'Status snapshot (8 November 2026, from the drafts\' datatracker pages): the PQ ciphersuite draft is an Active Internet-Draft at -07 (1 November 2026; the list of eleven suites is unchanged from -06) and its IESG state is "Publication Requested". The MLS extensions framework (`draft-ietf-mls-extensions`) is an active working-group draft at -11 (2 November 2026). As checked on 30 October 2026, the combiner draft (-02, 22 October 2025) is expired; its WG state is "Waiting for WG Chair Go-Ahead, Revised I-D Needed - Issue raised by WGLC". Check the datatracker pages for the current state.',
    ],
  },
]

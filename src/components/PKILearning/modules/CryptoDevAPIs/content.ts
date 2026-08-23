// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the CryptoDevAPIs module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'crypto-dev-apis',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-08-23',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // RFC 9846 (July 2026) is the current TLS 1.3 specification — its header reads
    // "Obsoletes: 5077, 5246, 6961, 7627, 8422, 8446", and the library row for 8446
    // already carried 9846 as its supersession pointer. Repointed 2026-08-22.
    // In-module prose still cites RFC 8446 sections where it discusses the original,
    // which stays accurate: TLS 1.3 the protocol is unchanged; the specification moved.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 186-5'),
    getStandard('FIPS 202'),
    getStandard('NIST SP 800-56A'),
    getStandard('PQClean'),
  ],

  algorithms: [
    getAlgorithm('Ed25519'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('HQC-128'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      'Intermediate-level module (120 min, 8 workshop steps) covering post-quantum cryptography integration across the major cryptographic APIs and programming language ecosystems — JCA/JCE, OpenSSL EVP, PKCS#11 v3.2, Windows CNG, and language-specific PQC libraries. Teaches developers how to migrate production cryptographic code to PQC without vendor lock-in, using crypto agility patterns.',
    keyConcepts:
      'JCA/JCE (Java Cryptography Architecture / Extension): Provider-based architecture — Security.addProvider() inserts pluggable crypto backends. Standard JDK 21+ does not include ML-KEM/ML-DSA; requires BouncyCastle 1.78+ as JCA provider (BC or BCFIPS). Key types: MLKEMPublicKey, MLDSAPrivateKey. Algorithm strings: "ML-KEM-768", "ML-DSA-65". Java 17 → 21 migration recommended before PQC addition.',
    workshopSummary:
      'APIArchitectureExplorer — Visualize the provider/plugin architecture of each API; compare abstraction layers; identify where PQC plugs in without application code changes. LanguageEcosystemComparator — Side-by-side code comparison for ML-KEM-768 key generation and ML-DSA-65 signing across C++, Rust, Zig, Java, Python, Go, and .NET; highlight import paths and API ergonomics differences.',
  },
}

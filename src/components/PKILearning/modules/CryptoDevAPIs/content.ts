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
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('RFC 8446'),
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

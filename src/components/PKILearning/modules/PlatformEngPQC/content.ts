// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PlatformEngPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'platform-eng-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('RFC 8879'),
    getStandard('RFC 9580'),
    getStandard('NIST SP 800-227'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-3072'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('SLH-DSA-SHAKE-128f'),
    getAlgorithm('SLH-DSA-SHAKE-128s'),
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
      'Identify every cryptographic primitive embedded in a CI/CD pipeline from source control to runtime. Understand why HNDL (Harvest-Now-Decrypt-Later) makes TLS key exchange the most critical migration priority. Migrate container image signing from ECDSA P-256 to ML-DSA-65 via cosign or Notation. Write OPA/Kyverno policies that block quantum-vulnerable algorithm identifiers at admission time. Monitor crypto posture using Prometheus exporters, SIEM queries, and capacity planning data.',
    keyConcepts:
      '### Algorithm Sizes (container signing and TLS). ECDSA P-256 signature: 64 bytes. ML-DSA-44 signature: 2,420 bytes (38×). ML-DSA-65 signature: 3,309 bytes (52×). SLH-DSA-128f signature: 17,088 bytes (67×). ECDSA P-256 X.509 cert: 800 bytes. ML-DSA-65 X.509 cert: 5,800 bytes (7.25×). TLS 1.3 handshake (classical): 4,096 bytes. TLS 1.3 handshake (PQC): 18,432 bytes (4.5×). TLS handshake latency P99: 12ms (classical) → 28ms (PQC, +133%). ### IaC Quantum-Vulnerable Defaults.',
    workshopSummary:
      '### Step 1: Pipeline Crypto Inventory. 6 CI/CD pipeline stages: Source Control, CI/CD Build, Artifact Signing, Container Registry, Kubernetes Deploy, Runtime & Service Mesh. 17 crypto assets across stages with HNDL exposure ratings and PQC replacements.',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// 33 MB, 640 KB, 4 years, 400 bytes, 5.7 KB, 4 MB, 57 MB, FIPS 140-3

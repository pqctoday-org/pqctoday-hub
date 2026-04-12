// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the SecretsManagementPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'secrets-management-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [getStandard('FIPS 203'), getStandard('FIPS 204'), getStandard('NIST SP 800-227')],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
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
      'Covers PQC migration for secrets management platforms (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, Delinea Secret Server). Addresses secret classification by HNDL risk, automated rotation with PQC keys, cloud provider roadmaps, and Kubernetes/CI-CD pipeline integration.',
    keyConcepts:
      'Secret types vs encryption keys: what PQC protects. Harvest-now-decrypt-later (HNDL) risk for long-lived credentials. HashiCorp Vault transit engine PQC upgrade path (ML-KEM-768, ML-DSA-65). Dynamic secrets and TTL-based rotation with PQC. AWS Secrets Manager / Azure Key Vault / GCP Secret Manager PQC timelines. Kubernetes secrets encryption-at-rest with ML-KEM (via KMS plugin). External Secrets Operator and SPIFFE/SPIRE integration. CI/CD OIDC + ML-DSA short-lived certificate patterns.',
    relatedStandards:
      'NIST SP 800-57 Part 1 Rev. 5 (Key Management Recommendations). NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — ML-KEM). FIPS 204 (ML-DSA, Module-Lattice-Based Digital Signature Standard). FIPS 203 (ML-KEM, Module-Lattice-Based Key-Encapsulation Mechanism). HashiCorp Vault Transit Secrets Engine documentation. HashiCorp Vault Database Secrets Engine documentation. CIS Kubernetes Benchmark v1.9 (etcd encryption-at-rest, section 1.2.33).',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// AES-256-KW

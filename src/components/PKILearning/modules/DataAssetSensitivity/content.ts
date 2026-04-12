// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the DataAssetSensitivity module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'data-asset-sensitivity',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 199'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-218'),
    getStandard('NIST SP 800-37'),
    getStandard('NIST SP 800-53'),
    getStandard('NIST SP 800-66'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-3072'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: 'NIST: deprecate RSA-2048 and 112-bit ECC',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547',
    },
    {
      label: 'NIST: disallow all classical public-key crypto',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547',
    },
  ],

  narratives: {
    overview:
      'Four-tier data sensitivity classification model (Low / Medium / High / Critical). Asset type taxonomy: data stores, key material, communications, credentials, code artifacts. HNDL (Harvest Now, Decrypt Later) risk windows — formula: CRQC arrival − retention years. Global data protection regulations: GDPR, HIPAA, PCI DSS, CCPA/CPRA, NIS2, DORA, FIPS 140-3, CNSA 2.0, NIST IR 8547, ISO 27001. Industry-specific compliance obligation mapping across 16 sectors.',
    workshopSummary:
      'Asset Inventory Builder — Create and classify organizational data assets with sensitivity tiers, asset types, retention periods, and HNDL risk indicators. Compliance Matrix — Map compliance mandates to assets by industry, filter by region (US Federal / EU / Industry-Specific / Global), track obligation urgency and earliest deadline. Risk Methodology Explorer — Apply all four methodologies (NIST RMF, ISO 27005, FAIR, DORA/NIS2) to selected assets; compare outputs in a unified summary table.',
    relatedStandards:
      'NIST SP 800-37 (Risk Management Framework). NIST SP 800-60 (Information Type Sensitivity). NIST SP 800-53 (Security Controls). FIPS 199 (Information Categorization). FIPS 200 (Minimum Security Requirements). ISO 27001 (Information Security Management). ISO 27005 (Information Security Risk Management). FAIR (Factor Analysis of Information Risk). DORA (Digital Operational Resilience Act — EU). NIS2 Directive (EU Network and Information Security). GDPR (EU General Data Protection Regulation).',
  },
}

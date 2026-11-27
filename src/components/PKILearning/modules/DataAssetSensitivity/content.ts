// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the DataAssetSensitivity module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import {
  CNSA_2022_PREFERRED_LABEL,
  CNSA_PHASE_OUT_LABEL,
} from '@/components/PKILearning/modules/PQCRiskManagement/data/cnsaLabels'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'data-asset-sensitivity',
  version: '1.0.2',
  lastReviewed: '2026-10-28',
  lastEdited: '2026-11-26',

  standards: [
    getStandard('FIPS 199'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-218'),
    getStandard('NIST SP 800-37'),
    getStandard('NIST SP 800-53'),
    getStandard('NIST SP 800-66'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    // REPOINTED 2026-08-23: was getStandard('FIPS-140-3'), which captured only the
    // CSRC landing page. FIPS-140-3-STANDARD is the same document's actual PDF and is
    // now the surviving row; the landing-page row is deprecated with superseded_by.
    getStandard('FIPS-140-3-STANDARD'),
    getStandard('NIST IR 8547'),
    getStandard('NSM-10'),
    // DECLARED 2026-08-23: this module labels a hashing mechanism it describes as conforming to FIPS 180-4
    // (the Secure Hash Standard) and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 180-4" against a row filed as FIPS-180-4.
    getStandard('FIPS-180-4'),
    // DECLARED 2026-08-23: this module names SP 800-57 Part 1 for key-management guidance. Cites REVISION 5, which is the
    // Final publication — Rev 6 exists in the catalogue but its own cover page reads
    // "Initial Public Draft" and cited nothing for it.
    getStandard('NIST-SP-800-57-Pt1-R5'),
    // DECLARED 2026-08-23: this module names "FIPS 200" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('FIPS-200-Minimum-Security-Requirements-for-Federal-Informati'),
    // DECLARED 2026-08-23: this module names "ISO/IEC 27001" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('ISO-IEC-27001-2022'),
    // DECLARED 2026-08-23: this module names "ISO/IEC 27005" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('ISO-IEC-27005-2022-Guidance-on-managing-information-security'),
    // DECLARED 2026-08-23: this module names "SP 800-60" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-60-Vol-1-Rev-1-Guide-for-Mapping-Types-of-Inform'),
    // DECLARED 2026-08-23: this module names "SP 800-82" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST SP 800-82 Rev. 3'),
    // round 9 wave 4 (2026-09-19): cited for the figures the accuracy record found unmapped
    getStandard('45-CFR-164-312-Technical-safeguards'), // m-data-asset-sensitivity: §164.312
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
      label: CNSA_2022_PREFERRED_LABEL,
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: CNSA_PHASE_OUT_LABEL, year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: 'NIST: deprecate RSA, ECC and DH (all key sizes, 112-bit security and up)',
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
      'Four-tier data sensitivity classification model (Low / Medium / High / Critical) that distinguishes business services (such as an archiving and retrieval service) from protected data assets (such as long-lived records). Asset type taxonomy: data stores, key material, communications, credentials, code artifacts. HNDL (Harvest Now, Decrypt Later) risk windows — formula: CRQC arrival − confidentiality years. Regulatory and standards context: GDPR, HIPAA, PCI DSS v4.0.1, CCPA/CPRA, NIS2 and DORA (cyber risk-management duties), EU PQC Roadmap v1.1, FIPS 140-3 (CMVP vs. ACVP), CNSA 2.0 FAQ v2.2 (US NSS), EO 14412 & OMB M-26-15 (US federal civilian + proposed FAR contractor rule), NIST IR 8547 (final, October 2026), and ISO/IEC 27001.',
    workshopSummary:
      'Step 1: Asset Inventory Builder — Catalog data assets with sensitivity tiers, asset types, retention and confidentiality periods, and HNDL risk indicators. Step 2: Classification Challenge — Classify 10 real-world scenarios using the four-tier model with immediate HNDL and framework feedback. Step 3: Sensitivity Conflict Resolver — Apply resolution rules when multiple frameworks disagree on a tier. Step 4: Sensitivity Scoring Engine — Configure composite scoring weights across four dimensions and inspect per-asset drivers. Step 5: PQC Migration Priority Map — Review ranked migration priorities, algorithm recommendations, compliance deadlines, and exportable Markdown.',
    relatedStandards:
      'NIST SP 800-37 (Risk Management Framework). NIST SP 800-60 (Information Type Sensitivity). NIST SP 800-53 (Security Controls). FIPS 199 (Information Categorization). FIPS 200 (Minimum Security Requirements). NIST IR 8547 (final, October 2026 — deprecate classical PKC after 2030, disallow after 2035). NSA CNSA 2.0 FAQ v2.2 (US National Security Systems). EO 14412 & OMB M-26-15 (US federal civilian agencies + directed FAR contractor rule). EU PQC Roadmap v1.1. ISO/IEC 27001 & ISO/IEC 27005. FAIR (Factor Analysis of Information Risk). DORA & NIS2 (EU cyber risk-management duties). GDPR (EU General Data Protection Regulation).',
  },
}

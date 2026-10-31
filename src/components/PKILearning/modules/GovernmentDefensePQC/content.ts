// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the GovernmentDefensePQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'government-defense-pqc',
  version: '1.0.0',
  lastReviewed: '2026-08-22',
  lastEdited: '2026-10-31',

  standards: [
    getStandard('NSA CNSA 2.0'),
    getStandard('NSA CNSA 2.0 FAQ'),
    getStandard('CNSSP 15'),
    getStandard('NSA CSfC PQC Guidance Addendum'),
    getStandard('RFC 8603'),
    getStandard('NIST SP 800-208'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('QCCPA-2022'),
    getStandard('OMB-M-23-02'),
    getStandard('OMB-M-26-15'),
    getStandard('EO-14306'),
    getStandard('EO-2026-06-22-Securing-the-Nation'),
    getStandard('CNSSP-11-IA-Product-Acquisition-Policy'),
    getStandard('NIAP-CCEVS-POLICY-33'),
    getStandard('CISA-PQC-CATEGORY-LIST-2026'),
    getStandard('CMMC-2.0-MODEL'),
    getStandard('NIST-SP-800-171-Rev-3-Protecting-Controlled-Unclassified-Inf'),
    getStandard('Common-Policy-X-509-Certificate-and-CRL-Profile'),
    getStandard('Federal-PKI-Common-Policy-X-509-Certificate-and-CRL-Profile'),
    getStandard('X-509-Certificate-Policy-for-the-U-S-Federal-PKI-Common-Poli'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('NIAP'),
    getStandard('NSM-10'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-384'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('RSA-3072'),
  ],

  deadlines: [
    // Real, dated, and stated in the October 2026 CNSA 2.0 FAQ (Ver 2.2) from
    // CNSSP 15 for National Security Systems — see cnsaData.ts CNSA_MILESTONES
    // for the full text. Federal civilian high value assets and high impact
    // systems have their own dates under Executive Order 14412 (mandateData.ts).
  ],

  narratives: {
    overview:
      'Advanced module on the federal post-quantum policy layer. Covers the CNSA 2.0 suite and what it replaces, the dated CNSSP 15 milestones (CNSA 2.0 algorithms required in all new NSS acquisitions from 1 January 2027, equipment that cannot support CNSA 2.0 phased out by 31 December 2030 unless an exception is granted, algorithms mandated by 31 December 2031, unless otherwise noted, to achieve full quantum resistance for NSS, and NSM-10’s 2035 goal, which NSA intends all NSS to meet well ahead of), the National Security System versus federal civilian distinction that decides which deadline applies (Executive Order 14412 sets 31 December 2030 for key establishment and 31 December 2031 for digital signatures on federal civilian high value assets and high impact systems), Federal PKI and its draft post-quantum certificate profile, and how the requirement propagates through procurement.',
    keyConcepts:
      'CNSA 2.0 replaces every public-key line of CNSA 1.0 (ML-KEM-1024 for key establishment, ML-DSA-87 for general signatures, LMS/XMSS per SP 800-208 for software and firmware signing, with ML-DSA-87 also approved for that use) while leaving AES-256 and SHA-384/512 essentially unchanged — the asymmetry that makes "replace all cryptography" the wrong budget model. NSA does not require hybrids for NSS and lists concrete objections, but does not prohibit them, which is widely misreported. The 2022 advisory and the October 2026 FAQ (Ver 2.2) name the same algorithms differently (CRYSTALS-Kyber vs ML-KEM-1024), so estate inventory tooling must search both vocabularies.',
    workshopSummary:
      'CNSA 1.0 → 2.0 Comparator — which suite lines are replaced and which survive, with NSA’s stated rationale per line. Federal Mandate Explorer — pick a system type and see the instruments that bind it, and whether it has a dated deadline at all. Federal PKI Profile Pair — the classical certificate profile beside the draft PQC profile, and why a draft is not contractually bindable.',
    relatedStandards:
      'CNSSP 15 carries the dates for National Security Systems; the QCCPA and OMB M-23-02 / M-26-15 carry inventory, reporting and migration-plan obligations for federal civilian systems, and Executive Order 14412 sets dated PQC deadlines for their high value assets and high impact systems (key establishment by 31 December 2030, digital signatures by 31 December 2031). NIST SP 800-171 Rev. 3 reaches nonfederal systems handling Controlled Unclassified Information (DoD’s CMMC briefing, cleared for open publication 21 January 2025, says CMMC assessments remain against Rev. 2 until DoD formally adopts Rev. 3 through rulemaking), and Executive Order 14412 directs a proposed FAR rule requiring covered contractors to comply with NIST FIPS, including all applicable FIPS incorporating PQC-compliant algorithms, by 31 December 2030. CNSSP 11 requires commercial IA and IA-enabled IT products bought for National Security Systems to comply with the NIAP program and, where applicable, the FIPS cryptographic validation programs, and NIAP Policy Letter #33 sets the timeline for post-quantum requirements in NIAP evaluations. The Federal PKI Common Policy certificate profile is in force and classical; a draft profile dated 21 April 2026 adds ML-DSA and ML-KEM for CITE testing, starting from v2.2 of the Common Policy profiles.',
  },
}

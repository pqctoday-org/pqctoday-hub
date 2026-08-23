// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the TrustServicesPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'trust-services-pqc',
  version: '1.0.0',
  lastReviewed: '2026-08-23',

  standards: [
    getStandard('ETSI-TS-119-312-V2-1-1-Electronic-Signatures-and-Trust-Infra'),
    getStandard('ETSI-EN-319-422-V1-1-1-Time-stamping-protocol-and-time-stamp'),
    getStandard('ETSI-EN-319-411'),
    getStandard('RFC-3161-Internet-X-509-Public-Key-Infrastructure-Time-Stamp'),
    getStandard('eIDAS-2-Regulation'),
    getStandard('EIDAS-REG-910-2014'),
    getStandard('CSC-API-v2-Spec'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('NSA CNSA 2.0'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('RSA-3072'),
  ],

  deadlines: [
    // The one dated item in this area is the replacement Technical
    // Specification for ETSI EN 319 422, targeted for 2027-05-31 after the
    // European Commission concluded in October 2025 that the standard needs
    // updating. It is a standards-body target, not a compliance deadline, and
    // is stated as such in the module.
  ],

  narratives: {
    overview:
      'Intermediate module on trust services and signature longevity — the part of the eIDAS world that has to plan in decades. Covers qualified versus advanced signatures, RFC 3161 timestamping as proof of existence, the five stages by which a signature degrades over 30 years, the ETSI cryptographic suites that gained post-quantum modes in June 2026, and why trust service provider conformity makes migration slow even once the algorithms are settled.',
    keyConcepts:
      'A qualified signature carries legal equivalence to a handwritten one, so the question becomes whether a court can establish it was valid when made — potentially decades later. RFC 3161 is algorithm-agnostic: the signing algorithm comes from the TSA certificate, not the protocol, so a TSA can migrate to ML-DSA without a protocol change. Long-term validation degrades in stages — certificate expiry (1–3y), revocation data ageing out (3–10y), algorithm weakening (5–20y), archival horizon (20y+) — each with a remedy that must be in place before the stage arrives. ETSI TS 119 312 V2.1.1 requires hybrid signatures to combine a classical and a post-quantum signature with both valid for acceptance, the opposite default to NSA CNSA 2.0 for National Security Systems.',
    workshopSummary:
      'Signature Longevity Calculator — pick a validity horizon and see which degradation stages apply, and when the existing archive must be re-timestamped. Standards Supersession Explorer — the same ETSI standard before and after PQC, with the superseded edition marked. Hybrid Suite Picker — TS 119 312 V2.1.1 Table 3.3 filtered by use case.',
    relatedStandards:
      'ETSI TS 119 312 V2.1.1 (June 2026) supersedes V1.5.1 (December 2024): the older edition names only RSA and ECDSA, the newer adds ML-DSA, SLH-DSA, LMS, XMSS and hybrid modes. V2.1.1 also records that ETSI TS 102 176-1 is withdrawn and superseded by TS 119 312. ETSI EN 319 422 V1.1.1 (2016) remains the current published timestamp profile and names no algorithm itself, deferring to TS 119 312; the European Commission concluded in October 2025 that it needs updating, with a replacement targeted for 31 May 2027.',
  },
}

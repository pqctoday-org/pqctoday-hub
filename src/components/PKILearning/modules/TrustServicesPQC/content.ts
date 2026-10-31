// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the TrustServicesPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'trust-services-pqc',
  version: '1.0.1',
  lastReviewed: '2026-08-22',
  lastEdited: '2026-10-31',

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
    // DECLARED 2026-08-23: this module names "RFC 5816" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-5816-ESSCertIDv2-Update-for-RFC-3161'),
    // Applies EN 319 422 V1.1.1 to qualified time-stamps and replaces its algorithm clauses
    getStandard('CIR-EU-2025-1929-Qualified-Electronic-Time-Stamps'),
    // round 9 wave 4c (2026-09-20): cited for the figures the accuracy record found unmapped
    getStandard('Electronic-Signatures-and-Infrastructures-ESI-Algorithms-and'), // m-trust-services-pqc: ETSI TS 102 176-1
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('RSA-3072'),
  ],

  deadlines: [
    // One dated item in this area, stated in the module text rather than listed
    // here: 2030-12-31, the end of the FIPS 140-3 level 3 route for the device
    // holding a qualified provider's CA key (CIR (EU) 2025/1943) or time-stamp
    // unit key (CIR (EU) 2025/1929); Common Criteria / EUCC at EAL 4 or higher
    // remains. That rule is about the provider's own key hardware, not the
    // signer's device. No replacement date for ETSI EN 319 422 is stated: no
    // cited document gives one.
  ],

  narratives: {
    overview:
      'Intermediate module on trust services and signature longevity — the part of the eIDAS world that has to plan in decades. Covers qualified versus advanced signatures, RFC 3161 timestamping as proof of existence, the five stages by which a signature degrades over 30 years, the ETSI cryptographic suites that gained post-quantum modes in June 2026, and why trust service provider conformity makes migration slow even once the algorithms are settled.',
    keyConcepts:
      'A qualified signature carries legal equivalence to a handwritten one, so the question becomes whether a court can establish it was valid when made — potentially decades later. RFC 3161 is algorithm-agnostic: the signing algorithm comes from the TSA certificate, not the protocol, so a TSA can migrate to ML-DSA without a protocol change. Long-term validation degrades in stages — certificate expiry (1–3y), revocation data ageing out (3–10y), algorithm weakening (5–20y), archival horizon (20y+) — each with a remedy that must be in place before the stage arrives. ETSI TS 119 312 V2.1.1 requires hybrid signatures to combine a classical and a post-quantum signature with both valid for acceptance, a different default from NSA CNSA 2.0, which does not require hybrid products for National Security Systems.',
    workshopSummary:
      'Signature Longevity Calculator — pick a validity horizon and see which degradation stages apply, and when the existing archive must be re-timestamped. Standards Supersession Explorer — the same ETSI standard before and after PQC, with the superseded edition marked. Hybrid Suite Picker — TS 119 312 V2.1.1 Table 3.3 filtered by use case.',
    relatedStandards:
      'ETSI TS 119 312 V2.1.1 (June 2026) supersedes V1.5.1 (December 2024): the older edition lists only classical signature algorithms (RSA-PKCS#1v1_5, RSA-PSS, DSA, EC-DSA, EC-SDSA-opt), the newer adds ML-DSA, SLH-DSA, LMS, XMSS and hybrid modes. V2.1.1 also records that ETSI TS 102 176-1 is withdrawn and superseded by TS 119 312. ETSI EN 319 422 V1.1.1 (2016) is the timestamp profile that Implementing Regulation (EU) 2025/1929 applies to qualified time-stamps. It names no algorithm itself and defers to TS 119 312, but the Regulation’s version of the standard replaces its algorithm clauses with clauses under which hash and time-stamp signature algorithms shall be compliant with the Agreed Cryptographic Mechanisms endorsed by the European Cybersecurity Certification Group. V2.1.1 says of itself that it is incomplete for the EU Digital Identity Wallet and some other trust services, with an update in preparation, and leaves post-quantum migration scheduling to a separate document under development. Regulations (EU) 2025/1943 (qualified certificates) and 2025/1929 (qualified time-stamps) accept FIPS 140-3 level 3 for the CA and time-stamp-unit key device of a provider only until 31 December 2030; Common Criteria or EUCC at EAL 4 or higher remains.',
  },
}

// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the StandardsBodies module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import {
  CNSA_2022_PREFERRED_LABEL,
  CNSA_PHASE_OUT_LABEL,
} from '@/components/PKILearning/modules/PQCRiskManagement/data/cnsaLabels'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'standards-bodies',
  version: '1.0.3',
  lastReviewed: '2026-10-28',
  lastEdited: '2026-11-18',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('Falcon-Spec-v12'),
    getStandard('NIST SP 800-227'),
    getStandard('RFC 9629'),
    getStandard('RFC 9814'),
    getStandard('RFC 9882'),
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    getStandard('RFC-10024'),
    getStandard('RFC-10073-Composite-ML-DSA-for-Use-in-X-509-Public-Key-Infra'),
    getStandard('RFC 10082'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('ANSSI PQC Follow-up Paper'),
    getStandard('ANSSI PQC Position Paper'),
    getStandard('BSI TR-02102-1'),
    getStandard('BSI TR-02102-2'),
    getStandard('BSI TR-02102-3'),
    getStandard('BSI TR-02102-4'),
    getStandard('ENISA PQC Guidelines'),
    getStandard('ETSI TR 103 619'),
    getStandard('ETSI TS 103 744'),
    getStandard('EUCC v2.0 ACM'),
    getStandard('CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme'),
    getStandard('ISO-IEC-18033-2-2006-Amd-2-2026-Information-technology-Secur'),
    getStandard('ISO/IEC 14888-4:2024'),
    getStandard('ISO/IEC 18033-2:2006'),
    getStandard('KpqC-Competition-Results'),
    getStandard('NIAP'),
    getStandard('NIST IR 8545'),
    getStandard('NIST IR 8547'),
    getStandard('NIST IR 8610'),
    getStandard('EO-2026-06-22-Securing-the-Nation'),
    getStandard('OMB-M-26-15'),
    getStandard('EU-NIS-CG-Roadmap-v1.1'),
    getStandard('NIST-FIPS140-3-IG-PQC'),
    getStandard('UK-NCSC-Migration-Timelines-2025'),
    getStandard('NSA CNSA 2.0'),
    getStandard('NSA CNSA 2.0 FAQ'),
    getStandard('NSA CSfC PQC Guidance Addendum'),
    // DECLARED 2026-08-23: this module names "ISO/IEC 15408" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('ISO-IEC-15408-1-2022-Evaluation-criteria-for-IT-security-Com'),
    // DECLARED 2026-08-23: this module names "ISO/IEC 20085" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('ISO-IEC-20085-1-2019-Test-tool-requirements-and-test-tool-ca'),
    // round 9 wave 4 (2026-09-19): cited for the figures the accuracy record found unmapped
    getStandard('3GPP-PQC-Study-2025'), // m-standards-bodies: TR 33.938
    getStandard('COMMON-CRITERIA'),
    getStandard('CCMC-011-CCRA-EUCC-Coexistence'),
  ],

  algorithms: [
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    {
      label: CNSA_2022_PREFERRED_LABEL,
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: CNSA_PHASE_OUT_LABEL, year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      "This module teaches learners how to distinguish between standards bodies (which define algorithms and protocols), certification bodies (which validate implementations), and compliance frameworks / regulatory agencies (which mandate usage). It covers 12 key organizations globally and regionally across a five-step workshop (~40 minutes) and directly connects to the app's /compliance and /migrate pages.",
    keyConcepts:
      'NIST vs CMVP: NIST writes the standard; CMVP validates cryptographic modules against it. ETSI TS vs ETSI TR: TS = normative ("shall"), TR = informational guidance. ANSSI\'s 2022 position paper describes phased hybridisation guidance, with hybridisation proposed for products claiming post-quantum assurance in Phase 2; it does not create a blanket regulated-perimeter mandate. Hash-based signatures (SLH-DSA, XMSS, LMS) are the exception to systematic hybridisation in ANSSI\'s guidance. CCRA vs EUCC: the CCRA is an international mutual-recognition arrangement, not a certification body; it recognises qualifying certificates issued by national certification bodies. EUCC is a separate EU scheme set up by Commission Implementing Regulation (EU) 2024/482, which applies Common Criteria under EU rules (certification bodies issue certificates, national authorities supervise, ENISA publishes). IETF vs NIST: NIST defines algorithms; IETF integrates them into Internet protocols. RFC 10024 defines TLS 1.3 hybrid key agreement groups; RFC 10073 defines composite ML-DSA signatures for X.509/PKIX; RFC 10082 defines composite ML-DSA signatures for CMS. These cover different layers and do not by themselves guarantee endpoint support or TLS deployment.',
    relatedStandards:
      "FIPS 206 (FN-DSA), cited above alongside NIST's other PQC signature standards, remains in development. NIST's current PQC standardization page does not list a published draft or final standard; check that project page for status rather than relying on an old expected-draft date.",
  },
}

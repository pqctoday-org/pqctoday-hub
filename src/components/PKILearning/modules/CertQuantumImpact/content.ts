// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the CertQuantumImpact module (cert-quantum-impact / LM-079).
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, EO_14412, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'cert-quantum-impact',
  version: '1.0.0',
  lastEdited: '2026-11-18',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('FIPS-140-3-STANDARD'),
    getStandard('NIST-FIPS140-3-IG-PQC'),
    getStandard('NIST-CMVP-140-2-to-140-3-Transition-Timeline'),
    getStandard('NIST-ACVP'),
    getStandard('NIST-CMVP-ESV-Program'),
    getStandard('NIST-SP-800-90B'),
    getStandard('NIST-SP-800-90C'),
    getStandard('NIST IR 8547'),
    getStandard('NSA CNSA 2.0'),
    getStandard('NSA CNSA 2.0 FAQ'),
    getStandard('EO-2026-06-22-Securing-the-Nation'),
    getStandard('OMB-M-26-15'),
    getStandard('CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme'),
    getStandard('EUCC v2.0 ACM'),
    getStandard('NIAP-CCEVS-POLICY-33'),
    getStandard('PCI-SSC-Blog-Publishes-PTS-HSM-v5-0'),
    getStandard('PCI-DSS-v4-0-1-Requirements-and-Testing-Procedures'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    {
      label: 'FIPS 140-2 certificates moved to CMVP Historical List',
      year: 2026,
      source: 'NIST CMVP',
    },
    {
      label: 'CNSA 2.0: new NSS acquisitions require CNSA 2.0 support',
      year: CNSA_2_0.networkingRequired,
      source: 'CNSA 2.0 FAQ v2.2',
    },
    {
      label: 'CNSA 2.0: NSS equipment without CNSA 2.0 support phased out',
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0 FAQ v2.2',
    },
    {
      label: 'CNSA 2.0: NSS algorithms mandated unless otherwise noted',
      year: CNSA_2_0.networkingExclusive,
      source: 'CNSA 2.0 FAQ v2.2',
    },
    {
      label: 'EO 14412: federal civilian key establishment on PQC',
      year: EO_14412.keyEstablishment ?? 2030,
      source: 'EO 14412',
    },
    {
      label: 'EO 14412: federal civilian digital signatures on PQC',
      year: EO_14412.digitalSignatures,
      source: 'EO 14412',
    },
    {
      label: 'NIST IR 8547: quantum-vulnerable public-key algorithms deprecated',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547',
    },
    {
      label: 'NIST IR 8547: quantum-vulnerable public-key algorithms disallowed',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547',
    },
  ],

  narratives: {
    overview:
      'The Certification Engineer Quantum Impact module equips CSTL lab testers, cryptographic module vendor engineers, and scheme reviewers with the decision framework needed to plan, scope, and verify post-quantum product certifications. It covers six validation-engineering impacts (FIPS 140-2 Historical transition and CMVP queue pressure, ACVP seed-driven AFT keyGen and CAST/PCT under IG 10.3.A, Entropy Source Validation under SP 800-90B/90C, EUCC and NIAP Policy #33 cut-offs, PCI PTS HSM v5.0 vs. PCI DSS v4.0.1 boundaries, and avoiding ACVP-vs.-CMVP claim conflation), a nine-criterion certification evidence-scope checklist, and a phased action plan.',
    keyConcepts:
      'Algorithm validation (ACVP/CAVP) is not module validation (CMVP) — an ACVP certificate proves only that an algorithm implementation passed automated test vectors on a specific OE, not that the surrounding cryptographic module satisfies FIPS 140-3 physical, firmware, SSP, or self-test requirements. Post-quantum schemes add seed-driven AFT keyGen vectors, pre-operational CASTs and conditional PCTs (IG 10.3.A), and mandatory ESV entropy certificates under SP 800-90B/90C. Multi-scheme products must map separate evidence boundaries across FIPS 140-3, EUCC (CIR (EU) 2024/482 and EUCC ACM v2), NIAP Policy #33, and PCI PTS HSM v5.0.',
    workshopSummary:
      'The workshop has 4 interactive steps: review six certification-engineering impact drivers; identify priority learning gaps across CMVP, ACVP, ESV, EUCC, and PCI; build a phased validation-readiness plan; and complete a nine-item Certification Evidence Scope checklist with Yes, No, or Unknown. Unanswered items are never treated as low exposure.',
    relatedStandards:
      'FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) — August 2024 NIST PQC standards. FIPS 140-3 and FIPS 140-3 Implementation Guidance (IG 10.3.A for CAST/PCT; CMVP FIPS 140-2 Historical List transition September 2026). NIST ACVP (Automated Cryptographic Validation Protocol) and CMVP ESV (Entropy Source Validation) backed by NIST SP 800-90B and NIST SP 800-90C (final, September 2025). NIST IR 8547 (final, October 2026 — 2030 deprecation, post-2035 disallowance). NSA CNSA 2.0 FAQ v2.2 (October 2026 — 2027/2030/2031 NSS milestones). EO 14412 (22 June 2026) and OMB M-26-15 (24 June 2026 — 2030 key establishment, 2031 signatures for federal civilian HVAs/high-impact systems). EUCC Commission Implementing Regulation (EU) 2024/482 and EUCC ACM v2. NIAP CCEVS Policy Letter #33 (CNSA 2.0 cut-offs). PCI PTS HSM v5.0 and PCI DSS v4.0.1.',
  },
}

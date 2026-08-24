// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the ComplianceStrategy module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, EO_14412, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'compliance-strategy',
  version: '1.0.1',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-08-23',
  // IR 8547 added 2026-08-22: relatedStandards asserts a date or version for it, so
  // nothing could check that deprecation-timeline claim without it being declared.

  standards: [
    getStandard('FIPS 203'),
    getStandard('NIST SP 800-227'),
    // The regulatory documents this module actually teaches. Cited here so the
    // accuracy spot-check grades its deadline claims against the orders and
    // advisories themselves rather than against two algorithm specifications.
    getStandard('NSA CNSA 2.0'),
    getStandard('NIST IR 8547'),
    getStandard('EO-2026-06-22-Securing-the-Nation'),
    getStandard('OMB-M-26-15'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('ETSI TR 103 619'),
    getStandard('ETSI TS 103 744'),
    getStandard('FIPS 199'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // REPOINTED 2026-08-23: was getStandard('FIPS-140-3'), which captured only the
    // CSRC landing page. FIPS-140-3-STANDARD is the same document's actual PDF and is
    // now the surviving row; the landing-page row is deprecated with superseded_by.
    getStandard('FIPS-140-3-STANDARD'),
    getStandard('NIST CSWP 39'),
    getStandard('NIST SP 800-30'),
    getStandard('NSA CNSA 2.0 FAQ'),
    getStandard('NSM-10'),
    // DECLARED 2026-08-23: this module names SP 800-131A for algorithm transition guidance and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match
    // the prose "SP 800-131A" against a row filed as NIST-SP-800-131A-Rev3.
    getStandard('NIST-SP-800-131A-Rev3'),
    // DECLARED 2026-08-23: this module names OMB M-23-02 as the source of the federal cryptographic-inventory duty and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match
    // the prose "OMB M-23-02" against a row filed as OMB-M-23-02.
    getStandard('OMB-M-23-02'),
    // DECLARED 2026-08-23: this module names SP 800-161 as the supply-chain risk framework and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match
    // the prose "SP 800-161" against a row filed as NIST-SP-800-161r1-upd1-Cybersecurity-Supply-Chain-Risk-Manag.
    getStandard('NIST-SP-800-161r1-upd1-Cybersecurity-Supply-Chain-Risk-Manag'),
    // DECLARED 2026-08-23: this module names SP 800-57 Part 1 for key-management guidance. Cites REVISION 5, which is the
    // Final publication — Rev 6 exists in the catalogue but its own cover page reads
    // "Initial Public Draft" and cited nothing for it.
    getStandard('NIST-SP-800-57-Pt1-R5'),
    // DECLARED 2026-08-23: this module names "EO 14028" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('EO-14028'),
    // DECLARED 2026-08-23: this module names "EO 14306" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('EO-14306'),
    // DECLARED 2026-08-23: this module names "SP 800-128" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-128-Guide-for-Security-Focused-Configuration-Man'),
    // DECLARED 2026-08-23: this module names "SP 800-60" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-60-Vol-1-Rev-1-Guide-for-Mapping-Types-of-Inform'),
    // DECLARED 2026-08-23: this module names "SP 800-90B" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-90B'),
  ],

  algorithms: [getAlgorithm('ML-DSA-87'), getAlgorithm('ML-KEM-1024')],

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
    {
      label: 'EO 14412: federal civilian key establishment on PQC',
      year: EO_14412.keyEstablishment,
      source: 'EO 14412',
    },
    {
      label: 'EO 14412: federal civilian digital signatures on PQC',
      year: EO_14412.digitalSignatures,
      source: 'EO 14412',
    },
  ],

  narratives: {
    overview:
      'The Compliance & Regulatory Strategy module teaches executives how to navigate the complex and evolving landscape of PQC compliance requirements across jurisdictions. It covers jurisdiction mapping to identify applicable frameworks and deadline conflicts, audit readiness checklisting with 30 evidence items across 6 categories (Cryptographic Inventory, Policy & Governance, Risk Assessment, Technical Controls, Vendor Management, Evidence & Documentation), and compliance timeline building that overlays organizational milestones on regulatory deadlines with gap analysis.',
    keyConcepts:
      'Major PQC Compliance Frameworks — CNSA 2.0 (NSA, US national security systems), EO 14412 (US federal civilian systems and covered contractors: key establishment by 31 Dec 2030, digital signatures by 31 Dec 2031, implemented via OMB M-26-15), NIST IR 8547 (US federal guidance, initial public draft Nov 2024, not yet finalized), ETSI (European standards), ANSSI (French national agency), BSI (German federal office). CNSA 2.0 Timeline — software/firmware signing preferred 2025, exclusive 2030; new networking equipment 2026; web, cloud, servers and operating systems by 2033; NSM-10 targets all remaining NSS quantum-resistant by 2035. Compliance-First vs.',
    workshopSummary:
      'The workshop has 3 interactive steps: Jurisdiction Mapper — select from 24 jurisdictions across 4 regions (North America, Europe, Asia Pacific, Middle East); see matching compliance frameworks, earliest deadlines, and automatically detected conflicts including China algorithm divergence and early-deadline countries; export as Markdown/CSV.',
    relatedStandards:
      'NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0). EO 14412 (Securing the Nation Against Advanced Cryptographic Attacks, signed 22 June 2026) and OMB M-26-15 (24 June 2026), the US federal civilian PQC mandate and its implementing guidance. NIST IR 8547 (Transition to Post-Quantum Cryptography Standards, initial public draft Nov 2024, not yet finalized). NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms, Sep 2025). ETSI TS 103 744 (Quantum-Safe Cryptography). ANSSI Technical Position on PQC (2022 initial, 2023 follow-up). BSI Technical Guideline TR-02102 (Cryptographic Mechanisms). NSM-10 (National Security Memorandum on Promoting U.S.',
  },
}

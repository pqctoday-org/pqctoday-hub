// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the TalkingAboutPQC module.
 *
 * Every date here is read from regulatoryTimelines.ts rather than retyped, so
 * this module cannot drift from the Timeline and the other role guides.
 * Status facts were checked 2026-10-01: FIPS 203/204/205 final (13 Aug 2024);
 * NIST IR 8547 still an Initial Public Draft (csrc.nist.gov/pubs/ir/8547/ipd);
 * FIPS 206 not yet published. ETSI is cited for its "quantum-safe" wording
 * (GR QSC 001; TS 103 774's library row is deprecated).
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, EO_14412, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'talking-about-pqc',
  lastReviewed: '2026-10-01',
  version: '1.0.0',
  // lastReviewed set by record_module_review.py: owner review, 1 Oct 2026,
  // clean (revisions.jsonl review_only entry). Never edit it by hand.
  lastEdited: '2026-10-02',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST IR 8547'),
    getStandard('NSA CNSA 2.0'),
    getStandard('EO-2026-06-22-Securing-the-Nation'),
    getStandard('OMB-M-26-15'),
    getStandard('FIPS-140-3-STANDARD'),
    getStandard('NIST-CMVP-MIP-List'),
    getStandard('NIST-CMVP-Validated-Modules'),
    getStandard('ETSI-GR-QSC-001'),
  ],

  algorithms: [],

  deadlines: [
    { label: 'FIPS 203, 204 and 205 published', year: 2024, source: 'NIST' },
    {
      label: 'US federal civilian key establishment (EO 14412)',
      year: EO_14412.keyEstablishment ?? 2030,
      source: 'EO 14412',
    },
    {
      label: 'CNSA 2.0 software signing and networking exclusive',
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
    {
      label: 'Proposed deprecation of quantum-vulnerable algorithms (draft)',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547 (draft)',
    },
    {
      label: 'Proposed disallowance of quantum-vulnerable algorithms (draft)',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547 (draft)',
    },
  ],

  narratives: {
    oneMinute:
      'Most online security relies on mathematics a large quantum computer could undo. No such computer exists yet, but data copied today could be read once one does. NIST published the replacements in August 2024 (FIPS 203, 204 and 205). The slow part now is fitting them into every product and system.',
    dates:
      'Every real date belongs to someone and applies to specific systems. CNSA 2.0 covers US National Security Systems; EO 14412 covers US federal civilian high-value and high-impact systems and their contractors; NIST IR 8547 is still a draft proposal. When a quantum computer will arrive is an estimate, and experts disagree.',
    certificates:
      'An algorithm test certificate (CAVP) says one implementation of one algorithm passed its tests. Being on the CMVP Modules In Process list means a module is being validated, not that it is. A FIPS 140-3 validation has a certificate number anyone can look up. Read what a certificate covers before its level.',
    words:
      'Avoid "quantum-proof" and "unbreakable": no cryptography is proven unbreakable. NIST approves algorithms, not products. Say which standard a product implements, from which version, and point to the evidence.',
  },
}

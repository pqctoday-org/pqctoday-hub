// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the StandardsBodies module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'standards-bodies',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('FIPS 206'),
    getStandard('NIST SP 800-227'),
    getStandard('RFC 9629'),
    getStandard('RFC 9814'),
    getStandard('RFC 9882'),
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
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      "Slug: standards-bodies. Difficulty: Intermediate. Estimated Time: 60 minutes. Track: Strategy. This module teaches learners how to distinguish between standards bodies (which _define_ algorithms and protocols), certification bodies (which _validate_ implementations), and compliance frameworks / regulatory agencies (which _mandate_ usage). It covers 12 key organizations globally and regionally, and directly connects to the app's /compliance and /migrate pages. ---",
    keyConcepts:
      'NIST vs CMVP: NIST wrote the standard; CMVP certifies implementations against it. ETSI TS vs ETSI TR: TS = normative ("shall"), TR = informational guidance. ANSSI\'s unique position: Requires hybrid PQC (classical + PQC) for sensitive systems; permits standalone SLH-DSA. CCRA vs EUCC: CCRA is the global 31-nation scheme; EUCC is the EU-specific harmonized adaptation managed by ENISA. IETF vs NIST: NIST defines algorithms; IETF integrates them into Internet protocols (TLS, CMS, SSH).',
  },
}

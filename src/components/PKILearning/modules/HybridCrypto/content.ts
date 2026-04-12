// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the Hybrid Cryptography module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, ANSSI_TIMELINE } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'hybrid-crypto',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 9794'), // Hybrid terminology
    getStandard('RFC 9881'), // ML-DSA OIDs in X.509
    getStandard('RFC-9909'), // SLH-DSA profile in X.509
    getStandard('RFC 9802'), // LMS/XMSS OIDs
    getStandard('NIST SP 800-227'), // KEM recommendations
    getStandard('draft-ietf-lamps-pq-composite-sigs-15'), // Composite ML-DSA
    getStandard('RFC-9763'), // Related Certificates
    getStandard('draft-bonnell-lamps-chameleon-certs-07'), // Chameleon Certificates
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('X25519'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    {
      label: 'NSA mandates PQC adoption for national security systems',
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
    {
      label: 'ANSSI migration plan target',
      year: ANSSI_TIMELINE.migrationPlanTarget,
      source: 'ANSSI',
    },
  ],

  narratives: {
    hybridRationale:
      'Hybrid cryptography solves the dilemma of PQC being newer (less cryptanalysis) while the HNDL threat is real now. If either the classical or PQC component is broken, the other still provides security.',
    anssiMandate:
      'ANSSI requires hybrid mode for all PQC deployments. Exception: hash-based signatures (SLH-DSA, LMS, XMSS) leveraging functions like SHA-3 may be used standalone due to their conservative security assumptions.',
    nistRecommendation:
      'NIST SP 800-227 recommends hybrid key exchange during the transition period to maintain backward compatibility while adding quantum resistance.',
    certFormatExplain:
      'Six certificate approaches exist for PQC X.509: Pure PQC (ML-DSA, RFC 9881), Pure PQC (SLH-DSA, RFC 9909), Composite (single OID, both-must-verify), Alt-Sig/Catalyst (PQC in extensions), Related Certificates (paired certs with binding hash, RFC 9763), and Chameleon (delta extension, draft-bonnell).',
    compositeSigSize: '3,381 bytes',
    altSigSize: '2,017 bytes',
  },
}

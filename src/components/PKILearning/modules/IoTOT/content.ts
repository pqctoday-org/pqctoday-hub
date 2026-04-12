// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the IoTOT module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'iot-ot-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 206'),
    getStandard('NIST SP 800-208'),
    getStandard('RFC 7228'),
    getStandard('RFC 7250'),
    getStandard('RFC 8446'),
    getStandard('RFC 8879'),
    getStandard('RFC 9019'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('FrodoKEM-640'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
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
    latencyWindow: '150 ms',
    mlDsa44Sig: '2,420 bytes',
    mlDsa44Chain: '18 KB',
    mtcProof: '125 bytes',
    hybridConstraint: '1.7 KB',
    ecdsaSigConstraint: '64 bytes',
    iecStandards: 'IEC 61850, IEC 62351, IEC 62351-8, IEC 61508',
    hybridKem: 'X25519MLKEM768',
  },
}

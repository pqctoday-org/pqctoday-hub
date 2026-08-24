// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the IoTOT module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'iot-ot-pqc',
  version: '1.0.0',
  lastReviewed: '2026-08-23',

  standards: [
    // RFC 7228 FIRST, ahead of the otherwise-alphabetical list. It defines the
    // Class 0-3 RAM and flash budgets that every sizing claim in this module is
    // measured against, so it belongs at the head of the References tab — and the
    // accuracy spot-check samples by even stride over this array, so declaration
    // order decides whether the module's own yardstick is ever opened. It was not,
    // on 2026-08-22, which is why "FrodoKEM-640 requires ~180 KB" came back with no
    // evidence at all rather than a contradiction. 14 documents against a 4-document
    // sample means no ordering makes them all visible; put the yardstick first.
    getStandard('RFC 7228'),
    getStandard('IEC 62443'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 206'),
    getStandard('NIST SP 800-208'),
    getStandard('NIST-SP-800-232'),
    getStandard('RFC 7250'),
    getStandard('RFC 8391'),
    // RFC 9846 (July 2026) is the current TLS 1.3 specification — its header reads
    // "Obsoletes: 5077, 5246, 6961, 7627, 8422, 8446", and the library row for 8446
    // already carried 9846 as its supersession pointer. Repointed 2026-08-22.
    // In-module prose still cites RFC 8446 sections where it discusses the original,
    // which stays accurate: TLS 1.3 the protocol is unchanged; the specification moved.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    getStandard('RFC 8554'),
    getStandard('RFC 8879'),
    getStandard('RFC 9019'),
    getStandard('RFC 9147'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('ETSI-TS-103-764-Rail-Telecommunications-RT-FRMCS-System-Arch'),
    getStandard('NSA CNSA 2.0'),
    getStandard('UNISIG-SUBSET-137-ERTMS-ETCS-On-line-Key-Management-FFFIS'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('FrodoKEM-640'),
    getAlgorithm('LMS-SHA256 (H20/W8)'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-3072'),
    getAlgorithm('X25519'),
    getAlgorithm('XMSS-SHA2_20'),
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
    mlDsa44Sig: '2,420 bytes',
    mlDsa44Chain: '16 KB',
    mtcProof: '300 bytes',
    ecdsaSigConstraint: '64 bytes',
    hybridKem: 'X25519MLKEM768',
  },
}

// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the HomomorphicEncryption module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'homomorphic-encryption',
  version: '1.3.0',
  lastEdited: '2026-10-17',

  // ORDER MATTERS (see ModuleContent.standards): the documents this module's own
  // claims come from go first. The FHE sections cite ISO/IEC 28033 for the scheme
  // list, the four libraries for the implementations table and the workshop
  // scenarios, and IACR ePrint 2025/075 for homomorphic AES over TFHE.
  standards: [
    getStandard('ISO-IEC-28033'),
    getStandard('tfhe-rs-v1.8.1'),
    getStandard('openfhe-v1.6.0'),
    getStandard('lattigo-v6.2.0'),
    getStandard('fhe-rs-v0.1.1'),
    getStandard('IACR-ePrint-2025-075'),
    getStandard('EPC-342-08-v16-0-1-Guidelines-on-Cryptographic-Algorithms-Us'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
  ],

  algorithms: [getAlgorithm('ML-KEM-768'), getAlgorithm('ML-DSA-65')],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    overview:
      'A general FHE path first explains the promise and limits, BFV/BGV/CKKS/TFHE scheme fit, noise, levels, precision, circuits, performance, parameters, quantum exposure, standards and implementations. An advanced path for developer, architect, researcher, certification-engineer and operations roles adds HSM custody, controlled decryption, key rotation, threshold operation and evidence boundaries. FHE protects plaintext from the evaluator but does not by itself provide result integrity or hide timing, traffic, access patterns, circuit shape, dimensions and implementation leakage.',
    workshopSummary:
      'The core concepts lab covers noise, bootstrapping, encoding, rounding and data-oblivious circuits. The advanced HSM custody lab then groups the existing single-custodian, threshold, transciphering, rotation and shared-decryption scenarios and shows what measured evidence supports.',
    relatedStandards:
      'ISO/IEC 28033 (fully homomorphic encryption; under development, not yet published). TFHE-rs, OpenFHE, Lattigo and fhe.rs as the open-source implementations the scenarios follow. IACR ePrint 2025/075 (AES execution over TFHE). FIPS 203 (ML-KEM-768) and FIPS 204 (ML-DSA-65) for the post-quantum signing and sealing of the key set and the seed backup.',
  },
}

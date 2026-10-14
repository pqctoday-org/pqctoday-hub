// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the HomomorphicEncryption module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'homomorphic-encryption',
  version: '1.2.0',
  lastEdited: '2026-10-14',

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
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
  ],

  algorithms: [getAlgorithm('ML-KEM-768'), getAlgorithm('ML-DSA-65')],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    overview:
      'Fully homomorphic encryption (FHE) in learning order: what it is and what "fully homomorphic" promises and does not (the contrast with TEEs; precision, speed, integrity and who sees results); the four ISO/IEC 28033 draft schemes, the data types each fits (CKKS fixed-point approximate, BFV/BGV and TFHE exact) and how to read noisy results; where FHE is used, ranked by evidence (production private lookups, peer-reviewed genomics, biometrics and AI inference, pilots); its cost (thousands of times or more) and how GPUs, FPGAs, purpose-built chips and algorithms reduce it, compared with TEEs, MPC, differential privacy and federated learning; the FHE key set and transciphering of AES data; FHE against the quantum threat; standards and compliance (no FHE in FIPS 140-3, CNSA 2.0 or Common Criteria; ISO/IEC 28033 not yet published; encryption is not anonymisation); the HSM as FHE key custodian, its decryption policy, the decryption-oracle limitation (whoever may ask the HSM to decrypt can recover the key) and threshold decryption; and the open-source implementations (TFHE-rs, OpenFHE, Lattigo, fhe.rs).',
    workshopSummary:
      'FHE + HSM Flows — step through eight scenarios: CKKS and TFHE single-HSM custody, OpenFHE and Lattigo threshold FHE, what fits in the HSM, Kreyvium transciphering, CKKS key rotation, and CKKS shared (2-of-2) decryption. Each step shows who holds which key and which data state, with a quantum overlay that marks the links a quantum computer breaks.',
    relatedStandards:
      'ISO/IEC 28033 (fully homomorphic encryption; parts 1 and 2 at DIS, parts 3 and 4 at FDIS, not yet published). TFHE-rs, OpenFHE, Lattigo and fhe.rs as the open-source implementations the scenarios follow. IACR ePrint 2025/075 (AES execution over TFHE). FIPS 203 (ML-KEM-768) and FIPS 204 (ML-DSA-65) for the post-quantum signing and sealing of the key set and the seed backup.',
  },
}

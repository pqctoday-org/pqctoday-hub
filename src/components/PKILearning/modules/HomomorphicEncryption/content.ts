// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the HomomorphicEncryption module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'homomorphic-encryption',
  version: '1.0.0',
  lastEdited: '2026-10-04',

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
      'Fully homomorphic encryption (FHE) as the data-in-use protection that trusts mathematics instead of hardware: the contrast with TEEs, the four ISO/IEC 28033 draft schemes (noise, bootstrapping, what each computes on), the FHE key set (one small secret key, many large public keys) and who runs each operation, how AES data enters FHE through transciphering, FHE against the quantum threat (lattice-based, no known quantum break; the parts around the scheme are usually still classical), the HSM as FHE key custodian (non-extractable seed, secret key derived inside the HSM, ML-DSA signature over the parameter set, decryption under policy, HSM-to-HSM backup), why an HSM must not be a raw decryption oracle, and the open-source implementations (TFHE-rs, OpenFHE, Lattigo, fhe.rs).',
    workshopSummary:
      'FHE + HSM Flows — step through six scenarios: CKKS and TFHE single-HSM custody, OpenFHE and Lattigo threshold FHE, what fits in the HSM, and Kreyvium transciphering. Each step shows who holds which key and which data state, with a quantum overlay that marks the links a quantum computer breaks.',
    relatedStandards:
      'ISO/IEC 28033 (fully homomorphic encryption; four schemes, drafts at the time of writing). TFHE-rs, OpenFHE, Lattigo and fhe.rs as the open-source implementations the scenarios follow. IACR ePrint 2025/075 (AES execution over TFHE). FIPS 203 (ML-KEM-768) and FIPS 204 (ML-DSA-65) for the post-quantum signing and sealing of the key set and the seed backup.',
  },
}

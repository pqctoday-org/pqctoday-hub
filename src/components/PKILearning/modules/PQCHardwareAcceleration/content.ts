// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PQCHardwareAcceleration module.
 * Measured figures live in data/measurements.ts (PQC Today's own runs);
 * third-party figures in data/cited.ts. Both are rendered with visible
 * provenance tags so the two are never mixed.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pqc-hw-acceleration',
  version: '1.0.0',
  // No lastReviewed yet — this new module's claims have not been independently
  // reviewed via record_module_review.py (moduleReviewHonesty.test.ts).
  lastEdited: '2026-09-27',

  standards: [
    getStandard('FIPS 202'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // CRYSTALS-Dilithium, TCHES 2018 — the reference-vs-AVX2 cycle counts cited in Learn.
    getStandard('IACR-2018-952'),
    // SPHINCS+ (CCS 2019) — parallel-hash (AVX2) implementation strategy.
    getStandard('IACR-2019-1086'),
  ],

  algorithms: [
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('SLH-DSA-SHAKE-128s'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
  ],

  deadlines: [
    // No regulatory deadlines in this module — it is about performance
    // engineering, not compliance timelines.
  ],

  narratives: {
    mldsaModulus: '8,380,417 (full 8-layer NTT)',
    mlkemModulus: '3,329 (7-layer NTT)',
    sha3_256RateCapacity: '1,088 / 512 bits',
    shake128RateCapacity: '1,344 / 256 bits',
    kv260MldsaFpgaGain: '+29.2% (404.45 → 522.50 sign/s, ML-DSA-65)',
    kv260SlhShake128sSign: '12.3 s shipped software → 69.0 ms FPGA',
    kv260Luts: '117,120',
    hashsigClock: '240 MHz (250 MHz missed by 0.010 ns)',
    cupqcHardware:
      'H100 (Hopper) for the published figures; supports compute capability 8.0–9.0 incl. Ampere and Jetson Orin (8.7)',
    imx95Npu: 'eIQ Neutron N3-1024S, 2.0 TOPS — evaluated and ruled out for PQC (desk analysis)',
  },
}

// SPDX-License-Identifier: AGPL-3.0-only
import { EVIDENCE_MANIFEST } from '@/data/fhe/fheEvidence'

/**
 * Evidence records the Learn text quotes measured numbers from (2026-10-10 and 2026-10-11). Each
 * id must exist in public/data/fhe-evidence/fhe-evidence.v1.json; a missing one fails the render.
 */
export const CKKS_EVIDENCE = {
  sizes: 'ckks-keyset-sizes-m5max-7de154b',
  macToken: 'ckks-stream-token-m4pro-7de154b',
  mx95: 'ckks-stream-mx95-mac-m5max-7de154b',
  mx95pro: 'ckks-stream-mx95pro-mac-m5max-7de154b',
  sweepMac: 'ckks-stream-chunk-sweep-m4pro-7de154b',
  sweepMx95: 'ckks-stream-chunk-sweep-mx95-7de154b',
  sweepMx95pro: 'ckks-stream-chunk-sweep-mx95pro-7de154b',
  gateF: 'ckks-gate-f-noise-m5max-7de154b',
  // 2026-10-11: cached generator on the boards, the second parameter set, rotation, references
  cachedMx95: 'ckks-stream-cached-mx95-3ec1f97',
  cachedMx95pro: 'ckks-stream-cached-mx95pro-6cores-3ec1f97',
  generatorCacheMx95: 'ckks-stream-generator-cache-mx95-6891773',
  metaBtsGateF: 'ckks-metabts2-gate-f-m5max-baf6237',
  metaBtsOwner: 'ckks-metabts2-owner-m5max-baf6237',
  metaBtsMx95: 'ckks-metabts2-stream-mx95-mac-m5max-f8663c9',
  metaBtsMx95pro: 'ckks-metabts2-stream-mx95pro-mac-m5max-f8663c9',
  // 2026-10-11, corrected flood width (LMSS22 Corollary 2); Mac, and the token on both boards
  metaBtsLmss: 'ckks-metabts2-lmss-gate-f-m5max-3bcdc05',
  metaBtsLmssDepth1: 'ckks-metabts2-lmss-depth1-m5max-3bcdc05',
  metaBtsLmssDepth3: 'ckks-metabts2-lmss-depth3-m5max-3bcdc05',
  defaultLmssId2: 'ckks-default-lmss-id2-m5max-3bcdc05',
  // registry ID 4 (the OpenFHE set): the token's export generated on the boards
  openfheSetMx95: 'ckks-openfhe-set-token-mx95-461f44ae',
  openfheSetMx95pro: 'ckks-openfhe-set-token-mx95pro-461f44ae',
  // the same set, OpenFHE's iterative bootstrapping (two rounds) on a Mac, 2026-10-15
  openfheIterative: 'ckks-openfhe-iterative-m5max-cc9d7bc',
  // the encrypted risk-scoring service on other machines, 2026-10-15
  scoringMx95pro: 'ckks-scoring-service-mx95pro-m5max-ed7b92e',
  scoringX86Vm: 'ckks-scoring-service-x86-vm-m5max-ed7b92e',
  // the same service with the token on the MX95 Pro reached over KMIP, 2026-10-16
  scoringX86VmKmip: 'ckks-scoring-service-x86-vm-mx95pro-kmip-5f0ff3d',
  // the same programs with the token on the boards
  metaBtsLmssMx95pro: 'ckks-metabts2-lmss-stream-mx95pro-mac-m5max-dc9ad8b',
  metaBtsLmssMx95: 'ckks-metabts2-lmss-stream-mx95-mac-m5max-dc9ad8b',
  rotation: 'ckks-rotation-key-m5max-ab8b1c3',
  openfhe: 'openfhe-ckks-reference-m5max-039034f',
  seal: 'seal-ckks-reference-m5max-039034f',
  tfheVectors: 'tfhe-rs-test-vectors-7361df1',
  // TFHE loan pre-qualification with the token on the MX95 Pro over KMIP, 2026-10-16
  tfheLoanKmip: 'tfhe-loan-prequal-x86-vm-mx95pro-kmip-354533b',
  threshold: 'ckks-threshold-2of2-lattigo-m5max-8beec58',
} as const

export type CkksEvidenceKey = keyof typeof CKKS_EVIDENCE

/** The record's first pinned file: what a reader opens to check a quoted number. */
export function ckksEvidenceUrl(key: CkksEvidenceKey): string {
  const id = CKKS_EVIDENCE[key]
  const record = EVIDENCE_MANIFEST.records.find((r) => r.id === id)
  if (!record) throw new Error(`[fheCkksEvidence] no evidence record "${id}"`)
  return record.artifacts[0].url
}

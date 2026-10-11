// SPDX-License-Identifier: GPL-3.0-only
import { EVIDENCE_MANIFEST } from '@/data/fhe/fheEvidence'

/**
 * Evidence records the Learn text quotes measured CKKS numbers from (2026-10-10). Each id must
 * exist in public/data/fhe-evidence/fhe-evidence.v1.json; a missing one fails the render.
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
} as const

export type CkksEvidenceKey = keyof typeof CKKS_EVIDENCE

/** The record's first pinned file: what a reader opens to check a quoted number. */
export function ckksEvidenceUrl(key: CkksEvidenceKey): string {
  const id = CKKS_EVIDENCE[key]
  const record = EVIDENCE_MANIFEST.records.find((r) => r.id === id)
  if (!record) throw new Error(`[fheCkksEvidence] no evidence record "${id}"`)
  return record.artifacts[0].url
}

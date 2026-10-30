// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Transition Planner (workshop step 3). Sizes come only from the algorithm registry
 * (`getAlgorithm`); they are raw public-key and signature bytes, with no certificate,
 * envelope, timestamp or log proof, and no total over an update.
 */
import { getAlgorithm } from '@/data/algorithmProperties'
import type { SourceClaimId } from './sourceClaims'

/** The algorithm a deployed verifier uses today in this planner. */
export const CURRENT_ALGORITHM = 'ECDSA P-256'

export interface NewAlgorithm {
  /** Registry id, exactly as `getAlgorithm` takes it */
  registryId: string
  label: string
  /** Sentences that name this algorithm or its parameter set */
  claims: SourceClaimId[]
}

export const NEW_ALGORITHMS: NewAlgorithm[] = [
  { registryId: 'ML-DSA-44', label: 'ML-DSA-44', claims: ['SC-2.11'] },
  { registryId: 'ML-DSA-65', label: 'ML-DSA-65', claims: ['SC-2.11'] },
  { registryId: 'ML-DSA-87', label: 'ML-DSA-87', claims: ['SC-5.3', 'SC-2.11'] },
  { registryId: 'SLH-DSA-SHA2-128s', label: 'SLH-DSA-SHA2-128s', claims: ['SC-2.11'] },
  {
    registryId: 'LMS-SHA256 (H20/W8)',
    label: 'LMS-SHA256 (H20/W8)',
    claims: ['SC-5.3', 'SC-2.11'],
  },
]

export type VerifierKind = 'rom' | 'updatable'

export const VERIFIERS: { id: VerifierKind; label: string; claims: SourceClaimId[] }[] = [
  { id: 'rom', label: 'Unchangeable (ROM)', claims: ['SC-5.1'] },
  { id: 'updatable', label: 'Updatable', claims: ['SC-2.5'] },
]

export type OptionKind = 'second-block' | 'composite' | 'replace'

export const OPTIONS: {
  id: OptionKind
  label: string
  claims: SourceClaimId[]
  summary: string
}[] = [
  {
    id: 'second-block',
    label: 'Second authentication block',
    claims: ['SC-2.5'],
    summary: 'Two signatures over the same digest, one with each algorithm.',
  },
  {
    id: 'composite',
    label: 'Composite signature',
    claims: ['SC-5.2a', 'SC-5.2b'],
    summary: 'One signature object that combines the current and the new algorithm.',
  },
  {
    id: 'replace',
    label: 'Replace the algorithm',
    claims: [],
    summary: 'The new algorithm replaces the current one at a key rollover.',
  },
]

export interface RawSize {
  label: string
  publicKeyBytes: number
  signatureBytes: number
}

export function rawSize(registryId: string): RawSize {
  const a = getAlgorithm(registryId)
  return {
    label: registryId,
    publicKeyBytes: a.publicKeyBytes ?? 0,
    signatureBytes: a.signatureOrCiphertextBytes ?? 0,
  }
}

/** The raw rows an option carries: the new algorithm alone, or the current one beside it. */
export function rawRows(option: OptionKind, newAlgorithm: string): RawSize[] {
  const next = rawSize(newAlgorithm)
  return option === 'replace' ? [next] : [rawSize(CURRENT_ALGORITHM), next]
}

/** Sum of the raw rows. For the composite option the draft's own encoding is not counted. */
export function rawSum(rows: RawSize[]): { publicKeyBytes: number; signatureBytes: number } {
  return rows.reduce(
    (acc, r) => ({
      publicKeyBytes: acc.publicKeyBytes + r.publicKeyBytes,
      signatureBytes: acc.signatureBytes + r.signatureBytes,
    }),
    { publicKeyBytes: 0, signatureBytes: 0 }
  )
}

// SPDX-License-Identifier: AGPL-3.0-only
export interface BatchVerificationResult {
  valid: boolean
  computedRoot: string
  rootMatches: boolean
  signatureState: 'valid' | 'failed' | 'unsigned' | 'unavailable' | 'error' | 'not-checked'
}

/** Hash consistency and signature authentication are distinct sample checks. */
export async function verifySampleBatch(
  computedRoot: string,
  currentSize: number,
  batch: { root: string; treeSize: number; signatureStatus: 'signed' | 'unsigned' } | null,
  verifySignature?: () => boolean | Promise<boolean>
): Promise<BatchVerificationResult> {
  const base = {
    valid: false,
    computedRoot,
    rootMatches: !!batch && computedRoot === batch.root && currentSize === batch.treeSize,
  }
  if (!base.rootMatches) return { ...base, signatureState: 'not-checked' }
  if (batch?.signatureStatus !== 'signed') return { ...base, signatureState: 'unsigned' }
  if (!verifySignature) return { ...base, signatureState: 'unavailable' }
  try {
    const valid = await verifySignature()
    return { ...base, valid, signatureState: valid ? 'valid' : 'failed' }
  } catch {
    return { ...base, signatureState: 'error' }
  }
}

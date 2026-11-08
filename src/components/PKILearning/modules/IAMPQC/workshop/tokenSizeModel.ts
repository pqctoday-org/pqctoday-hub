// SPDX-License-Identifier: AGPL-3.0-only
/** Length accounting only: does not sign a token or validate a JOSE profile. */
export function estimateCompactTokenSize(
  headerText: string,
  payloadText: string,
  signatureBytes: number | null | undefined
) {
  if (signatureBytes == null || !Number.isSafeInteger(signatureBytes) || signatureBytes < 0) {
    return null
  }
  const encodedLength = (bytes: number) =>
    Math.floor(bytes / 3) * 4 + (bytes % 3 === 0 ? 0 : (bytes % 3) + 1)
  const headerBytes = new TextEncoder().encode(headerText).length
  const payloadBytes = new TextEncoder().encode(payloadText).length
  const encodedHeaderBytes = encodedLength(headerBytes)
  const encodedPayloadBytes = encodedLength(payloadBytes)
  const encodedSignatureBytes = encodedLength(signatureBytes)
  const separatorBytes = 2
  const total = encodedHeaderBytes + encodedPayloadBytes + encodedSignatureBytes + separatorBytes
  if (!Number.isSafeInteger(total)) return null
  return {
    headerBytes,
    payloadBytes,
    signatureBytes,
    encodedHeaderBytes,
    encodedPayloadBytes,
    encodedSignatureBytes,
    separatorBytes,
    total,
  }
}

// SPDX-License-Identifier: AGPL-3.0-only
export interface TamperReceipt {
  algorithm: string
  operation: 'signature' | 'encapsulation'
  byteIndex: number
  before: number
  after: number
  baselineValid: boolean
  alteredAccepted: boolean
  restoredValid: boolean
  confirmationRejected?: boolean
}
export function mutateByte(bytes: Uint8Array, index: number): Uint8Array {
  if (!Number.isInteger(index) || index < 0 || index >= bytes.length)
    throw new Error('Choose an existing byte')
  const mutated = bytes.slice()
  mutated[index] ^= 1
  return mutated
}
/** A generated sample, separate from a caller's keys. No expected failure is hardcoded. */
export async function runTamperSample(
  operation: TamperReceipt['operation'],
  variant: number,
  index = 0
): Promise<TamperReceipt> {
  if (operation === 'signature') {
    const suites = await import('@noble/post-quantum/ml-dsa.js')
    const suite =
      variant === 44
        ? suites.ml_dsa44
        : variant === 65
          ? suites.ml_dsa65
          : variant === 87
            ? suites.ml_dsa87
            : null
    if (!suite) throw new Error('Unsupported ML-DSA parameter set')
    const { publicKey, secretKey } = suite.keygen()
    const message = new TextEncoder().encode('Fictional signed release manifest: revision 1')
    const signature = suite.sign(message, secretKey)
    const altered = mutateByte(signature, index)
    const baselineValid = suite.verify(signature, message, publicKey)
    if (!baselineValid) throw new Error('Valid control failed; no negative result is established')
    return {
      algorithm: `ML-DSA-${variant}`,
      operation,
      byteIndex: index,
      before: signature[index],
      after: altered[index],
      baselineValid,
      alteredAccepted: suite.verify(altered, message, publicKey),
      restoredValid: suite.verify(signature, message, publicKey),
    }
  }
  const suites = await import('@noble/post-quantum/ml-kem.js')
  const suite =
    variant === 512
      ? suites.ml_kem512
      : variant === 768
        ? suites.ml_kem768
        : variant === 1024
          ? suites.ml_kem1024
          : null
  if (!suite) throw new Error('Unsupported ML-KEM parameter set')
  const { publicKey, secretKey } = suite.keygen()
  const { cipherText, sharedSecret } = suite.encapsulate(publicKey)
  const altered = mutateByte(cipherText, index)
  const originalSecret = suite.decapsulate(cipherText, secretKey)
  const changedSecret = suite.decapsulate(altered, secretKey)
  const same = (a: Uint8Array, b: Uint8Array) =>
    a.length === b.length && a.every((byte, i) => byte === b[i])
  if (!same(sharedSecret, originalSecret)) throw new Error('Valid encapsulation control failed')
  const { gcm } = await import('@noble/ciphers/aes.js')
  // One message with a fresh random key per sample: no nonce/key reuse across runs.
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const message = new TextEncoder().encode('Fictional sample key confirmation')
  const encrypted = gcm(sharedSecret, nonce).encrypt(message)
  if (!same(gcm(originalSecret, nonce).decrypt(encrypted), message))
    throw new Error('Valid confirmation control failed')
  let confirmationRejected = false
  try {
    gcm(changedSecret, nonce).decrypt(encrypted)
  } catch {
    confirmationRejected = true
  }
  return {
    algorithm: `ML-KEM-${variant}`,
    operation,
    byteIndex: index,
    before: cipherText[index],
    after: altered[index],
    baselineValid: true,
    alteredAccepted: same(sharedSecret, changedSecret),
    restoredValid: same(sharedSecret, suite.decapsulate(cipherText, secretKey)),
    confirmationRejected,
  }
}

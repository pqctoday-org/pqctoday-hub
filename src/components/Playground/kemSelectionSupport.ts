// SPDX-License-Identifier: AGPL-3.0-only
import type { Key } from '@/types'
import type { ExecutionMode } from './contexts/SettingsContext'

const CLASSICAL_CANDIDATES = ['X25519', 'X448', 'P-256', 'P-384', 'P-521', 'DH-2048']

export const isClassicalKemAlgorithm = (algorithm: string): boolean =>
  CLASSICAL_CANDIDATES.includes(algorithm)

export const isPqcKemAlgorithm = (algorithm: string): boolean =>
  algorithm.startsWith('ML-KEM') ||
  algorithm.startsWith('HQC') ||
  algorithm.startsWith('FrodoKEM') ||
  algorithm.startsWith('Classic-McEliece')

export const isKemAlgorithm = (algorithm: string): boolean =>
  isClassicalKemAlgorithm(algorithm) || isPqcKemAlgorithm(algorithm)

/** Input/path availability only: this does not verify key bytes or an operation. */
export function classicalKemUnavailableReason(key: Key, role: 'public' | 'private'): string | null {
  if (!isClassicalKemAlgorithm(key.algorithm))
    return `Select a classical ${role} key for the secondary agreement component.`
  if (key.algorithm !== 'X25519' && key.algorithm !== 'P-256')
    return `${key.algorithm} is not implemented by this KEM sample's classical agreement adapter. Key generation or stored bytes do not establish operation compatibility. Use X25519 or P-256 here.`
  if (key.type !== role)
    return `This operation needs a ${role} key; the selected record has a different role.`
  // The stored-byte view and optional dataType hint do not import/convert keys.
  if (typeof CryptoKey === 'undefined' || !(key.data instanceof CryptoKey))
    return `This ${key.algorithm} record has no usable CryptoKey for this sample. Stored hex, Base64 or file bytes are not imported agreement keys.`
  if (key.data.type !== role)
    return `The selected ${key.algorithm} CryptoKey has the wrong public/private role for this operation.`
  const actual = key.data.algorithm
  if (
    (key.algorithm === 'X25519' && actual?.name !== 'X25519') ||
    (key.algorithm === 'P-256' &&
      (actual?.name !== 'ECDH' || (actual as EcKeyAlgorithm).namedCurve !== 'P-256'))
  )
    return `The selected record's CryptoKey algorithm does not match its ${key.algorithm} agreement label.`
  // No public-key usages or extractability requirement: the existing path does
  // not derive with/export the recipient public key or export its private key.
  if (role === 'private' && !key.data.usages?.includes('deriveBits'))
    return `The selected ${key.algorithm} private CryptoKey does not allow the deriveBits operation used by this sample.`
  return null
}

export function kemSelectionUnavailableReason({
  keyStore,
  primaryId,
  secondaryId,
  operation,
  isHybridMode,
  executionMode,
  wasmLoaded,
}: {
  keyStore: readonly Key[]
  primaryId: string
  secondaryId: string
  operation: 'encapsulate' | 'decapsulate'
  isHybridMode: boolean
  executionMode: ExecutionMode
  wasmLoaded: boolean
}): string | null {
  const role = operation === 'encapsulate' ? 'public' : 'private'
  const primary = keyStore.find((key) => key.id === primaryId)
  if (!primary)
    return primaryId
      ? `The selected ${role} key is no longer available. Pick a key from the Key Store.`
      : `Select a ${role} key to continue.`
  if (primary.type !== role)
    return `Select a ${role} key for this operation; the current record has a different role.`

  if (isHybridMode) {
    // Do not let a retained solo classical selection bypass the hybrid path.
    if (!isPqcKemAlgorithm(primary.algorithm))
      return `Hybrid Mode needs a PQC ${role} key as primary. Select that key explicitly; a classical-only operation will not be substituted.`
    const secondary = keyStore.find((key) => key.id === secondaryId)
    if (!secondary)
      return secondaryId
        ? `The selected secondary ${role} key is no longer available. Pick a classical key.`
        : `Select the secondary classical ${role} key to continue.`
    const reason = classicalKemUnavailableReason(secondary, role)
    if (reason) return reason
    if (!(primary.data instanceof Uint8Array))
      return `The primary PQC ${role} key needs the byte material used by this hybrid sample; a mock/value-only record is not enough.`
    // Preserve the existing asymmetry: only hybrid encapsulation has this gate.
    // Decapsulation already uses the lazy PQC factory with retained byte keys.
    if (operation === 'encapsulate' && !wasmLoaded)
      return 'The workbench library-load gate must complete before hybrid encapsulation.'
    return null
  }

  // Classical WebCrypto operations precede the wasm/mock branch today.
  if (isClassicalKemAlgorithm(primary.algorithm))
    return classicalKemUnavailableReason(primary, role)
  if (!isPqcKemAlgorithm(primary.algorithm))
    return 'The selected record is not a key candidate for this KEM sample.'
  if (executionMode === 'wasm') {
    if (!wasmLoaded)
      return 'The workbench library-load gate must complete before this PQC operation.'
    if (!(primary.data instanceof Uint8Array))
      return `The selected PQC ${role} key needs byte material for the existing adapter.`
  }
  // Keep the existing deterministic mock demonstration and PQC dispatch/inference.
  // A null reason does not claim that a factory or cryptographic check succeeded.
  return null
}

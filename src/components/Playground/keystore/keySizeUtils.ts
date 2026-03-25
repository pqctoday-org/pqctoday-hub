// SPDX-License-Identifier: GPL-3.0-only
import type { Key } from '../../../types'

/** Returns key size in bytes, or null if indeterminate (mock/placeholder keys). */
export const getKeySize = (key: Key): number | null => {
  if (key.data instanceof Uint8Array) return key.data.length
  // CryptoKey-backed keys store the hex export in key.value
  if (key.value && /^[0-9a-fA-F]+$/.test(key.value)) return key.value.length / 2
  return null
}

/** Human-readable byte size. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

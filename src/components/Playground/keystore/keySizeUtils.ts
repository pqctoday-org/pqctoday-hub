// SPDX-License-Identifier: AGPL-3.0-only
import type { Key } from '../../../types'
import { formatBytes as formatBytesShared } from '@/lib/format'

/** Returns key size in bytes, or null if indeterminate (mock/placeholder keys). */
export const getKeySize = (key: Key): number | null => {
  if (key.data instanceof Uint8Array) return key.data.length
  // CryptoKey-backed keys store the hex export in key.value
  if (key.value && /^[0-9a-fA-F]+$/.test(key.value)) return key.value.length / 2
  return null
}

/** Human-readable byte size. */
export const formatBytes = (bytes: number): string => formatBytesShared(bytes, { kib: true })

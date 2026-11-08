// SPDX-License-Identifier: AGPL-3.0-only
import { sha256 } from '@noble/hashes/sha2.js'

/** Bind every byte of the selected sample file, not merely its length and tail. */
export const buildFirmwareUploadManifest = (bytes: Uint8Array): string => {
  const digest = Array.from(sha256(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
  return `file-upload:${bytes.length}:sha256:${digest}`
}

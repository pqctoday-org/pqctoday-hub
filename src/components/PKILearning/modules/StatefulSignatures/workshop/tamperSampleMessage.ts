// SPDX-License-Identifier: AGPL-3.0-only
/** Deliberately change sample message bytes without altering the original input. */
export function tamperSampleMessage(message: Uint8Array): Uint8Array<ArrayBuffer> {
  if (message.length === 0) return Uint8Array.of(0x01)
  const changed = new Uint8Array(message)
  changed[0] ^= 0x01
  return changed
}

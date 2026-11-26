// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Short keys for remembering which questions were asked while the learner's objective and progress stayed as they are.
 * Only these keys are kept on the device, never the question or the objective: a 32-bit hash of the question as it is
 * compared (trimmed, lower case) and a 32-bit hash of the state it was asked in.
 */

/** FNV-1a over UTF-16 code units, as 8 hex digits. */
export function hash32(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

/** The key of a question: the same question in other letter case or with spaces around it has the same key. */
export function questionKey(question: string): string {
  return hash32(question.trim().toLowerCase())
}

/** The key of a state, from the parts that make it: a part that changes changes the key. */
export function stateKey(parts: readonly string[]): string {
  return hash32(parts.join('\n'))
}

// SPDX-License-Identifier: AGPL-3.0-only
/** Only call with outputs of public, bundled test cases, never user operations.
 * Comparison is separate from the case verdict: some negative vectors expect
 * inequality, and a matching output does not excuse a wrong return code. */
export function logByteComparison(
  addLog: (line: string) => void,
  identity: string,
  computed: Uint8Array | null,
  expected: string,
  field = 'output'
): boolean {
  const actual =
    computed === null ? null : Array.from(computed, (b) => b.toString(16).padStart(2, '0')).join('')
  const reference = expected.toLowerCase()
  const match = actual !== null && actual === reference
  addLog(
    `${identity} · Public test-vector comparison (hex; not production secrets)\n` +
      `  Expected ${field} (${reference.length / 2} bytes): ${reference}\n` +
      `  Computed ${field}${computed === null ? '' : ` (${computed.length} bytes)`}: ${actual ?? 'unavailable — no output returned'}\n` +
      `  Comparison: ${actual === null ? 'NOT COMPARED' : match ? 'MATCH — byte for byte' : 'MISMATCH'} (see case verdict for expected behaviour)`
  )
  return match
}

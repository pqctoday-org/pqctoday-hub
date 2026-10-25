// SPDX-License-Identifier: AGPL-3.0-only
/**
 * How the answered cases of an evidence document were obtained, counted from
 * each case's own `inputKind` and `mechanismKind`.
 *
 * Not read from `summary.byInputKind`: there `standard` only means "no special
 * input", so it also holds every answer that used the vendor-defined external-μ
 * mechanism with the μ NIST supplies. Counting by mechanism kind keeps those
 * apart from the answers that use a PKCS#11 v3.2 mechanism.
 *
 * Pure and dependency-free so the lesson can import it without the engine code.
 */

export interface AnswerKindCounts {
  /** No special input, mechanism listed in PKCS#11 v3.2. */
  standardV32: number
  /** No special input, vendor-defined mechanism (external μ, answered from the μ the prompt supplies). */
  vendorDefined: number
  /** No special input, mechanism from the PKCS#11 v3.3 working draft. */
  v33Draft: number
  /** NIST's m passed as a test-only mechanism parameter (ML-KEM encapsulation). */
  testInputM: number
  /** A value computed outside the engine from the prompt's own bytes (μ or PH(M)). */
  computed: number
  /** An ML-KEM key check read from the result of importing the key. */
  keyImportResult: number
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

/** Pure: split the answered cases of an evidence document's `cases` by how each was obtained. */
export const countAnswerKinds = (cases: unknown): AnswerKindCounts => {
  const out: AnswerKindCounts = {
    standardV32: 0,
    vendorDefined: 0,
    v33Draft: 0,
    testInputM: 0,
    computed: 0,
    keyImportResult: 0,
  }
  if (!Array.isArray(cases)) return out
  for (const c of cases) {
    if (!isRecord(c) || c.disposition !== 'answered') continue
    switch (c.inputKind) {
      case 'test-input-m':
        out.testInputM++
        break
      case 'computed-mu':
      case 'computed-ph':
        out.computed++
        break
      case 'key-import-result':
        out.keyImportResult++
        break
      default:
        if (c.mechanismKind === 'vendor-defined') out.vendorDefined++
        else if (c.mechanismKind === 'pkcs11-v3.3-draft') out.v33Draft++
        else if (c.mechanismKind === 'pkcs11-v3.2') out.standardV32++
    }
  }
  return out
}

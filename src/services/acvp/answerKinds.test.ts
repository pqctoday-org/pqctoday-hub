// SPDX-License-Identifier: AGPL-3.0-only
// The "how the answers were obtained" counts come from each case's mechanism kind
// and input kind, never from summary.byInputKind (whose `standard` also holds the
// answers that use the vendor-defined external-μ mechanism with NIST's own μ).
import { describe, it, expect } from 'vitest'
import { countAnswerKinds } from './answerKinds'

const answered = (mechanismKind: string, inputKind?: string) => ({
  tgId: 1,
  tcId: 1,
  disposition: 'answered',
  mechanismKind,
  ...(inputKind ? { inputKind } : {}),
})

describe('countAnswerKinds', () => {
  it('a fixture with every mechanism kind and input kind lands each case in exactly one bucket', () => {
    const cases = [
      answered('pkcs11-v3.2'), // plain v3.2 call
      answered('pkcs11-v3.2'),
      answered('vendor-defined'), // external-μ, NIST's μ
      answered('pkcs11-v3.3-draft'), // draft mechanism with no special input
      answered('pkcs11-v3.2', 'test-input-m'), // ML-KEM encapsulation
      answered('vendor-defined', 'computed-mu'),
      answered('pkcs11-v3.3-draft', 'computed-ph'),
      answered('pkcs11-v3.2', 'key-import-result'),
      { tgId: 2, tcId: 1, disposition: 'unsupported', reason: 'x' },
      { tgId: 2, tcId: 2, disposition: 'error', reason: 'y', mechanismKind: 'pkcs11-v3.2' },
    ]
    expect(countAnswerKinds(cases)).toEqual({
      standardV32: 2,
      vendorDefined: 1,
      v33Draft: 1,
      testInputM: 1,
      computed: 2,
      keyImportResult: 1,
    })
  })

  it('returns zeros for anything that is not a list of cases', () => {
    const zero = {
      standardV32: 0,
      vendorDefined: 0,
      v33Draft: 0,
      testInputM: 0,
      computed: 0,
      keyImportResult: 0,
    }
    expect(countAnswerKinds(undefined)).toEqual(zero)
    expect(countAnswerKinds({})).toEqual(zero)
    expect(countAnswerKinds([null, 3, 'x'])).toEqual(zero)
  })
})

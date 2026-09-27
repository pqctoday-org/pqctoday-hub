// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { katKindKey, rowTemplateOf, formatParameters } from './caseEvidence'
import { evidenceForRowId } from './acvpRowEvidence'
import { evidenceForKatKind } from './katCaseEvidence'

describe('per-case evidence records (generated from the manifest + registry)', () => {
  it('keys a KatKind canonically; a default testIndex is the same case', () => {
    expect(katKindKey({ type: 'hmac-verify', hashAlg: 'SHA-256' })).toBe(
      'hmac-verify;hashAlg=SHA-256'
    )
    expect(katKindKey({ type: 'sha256-hash', testIndex: 0 })).toBe('sha256-hash')
    expect(katKindKey({ type: 'sha256-hash', testIndex: 2 })).toBe('sha256-hash;testIndex=2')
    expect(katKindKey({ type: 'pbkdf2-derive', prf: 'SHA-256', testIndex: 1 })).toBe(
      'pbkdf2-derive;prf=SHA-256'
    )
    expect(katKindKey({ type: 'x', b: 1, a: undefined, c: 'z' })).toBe('x;b=1;c=z')
  })

  it('maps a concrete workbench row id to its {engine} template', () => {
    expect(rowTemplateOf('ecdsa521-acvp-C++')).toBe('ecdsa521-acvp-{engine}')
    expect(rowTemplateOf('mldsa-sigver-nist-ML-DSA-44-tg1-tc11-Rust')).toBe(
      'mldsa-sigver-nist-ML-DSA-44-tg1-tc11-{engine}'
    )
  })

  it('a workbench row reads the manifest class, not its producer string (aesgcm_test)', () => {
    // The row shows the reviewed manifest's class, never a label inside the vector
    // file. aesgcm_test was Node/OpenSSL output (independent-oracle) until
    // 2026-09-26; it is now NIST's CAVP gcmDecrypt256.rsp, which the manifest
    // records as a published NIST example set.
    expect(evidenceForRowId('aes-acvp-C++').map((r) => r.evidenceClass)).toEqual([
      'published-standard-kat',
    ])
    const p521 = evidenceForRowId('ecdsa521-acvp-Rust')
    expect(p521.map((r) => r.evidenceClass)).toEqual(['nist-acvp-reference-sample'])
    expect(p521[0].source?.url).toMatch(/usnistgov\/ACVP-Server\/[0-9a-f]{40}\//)
    expect(p521[0].exercises).toEqual(['CKM_ECDSA_SHA512 verify P-521'])
    expect(p521[0].limitations.some((l) => l.startsWith('subset:'))).toBe(true)
  })

  it('skip and error rows have no record — they can never show a badge', () => {
    expect(evidenceForRowId('ecdsa521-skip-C++')).toEqual([])
    expect(evidenceForRowId('ecdsa521-err-Rust')).toEqual([])
  })

  it('the same case carries the same class and source on the workbench and in katRunner', () => {
    const wb = evidenceForRowId('ecdsa521-acvp-C++')[0]
    const kat = evidenceForKatKind({ type: 'ecdsa-sigver', curve: 'P-521' })[0]
    expect(kat.caseId).toBe(wb.caseId)
    expect(kat.evidenceClass).toBe(wb.evidenceClass)
    expect(kat.source).toEqual(wb.source)
    expect(kat.parameters).toEqual(wb.parameters)
  })

  it('a generation run on a verify-recorded case says what it executes', () => {
    const gen = evidenceForKatKind({ type: 'hmac-generate', hashAlg: 'SHA-384' })[0]
    expect(gen.operation).toBe('mac-generate')
    expect(gen.limitations[0]).toMatch(/executed here: mac-generate/)
  })

  it('formats parameters without empty values', () => {
    expect(formatParameters({ parameterSet: 'ML-DSA-44', contextBytes: 0, hashAlg: null })).toBe(
      'parameterSet ML-DSA-44 · contextBytes 0'
    )
  })
})

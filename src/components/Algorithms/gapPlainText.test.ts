// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import openGaps from '@/data/validation/open-gaps.json'
import coverageMatrix from '@/data/validation/coverage-matrix.generated.json'
import type { OpenGap } from '@/data/validation/coverageModel'
import {
  GAP_PLAIN_TEXT,
  INTERNAL_LABEL,
  foldRecordedFailGaps,
  gapSummary,
  plainGapView,
  plainRuleText,
} from './gapPlainText'

type Gap = { id: string; title: string; detail: string; scope: string }
const gaps = openGaps.gaps as Gap[]
// The register as the page lists it: curated entries plus the generated ones, with the per-case failures folded.
const generated = coverageMatrix.openGaps as unknown as OpenGap[]
const registerGaps = foldRecordedFailGaps(generated)
const shownText = (g: Gap) => {
  const plain = plainGapView(g)
  return [plain.title, plain.scope, plain.summary ?? gapSummary(g.detail)].join('\n')
}

describe('plain wording for the open-gaps register', () => {
  it('shows no internal label in any curated entry (title, scope, summary)', () => {
    const offenders = gaps
      .map((g) => {
        const plain = plainGapView(g)
        const shown = [plain.title, plain.scope, plain.summary ?? gapSummary(g.detail)].join('\n')
        return INTERNAL_LABEL.test(shown) ? g.id : null
      })
      .filter(Boolean)
    expect(offenders).toEqual([])
  })

  it('shows no internal label in any entry of the register the page lists, folded failures included', () => {
    const offenders = registerGaps.filter((g) => INTERNAL_LABEL.test(shownText(g))).map((g) => g.id)
    expect(offenders).toEqual([])
  })

  it('the label pattern still catches the labels it exists for', () => {
    for (const text of [
      'Classical families still without NIST ACVP-Server cases after WS-E and gap-closure P5',
      'Triaged against pqctoday-hsm @ a22e6ca0 (post PRs #255/#257-260)',
      'new as of the P3 combined rebuild (2026-09-25, hsm a22e6ca0, E19)',
      'kmac_test.json tg0/tc0 (KMAC256)',
      'mostly fixed by hsm #290',
      'One happy-path case is always "sampled" (plan Q5).',
      'Recorded FAIL on Rust: acvp.36 (rsa_oaep_test#/testGroups/0/tests/0)',
      'The committed run result is fail (row pbkdf2-nist-tg1-tc20-C++).',
      'Root cause: hsm_importECPublicKey wrote the length as 0x85.',
      'Root cause (triage 2026-09-24)',
      'Our validation evidence has failed in three ways this programme',
      'A KAT harness must read a stated parameter',
    ]) {
      expect(INTERNAL_LABEL.test(text)).toBe(true)
    }
  })

  it('the label pattern leaves the plain wording of the rewritten entries alone', () => {
    for (const id of [
      'ecdsa-p521-cpp-ec-point-der',
      'suci-inject-testkey-cpp',
      'vector-corpus-blind-spots',
      'kat-harness-must-read-stated-parameters',
      'recorded-fail-pbkdf2',
      'recorded-fail-rsa-oaep',
    ]) {
      const plain = GAP_PLAIN_TEXT[id] // eslint-disable-line security/detect-object-injection
      expect(INTERNAL_LABEL.test([plain.title, plain.scope, plain.summary].join('\n'))).toBe(false)
    }
  })

  it('every override belongs to a real register entry and replaces something', () => {
    const ids = new Set(registerGaps.map((g) => g.id))
    for (const [id, plain] of Object.entries(GAP_PLAIN_TEXT)) {
      expect(ids.has(id)).toBe(true)
      expect(plain.title ?? plain.summary ?? plain.scope).toBeTruthy()
    }
  })

  it('folds the 20 recorded failures into one PBKDF2 entry and one RSA-OAEP entry', () => {
    const failures = generated.filter((g) => g.id.startsWith('recorded-fail:'))
    const byFamily = (family: string, engine: string) =>
      failures.filter((g) => g.id.includes(`#${family}#`) && g.id.endsWith(`:${engine}`))
    // the underlying data: 1 PBKDF2 case failing on both engines, 18 RSA-OAEP cases failing on Rust only
    expect(failures).toHaveLength(20)
    expect(byFamily('pbkdf2_acvp_test', 'cpp')).toHaveLength(1)
    expect(byFamily('pbkdf2_acvp_test', 'rust')).toHaveLength(1)
    expect(byFamily('rsa_oaep_test', 'rust')).toHaveLength(18)
    expect(byFamily('rsa_oaep_test', 'cpp')).toHaveLength(0)

    expect(registerGaps.filter((g) => g.id.startsWith('recorded-fail:'))).toEqual([])
    expect(registerGaps).toHaveLength(generated.length - 20 + 2)
    const titles = registerGaps.map((g) => plainGapView(g).title)
    expect(titles).toContain('PBKDF2: one NIST sample case fails on both engines')
    expect(titles).toContain('RSA-OAEP decryption: 18 NIST sample cases fail on the Rust engine')
  })

  it('keeps the test paths and row ids of the folded failures in the technical evidence only', () => {
    const pbkdf2 = registerGaps.find((g) => g.id === 'recorded-fail-pbkdf2')!
    const oaep = registerGaps.find((g) => g.id === 'recorded-fail-rsa-oaep')!
    for (const g of [pbkdf2, oaep]) {
      expect(INTERNAL_LABEL.test(shownText(g))).toBe(false)
      expect(INTERNAL_LABEL.test(g.detail)).toBe(true)
    }
    expect(pbkdf2.detail).toContain('C++: acvp.18b (pbkdf2_acvp_test#/testGroups/0/tests/3), row')
    expect(pbkdf2.detail).toContain('Rust: acvp.18b (pbkdf2_acvp_test#/testGroups/0/tests/3), row')
    expect(oaep.detail).toContain('acvp.36 (rsa_oaep_test#/testGroups/1/tests/9), row')
    expect((oaep.detail.match(/rsa_oaep_test#/g) ?? []).length).toBe(18)
    // status, owner and tracking reference carry over from the entries they replace
    expect(pbkdf2).toMatchObject({ status: 'open', origin: 'generated', owner: 'unassigned' })
    expect(oaep.planItem).toBe(generated.find((g) => g.id.startsWith('recorded-fail:'))!.planItem)
  })

  it('keeps the entries as generated when a family no longer has the recorded shape', () => {
    const extra: OpenGap = {
      ...generated.find((g) => g.id.endsWith('rsa_oaep_test#/testGroups/1/tests/9:rust'))!,
      id: 'recorded-fail:acvp.36#rsa_oaep_test#/testGroups/2/tests/0:rust',
    }
    const changed = foldRecordedFailGaps([...generated, extra])
    expect(changed.filter((g) => g.id.startsWith('recorded-fail:acvp.36'))).toHaveLength(19)
    expect(changed.some((g) => g.id === 'recorded-fail-rsa-oaep')).toBe(false)
    expect(changed.some((g) => g.id === 'recorded-fail-pbkdf2')).toBe(true)
    // ...and the wording test would fail on them, which is what asks for the update
    expect(changed.filter((g) => INTERNAL_LABEL.test(shownText(g)))).toHaveLength(19)
  })

  it('leaves an entry with no override exactly as written', () => {
    const g = gaps.find((x) => !(x.id in GAP_PLAIN_TEXT))!
    expect(plainGapView(g)).toEqual({ title: g.title, scope: g.scope, summary: null })
  })

  it('drops the plan pointer from the matrix rule text and nothing else', () => {
    expect(
      plainRuleText('One happy-path case is always "sampled", never "covered" (plan Q5).')
    ).toBe('One happy-path case is always "sampled", never "covered".')
    expect(plainRuleText('Covered needs at least 2 cases.')).toBe('Covered needs at least 2 cases.')
  })
})

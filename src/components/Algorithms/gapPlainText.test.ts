// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import openGaps from '@/data/validation/open-gaps.json'
import {
  GAP_PLAIN_TEXT,
  INTERNAL_LABEL,
  gapSummary,
  plainGapView,
  plainRuleText,
} from './gapPlainText'

type Gap = { id: string; title: string; detail: string; scope: string }
const gaps = openGaps.gaps as Gap[]

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

  it('the label pattern still catches the labels it exists for', () => {
    for (const text of [
      'Classical families still without NIST ACVP-Server cases after WS-E and gap-closure P5',
      'Triaged against pqctoday-hsm @ a22e6ca0 (post PRs #255/#257-260)',
      'new as of the P3 combined rebuild (2026-09-25, hsm a22e6ca0, E19)',
      'kmac_test.json tg0/tc0 (KMAC256)',
      'mostly fixed by hsm #290',
      'One happy-path case is always "sampled" (plan Q5).',
    ]) {
      expect(INTERNAL_LABEL.test(text)).toBe(true)
    }
  })

  it('every override belongs to a real register entry and replaces something', () => {
    const ids = new Set(gaps.map((g) => g.id))
    for (const [id, plain] of Object.entries(GAP_PLAIN_TEXT)) {
      expect(ids.has(id)).toBe(true)
      expect(plain.title ?? plain.summary ?? plain.scope).toBeTruthy()
    }
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

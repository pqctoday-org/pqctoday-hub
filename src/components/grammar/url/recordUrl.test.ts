// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  FACET_KEY_BY_PAGE,
  RECORD_KEY_ALIASES,
  TAB_KEY_ALIASES,
  applyGrammarChange,
  goPath,
  parseGrammarSearch,
  rewriteRecordAliases,
  slugify,
} from './recordUrl'

describe('slugify', () => {
  it('makes the slug of a visible label', () => {
    expect(slugify('Rules & standards')).toBe('rules-standards')
    expect(slugify('Tools & Products')).toBe('tools-products')
    expect(slugify('How should architects design for PQC?')).toBe(
      'how-should-architects-design-for-pqc'
    )
  })
})

describe('contract forms', () => {
  it('has one fixed facet key per catalog page', () => {
    expect(FACET_KEY_BY_PAGE).toEqual({
      '/threats': 'severity',
      '/algorithms': 'region',
      '/timeline': 'kind',
      '/patents': 'year',
      '/compliance': 'scheme',
      '/library': 'type',
      '/migrate': 'support',
    })
  })
  it('round-trips every form through the address', () => {
    const s =
      '?tab=compare&severity=high&open=THR%3ACLOUD-001&compare=ml-kem-768,hqc-128&step=2&zone=governance&q=how-to'
    expect(parseGrammarSearch(s, 'severity')).toEqual({
      open: 'THR:CLOUD-001',
      tab: 'compare',
      facet: 'high',
      compare: ['ml-kem-768', 'hqc-128'],
      step: 2,
      zone: 'governance',
      question: 'how-to',
    })
    expect(parseGrammarSearch('').open).toBeNull()
    expect(parseGrammarSearch('?step=0').step).toBeNull()
  })
})

describe('history rules', () => {
  it('opening a record or a tab adds an entry', () => {
    expect(applyGrammarChange('', { kind: 'open', tag: 'THR:A' })).toEqual({
      search: '?open=THR%3AA',
      history: 'push',
    })
    expect(applyGrammarChange('?open=x', { kind: 'tab', slug: 'compare' })).toEqual({
      search: '?tab=compare',
      history: 'push',
    })
  })
  it('a filter change, closing a record and a step replace the entry', () => {
    expect(applyGrammarChange('?tab=a', { kind: 'facet', key: 'severity', value: 'high' })).toEqual(
      {
        search: '?tab=a&severity=high',
        history: 'replace',
      }
    )
    expect(applyGrammarChange('?open=x&severity=high', { kind: 'open', tag: null })).toEqual({
      search: '?severity=high',
      history: 'replace',
    })
    expect(applyGrammarChange('', { kind: 'step', step: 2 }).history).toBe('replace')
  })
  it('the first tab has no parameter, and clearing a facet removes it', () => {
    expect(applyGrammarChange('?tab=compare', { kind: 'tab', slug: null }).search).toBe('')
    expect(
      applyGrammarChange('?severity=high', { kind: 'facet', key: 'severity', value: null }).search
    ).toBe('')
  })
})

describe('old record keys', () => {
  it('is a unique table of page and key', () => {
    const seen = new Set(RECORD_KEY_ALIASES.map((a) => `${a.page}?${a.key}`))
    expect(seen.size).toBe(RECORD_KEY_ALIASES.length)
  })
  it.each(RECORD_KEY_ALIASES.map((a) => [a.page, a.key] as const))(
    '%s ?%s rewrites to ?open=',
    (page, key) => {
      const r = rewriteRecordAliases(page, `?${key}=ABC&tab=x`)
      expect(r.changed).toBe(true)
      expect(new URLSearchParams(r.search).get('open')).toBe('ABC')
      expect(new URLSearchParams(r.search).has(key)).toBe(false)
      expect(new URLSearchParams(r.search).get('tab')).toBe('x')
    }
  )
  it('leaves a key alone on a page that does not use it as a record key', () => {
    expect(rewriteRecordAliases('/faq', '?id=1')).toEqual({ search: '?id=1', changed: false })
  })
  it('lets an existing ?open= win over an old key', () => {
    expect(rewriteRecordAliases('/threats', '?id=A&open=B').search).toBe('?open=B')
  })
  it('keeps the old Compliance tab keys as aliases of the renamed ones', () => {
    expect(TAB_KEY_ALIASES['/compliance']).toEqual({
      obligations: 'rules-standards',
      requirements: 'sources-practices',
      standards: 'landscape',
    })
  })
  it('builds the universal address', () => {
    expect(goPath('LM-001/s:intro')).toBe('/go/LM-001%2Fs%3Aintro')
  })
})

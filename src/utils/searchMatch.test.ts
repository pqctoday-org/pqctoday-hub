// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { matchesAllWords, SEARCH_STOPWORDS, tokenizeQuery } from './searchMatch'

describe('tokenizeQuery', () => {
  it('lowercases and splits on whitespace', () => {
    expect(tokenizeQuery('  Purdue   MODEL ')).toEqual(['purdue', 'model'])
  })

  it('drops stopwords', () => {
    expect(tokenizeQuery('purdue model for OT')).toEqual(['purdue', 'model', 'ot'])
    expect(tokenizeQuery('How does the TLS handshake work with an HSM')).toEqual([
      'tls',
      'handshake',
      'work',
      'hsm',
    ])
  })

  it('treats every listed stopword as droppable', () => {
    for (const w of SEARCH_STOPWORDS) expect(tokenizeQuery(w.toUpperCase())).toEqual([])
  })

  it('splits on punctuation and trims edge punctuation', () => {
    expect(tokenizeQuery('purdue, model; (OT)?')).toEqual(['purdue', 'model', 'ot'])
    expect(tokenizeQuery('"zero-trust."')).toEqual(['zero-trust'])
  })

  it('keeps inner + # . - / so identifiers stay one substring', () => {
    expect(tokenizeQuery('c++')).toEqual(['c++'])
    expect(tokenizeQuery('PKCS#11 ML-KEM node.js')).toEqual(['pkcs#11', 'ml-kem', 'node.js'])
  })

  it('drops tokens with no letter or digit', () => {
    expect(tokenizeQuery('IoT & OT -- security')).toEqual(['iot', 'ot', 'security'])
  })

  it('returns [] for empty, whitespace-only and stopword-only queries', () => {
    expect(tokenizeQuery('')).toEqual([])
    expect(tokenizeQuery('   ')).toEqual([])
    expect(tokenizeQuery('the of and')).toEqual([])
  })
})

describe('matchesAllWords', () => {
  const fields = ['Purdue Model', 'Reference architecture for ICS networks', 'OT security']

  it('requires every remaining word, in any order', () => {
    expect(matchesAllWords(fields, 'purdue model for OT')).toBe(true)
    expect(matchesAllWords(fields, 'ot purdue')).toBe(true)
    expect(matchesAllWords(fields, 'purdue quantum')).toBe(false)
  })

  it('is case-insensitive on both sides', () => {
    expect(matchesAllWords('PURDUE model', 'Purdue MODEL')).toBe(true)
  })

  it('uses substring semantics per word', () => {
    expect(matchesAllWords('operational technology', 'operat techn')).toBe(true)
    expect(matchesAllWords('operational technology', 'operationally')).toBe(false)
  })

  it('lets different fields satisfy different words', () => {
    expect(
      matchesAllWords(
        ['Guide to Operational Technology (OT) Security', 'Purdue'],
        'operational technology purdue'
      )
    ).toBe(true)
  })

  it('ignores null, undefined and empty fields', () => {
    expect(matchesAllWords([undefined, null, '', 'purdue'], 'purdue')).toBe(true)
    expect(matchesAllWords([undefined, null], 'purdue')).toBe(false)
  })

  it('does not let a word match across a field boundary', () => {
    expect(matchesAllWords(['abc', 'def'], 'cd')).toBe(false)
  })

  it('treats an empty or stopword-only query as no filtering', () => {
    expect(matchesAllWords('anything', '')).toBe(true)
    expect(matchesAllWords([], '   ')).toBe(true)
    expect(matchesAllWords('anything', 'the of')).toBe(true)
  })

  it('does not match when the haystack is empty but the query is not', () => {
    expect(matchesAllWords('', 'purdue')).toBe(false)
    expect(matchesAllWords([], 'purdue')).toBe(false)
  })

  it('regression: a contiguous phrase that matched before still matches', () => {
    const text = 'Guide to Operational Technology (OT) Security: the Purdue model, in depth.'
    const phrases = [
      'operational technology',
      'Technology (OT) Security',
      'the Purdue model, in depth',
      'to operational',
      'ot) security: the',
    ]
    for (const p of phrases) {
      expect(text.toLowerCase().includes(p.toLowerCase())).toBe(true)
      expect(matchesAllWords(text, p)).toBe(true)
    }
    expect(matchesAllWords('Modern C++ and a guide', 'c++ and a')).toBe(true)
    expect(matchesAllWords('PKCS #11 profiles', 'pkcs #11')).toBe(true)
  })
})

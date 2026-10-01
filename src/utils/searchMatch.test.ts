// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  matchesAllWords,
  matchScore,
  partialMatchFallback,
  SEARCH_STOPWORDS,
  tokenizeQuery,
} from './searchMatch'

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

describe('matchScore', () => {
  it('reports matched count and the missing words', () => {
    expect(matchScore('Purdue Model', 'purdue model for OT')).toEqual({
      tokens: ['purdue', 'model', 'ot'],
      matched: 2,
      missing: ['ot'],
    })
  })

  it('has nothing missing for an empty or stopword-only query', () => {
    expect(matchScore('x', '')).toEqual({ tokens: [], matched: 0, missing: [] })
    expect(matchScore('x', 'the of')).toEqual({ tokens: [], matched: 0, missing: [] })
  })
})

describe('partialMatchFallback', () => {
  const items = [
    ['Purdue Model', 'levels 0 to 5'],
    ['Programmable Logic Controller', 'sits at Purdue Level 1'],
    ['Unrelated', 'nothing here'],
  ]
  const get = (i: string[]) => i

  it('returns all-but-one matches, with the word each lacks, for 3+ words', () => {
    const r = partialMatchFallback(items, get, 'purdue model for OT')
    expect(r).toEqual([{ item: items[0], missing: ['ot'] }])
  })

  it('keeps the incoming order among equally ranked matches', () => {
    const r = partialMatchFallback(items, get, 'purdue level zzz')
    expect(r?.map((x) => x.item[0])).toEqual(['Purdue Model', 'Programmable Logic Controller'])
  })

  it('returns null when some item already contains every word', () => {
    expect(partialMatchFallback(items, get, 'purdue model levels')).toBeNull()
  })

  it('returns null for fewer than 3 words (no fallback), even with no match', () => {
    expect(partialMatchFallback(items, get, 'purdue zzz')).toBeNull()
    expect(partialMatchFallback(items, get, 'purdue')).toBeNull()
    expect(partialMatchFallback(items, get, 'purdue for the zzz')).toBeNull()
  })

  it('returns null for an empty or stopword-only query', () => {
    expect(partialMatchFallback(items, get, '')).toBeNull()
    expect(partialMatchFallback(items, get, 'the of and')).toBeNull()
  })

  it('returns [] when applicable but nothing matches all but one', () => {
    expect(partialMatchFallback(items, get, 'aaa bbb ccc')).toEqual([])
  })
})

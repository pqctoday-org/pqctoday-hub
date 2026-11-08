// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  MAX_PRODUCT_COUNT,
  parseProductCount,
  productCountOutputNote,
  restoredCountSource,
} from './roiProductCount'

describe('parseProductCount', () => {
  it.each([
    ['50', 50],
    [' 120 ', 120],
    ['1,200', 1200],
    ['12,345,678', null],
    ['1000000', 1_000_000],
    ['1,000,000', 1_000_000],
  ])('reads %j', (text, value) => {
    const parsed = parseProductCount(text)
    expect(parsed.ok).toBe(value !== null)
    if (parsed.ok) expect(parsed.value).toBe(value)
  })

  it.each(['1,', '1,2', '1,20', '12,345,', '12,345,6', '123,4'])(
    'treats %j as a number still being typed',
    (text) => {
      const parsed = parseProductCount(text)
      expect(parsed.ok).toBe(false)
      if (!parsed.ok) expect(parsed.incomplete).toBe(true)
    }
  )

  it('treats a blank field as still being typed, because the reader may be about to type', () => {
    const parsed = parseProductCount('')
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.incomplete).toBe(true)
  })

  it.each(['abc', '12a', '-4', '12.5', '1 200', '1,2,3', ',5', '1,2345', '0', '00'])(
    'treats %j as a mistake typing cannot fix',
    (text) => {
      const parsed = parseProductCount(text)
      expect(parsed.ok).toBe(false)
      if (!parsed.ok) expect(parsed.incomplete).toBe(false)
    }
  )

  it('mentions commas in the message for a malformed number', () => {
    const parsed = parseProductCount('abc')
    expect(!parsed.ok && parsed.message).toContain('Commas are fine')
  })

  it('rejects a count above the largest accepted', () => {
    const parsed = parseProductCount(String(MAX_PRODUCT_COUNT + 1))
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.message).toContain('1,000,000')
  })
})

describe('restoredCountSource', () => {
  it('keeps a known marker and treats a missing or unknown one as a restored saved model', () => {
    expect(restoredCountSource('example')).toBe('example')
    expect(restoredCountSource('entered')).toBe('entered')
    expect(restoredCountSource(undefined)).toBe('saved-model')
    expect(restoredCountSource('catalogue')).toBe('saved-model')
  })
})

describe('productCountOutputNote', () => {
  it('names an example or an unconfirmed count and stays silent for the learner own entry', () => {
    expect(productCountOutputNote('example', 50)).toBe(
      'example count of 50 systems or products, not your own'
    )
    expect(productCountOutputNote('saved-model', 10)).toBe(
      'count of 10 systems or products from a saved model, not confirmed as yours'
    )
    expect(productCountOutputNote('entered', 120)).toBeNull()
    expect(productCountOutputNote(undefined, undefined)).toBeNull()
  })
})

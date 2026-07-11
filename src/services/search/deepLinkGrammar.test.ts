// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { sanitizeDeepLink } from './deepLinkGrammar'

describe('sanitizeDeepLink', () => {
  it('leaves a fully valid internal link unchanged', () => {
    expect(sanitizeDeepLink('/algorithms?tab=support&matrixView=detailed')).toEqual({
      url: '/algorithms?tab=support&matrixView=detailed',
      strippedKeys: [],
    })
  })

  it('strips an unrecognized query key while keeping valid ones and the target route', () => {
    const result = sanitizeDeepLink('/algorithms?tab=support&bogus=1')
    expect(result.url).toBe('/algorithms?tab=support')
    expect(result.strippedKeys).toEqual(['bogus'])
  })

  it('strips the dead subtab param specifically', () => {
    const result = sanitizeDeepLink('/algorithms?tab=detailed&subtab=performance')
    expect(result.url).toBe('/algorithms?tab=detailed')
    expect(result.strippedKeys).toEqual(['subtab'])
  })

  it('strips multiple unrecognized keys', () => {
    const result = sanitizeDeepLink('/algorithms?tab=support&foo=1&bar=2')
    expect(result.url).toBe('/algorithms?tab=support')
    expect(result.strippedKeys).toEqual(['foo', 'bar'])
  })

  it('leaves a path with no query string unchanged', () => {
    expect(sanitizeDeepLink('/algorithms')).toEqual({ url: '/algorithms', strippedKeys: [] })
  })

  it('leaves routes with a free-form (*) query grammar unchanged', () => {
    expect(sanitizeDeepLink('/report?anything=goes&here=too')).toEqual({
      url: '/report?anything=goes&here=too',
      strippedKeys: [],
    })
  })

  it('leaves an unmatched path unchanged rather than stripping everything', () => {
    const url = '/some-future-page?whatever=1'
    expect(sanitizeDeepLink(url)).toEqual({ url, strippedKeys: [] })
  })

  it('leaves external URLs unchanged', () => {
    const url = 'https://example.com/?utm_source=chat'
    expect(sanitizeDeepLink(url)).toEqual({ url, strippedKeys: [] })
  })

  it('preserves a hash fragment after stripping', () => {
    const result = sanitizeDeepLink('/algorithms?tab=support&bogus=1#section')
    expect(result.url).toBe('/algorithms?tab=support#section')
    expect(result.strippedKeys).toEqual(['bogus'])
  })
})

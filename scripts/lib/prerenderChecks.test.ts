// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { validateSnapshot } from './prerenderChecks'
import type { SearchRoute } from '../../src/seo/searchRoutes'

const route: SearchRoute = {
  path: '/example',
  kind: 'page',
  index: true,
  title: 'Example',
  description: 'Example description',
  contentRegion: 'main',
}

const sufficientContent = 'Useful explanatory content. '.repeat(24)

function html(body: string, root = 'data-prerender-route="/example" data-prerender-state="ready"') {
  return `<!doctype html><html><head><title>Example</title><meta name="description" content="Example description"><link rel="canonical" href="https://www.pqctoday.com/example"></head><body><div id="root" ${root}>${body}</div></body></html>`
}

describe('validateSnapshot', () => {
  it('accepts a complete route snapshot', () => {
    const result = validateSnapshot(
      html(`<main><h1>Example</h1><p>${sufficientContent}</p></main>`),
      route
    )
    expect(result).toEqual({
      route: '/example',
      chars: 'Example'.length + sufficientContent.trim().length,
      h1Count: 1,
      errors: [],
    })
  })

  it('rejects indexable content below the route minimum', () => {
    expect(
      validateSnapshot(html('<main><h1>Example</h1><p>Too short.</p></main>'), route).errors
    ).toContain('content region has 17 characters; expected at least 600')
  })

  it.each([
    [
      'pending',
      html(
        '<main><h1>Example</h1></main>',
        'data-prerender-route="/example" data-prerender-state="pending"'
      ),
    ],
    [
      'wrong route',
      html(
        '<main><h1>Example</h1></main>',
        'data-prerender-route="/other" data-prerender-state="ready"'
      ),
    ],
    ['missing region', html('<div><h1>Example</h1></div>')],
    ['loading copy', html('<main><h1>Loading...</h1></main>')],
    ['missing heading', html('<main><p>Useful content</p></main>')],
    ['two headings', html('<main><h1>One</h1><h1>Two</h1></main>')],
    [
      'disclaimer',
      html('<main><h1>Example</h1><h2 id="disclaimer-title">Welcome to PQC Today</h2></main>'),
    ],
  ])('rejects %s', (_name, snapshot) => {
    expect(validateSnapshot(snapshot, route).errors.length).toBeGreaterThan(0)
  })

  it('requires noindex for a supported non-indexed route', () => {
    expect(
      validateSnapshot(html('<main><h1>Example</h1></main>'), { ...route, index: false }).errors
    ).toContain('non-indexed route lacks noindex')
  })
})

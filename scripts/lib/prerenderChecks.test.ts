// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { validateSnapshot } from './prerenderChecks'
import type { SearchRoute } from '../../src/seo/searchRoutes'

/**
 * Every validation rule has its own reject case here. Each case starts from a snapshot that passes,
 * changes exactly one thing, and asserts the exact error text. A reject case built from a tiny page
 * would also trip the minimum-length rule, so it would keep passing after the rule it names was
 * deleted. The suite is only worth having if disabling any single rule in validateSnapshot makes at
 * least one test here fail; check that whenever a rule is added or changed.
 */

const route: SearchRoute = {
  path: '/example',
  kind: 'page',
  index: true,
  title: 'Example',
  description: 'Example description',
  contentRegion: 'main',
}

const CONTENT = 'Useful explanatory content about migration planning. '.repeat(16)
const GOOD_ROOT = 'data-prerender-route="/example" data-prerender-state="ready"'
const GOOD_BODY = `<main><h1>Example</h1><p>${CONTENT}</p></main>`

interface Parts {
  title?: string
  description?: string | null
  canonical?: string | null
  robots?: string | null
  /** Attributes on #root; `null` renders no #root element at all. */
  root?: string | null
  body?: string
}

function snapshot(parts: Parts = {}): string {
  const description = parts.description === undefined ? 'Example description' : parts.description
  const canonical =
    parts.canonical === undefined ? 'https://www.pqctoday.com/example' : parts.canonical
  const head =
    `<title>${parts.title ?? 'Example'}</title>` +
    (description === null ? '' : `<meta name="description" content="${description}">`) +
    (canonical === null ? '' : `<link rel="canonical" href="${canonical}">`) +
    (parts.robots ? `<meta name="robots" content="${parts.robots}">` : '')
  const body = parts.body ?? GOOD_BODY
  const inner =
    parts.root === null ? body : `<div id="root" ${parts.root ?? GOOD_ROOT}>${body}</div>`
  return `<!doctype html><html><head>${head}</head><body>${inner}</body></html>`
}

const errorsOf = (parts: Parts, r: SearchRoute = route) =>
  validateSnapshot(snapshot(parts), r).errors

describe('validateSnapshot: a complete snapshot', () => {
  it('passes with no errors and reports its size', () => {
    const result = validateSnapshot(snapshot(), route)
    expect(result.errors).toEqual([])
    expect(result.h1Count).toBe(1)
    expect(result.chars).toBe('Example'.length + CONTENT.trim().length)
    expect(result.route).toBe('/example')
  })

  it('passes a non-indexed route that carries noindex', () => {
    expect(errorsOf({ robots: 'noindex,follow' }, { ...route, index: false })).toEqual([])
  })
})

describe('validateSnapshot: each rule rejects on its own', () => {
  it('missing #root', () => {
    expect(errorsOf({ root: null })).toContain('missing #root')
  })

  it('route marker that names another route', () => {
    expect(
      errorsOf({ root: 'data-prerender-route="/other" data-prerender-state="ready"' })
    ).toEqual(['route marker is /other'])
  })

  it('route marker that is absent', () => {
    expect(errorsOf({ root: 'data-prerender-state="ready"' })).toEqual(['route marker is missing'])
  })

  it('readiness still pending', () => {
    expect(
      errorsOf({ root: 'data-prerender-route="/example" data-prerender-state="pending"' })
    ).toEqual(['readiness is pending'])
  })

  it('readiness absent', () => {
    expect(errorsOf({ root: 'data-prerender-route="/example"' })).toEqual(['readiness is missing'])
  })

  it('content region not on the page', () => {
    expect(errorsOf({ body: `<div><h1>Example</h1><p>${CONTENT}</p></div>` })).toContain(
      'missing content region main'
    )
  })

  it('no <h1> in the region', () => {
    expect(errorsOf({ body: `<main><p>${CONTENT}</p></main>` })).toEqual([
      'expected one h1, found 0',
    ])
  })

  it('two <h1> elements in the region', () => {
    expect(errorsOf({ body: `<main><h1>One</h1><h1>Two</h1><p>${CONTENT}</p></main>` })).toEqual([
      'expected one h1, found 2',
    ])
  })

  it('content shorter than the route minimum', () => {
    const text = 'ExampleShort.'
    expect(errorsOf({ body: '<main><h1>Example</h1><p>Short.</p></main>' })).toEqual([
      `content region has ${text.length} characters; expected at least 600`,
    ])
  })

  it.each([
    ['Loading...', 'a loading placeholder'],
    ['Loading Module...', 'a module loading placeholder'],
    ['Initializing application modules...', 'an initialising placeholder'],
  ])('content that opens with %s (%s)', (opening) => {
    expect(errorsOf({ body: `<main><h1>${opening}</h1><p>${CONTENT}</p></main>` })).toEqual([
      'content region starts with a loading placeholder',
    ])
  })

  it('a heading that merely starts with the word Loading is not a placeholder', () => {
    expect(
      errorsOf({ body: `<main><h1>Loadings and payloads</h1><p>${CONTENT}</p></main>` })
    ).toEqual([])
  })

  it('the first-visit disclaimer dialog captured in the page', () => {
    expect(
      errorsOf({
        body: `<main><h1>Example</h1><p>${CONTENT}</p><h2 id="disclaimer-title">Welcome to PQC Today</h2></main>`,
      })
    ).toEqual(['disclaimer dialog was captured'])
  })

  it('title that differs from the route manifest', () => {
    expect(errorsOf({ title: 'Another page' })).toEqual(['title does not match route manifest'])
  })

  it('description that differs from the route manifest', () => {
    expect(errorsOf({ description: 'A different description' })).toEqual([
      'description does not match route manifest',
    ])
  })

  it('description that is absent', () => {
    expect(errorsOf({ description: null })).toEqual(['description does not match route manifest'])
  })

  it('canonical that points at another URL', () => {
    expect(errorsOf({ canonical: 'https://www.pqctoday.com/other' })).toEqual([
      'canonical is https://www.pqctoday.com/other',
    ])
  })

  it('canonical that is absent', () => {
    expect(errorsOf({ canonical: null })).toEqual(['canonical is missing'])
  })

  it('canonical of the home route keeps its trailing slash', () => {
    const home: SearchRoute = { ...route, path: '/' }
    expect(
      validateSnapshot(
        snapshot({
          canonical: 'https://www.pqctoday.com/',
          root: 'data-prerender-route="/" data-prerender-state="ready"',
        }),
        home
      ).errors
    ).toEqual([])
  })

  it('an indexable route that carries noindex', () => {
    expect(errorsOf({ robots: 'noindex,follow' })).toEqual(['indexable route has noindex'])
  })

  it('a non-indexed route that lacks noindex', () => {
    expect(errorsOf({}, { ...route, index: false })).toEqual(['non-indexed route lacks noindex'])
  })
})

describe('validateSnapshot: route kinds use their own minimum length', () => {
  // The region text is the heading ("Example", 7 characters) followed by the paragraph.
  const withTotal = (total: number) =>
    `<main><h1>Example</h1><p>${'x'.repeat(total - 'Example'.length)}</p></main>`
  const tooShort = (total: number, minimum: number) =>
    `content region has ${total} characters; expected at least ${minimum}`

  it('an ordinary page needs 600 characters', () => {
    expect(errorsOf({ body: withTotal(599) })).toEqual([tooShort(599, 600)])
    expect(errorsOf({ body: withTotal(600) })).toEqual([])
  })

  it.each(['business-tool', 'browser-tool', 'sandbox-tool', 'lab'] as const)(
    'a %s page needs 400 characters',
    (kind) => {
      const tool: SearchRoute = { ...route, kind }
      expect(errorsOf({ body: withTotal(399) }, tool)).toEqual([tooShort(399, 400)])
      expect(errorsOf({ body: withTotal(400) }, tool)).toEqual([])
    }
  )

  it.each(['/navigate', '/simulation'])('%s needs 300 characters', (path) => {
    const special: SearchRoute = { ...route, path }
    const root = `data-prerender-route="${path}" data-prerender-state="ready"`
    const canonical = `https://www.pqctoday.com${path}`
    expect(errorsOf({ body: withTotal(299), root, canonical }, special)).toEqual([
      tooShort(299, 300),
    ])
    expect(errorsOf({ body: withTotal(300), root, canonical }, special)).toEqual([])
  })
})

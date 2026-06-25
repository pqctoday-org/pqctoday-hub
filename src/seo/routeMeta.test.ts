// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getRouteMeta, isNoindexRoute, ROUTE_META } from './routeMeta'

const BASE = 'https://www.pqctoday.com'

describe('getRouteMeta', () => {
  it('returns the exact entry for a known route', () => {
    expect(getRouteMeta('/timeline').canonical).toBe(`${BASE}/timeline`)
  })

  it('normalizes a trailing slash to the canonical without one', () => {
    expect(getRouteMeta('/timeline/').canonical).toBe(`${BASE}/timeline`)
  })

  it('keeps the root canonical as "/"', () => {
    expect(getRouteMeta('/').canonical).toBe(`${BASE}/`)
  })

  // The core SEO fix: unknown/child routes must NEVER canonical to the homepage.
  it('gives an unknown child route a self-referential canonical (not homepage)', () => {
    const meta = getRouteMeta('/playground/cacp')
    expect(meta.canonical).toBe(`${BASE}/playground/cacp`)
    expect(meta.canonical).not.toBe(`${BASE}/`)
  })

  it('inherits the parent section title for a child route', () => {
    expect(getRouteMeta('/playground/cacp').title).toBe(ROUTE_META['/playground']!.title)
  })

  it('gives an unknown top-level route a self-referential canonical', () => {
    expect(getRouteMeta('/totally-unknown').canonical).toBe(`${BASE}/totally-unknown`)
  })

  it('does not leak the parent structured data onto child routes', () => {
    expect(getRouteMeta('/business/tools/some-tool').structuredData).toBeUndefined()
  })

  it('marks legacy routes noindex with a self canonical', () => {
    const meta = getRouteMeta('/library/legacy')
    expect(meta.noindex).toBe(true)
    expect(meta.canonical).toBe(`${BASE}/library/legacy`)
  })

  it('marks the embed surface noindex', () => {
    expect(getRouteMeta('/embed').noindex).toBe(true)
  })

  it('does not mark normal routes noindex', () => {
    expect(getRouteMeta('/timeline').noindex).toBeUndefined()
  })
})

describe('isNoindexRoute', () => {
  it('flags legacy and embed routes', () => {
    expect(isNoindexRoute('/assess/legacy')).toBe(true)
    expect(isNoindexRoute('/embed')).toBe(true)
    expect(isNoindexRoute('/embed/foo')).toBe(true)
  })
  it('does not flag indexable routes', () => {
    expect(isNoindexRoute('/')).toBe(false)
    expect(isNoindexRoute('/simulation')).toBe(false)
  })
})

// SPDX-License-Identifier: GPL-3.0-only
import { JSDOM } from 'jsdom'
import { minimumContentCharacters, type SearchRoute } from '../../src/seo/searchRoutes'

export interface SnapshotCheckResult {
  route: string
  chars: number
  h1Count: number
  errors: string[]
}

const PLACEHOLDER = /^(loading|initializing)(?:\s|\.|…)/i

export function validateSnapshot(html: string, route: SearchRoute): SnapshotCheckResult {
  const document = new JSDOM(html).window.document
  const root = document.querySelector('#root') as HTMLElement | null
  const region = document.querySelector(route.contentRegion)
  const text = region?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  const headings = region?.querySelectorAll('h1') ?? []
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content
  const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content ?? ''
  const errors: string[] = []

  if (!root) errors.push('missing #root')
  if (root?.dataset.prerenderRoute !== route.path)
    errors.push(`route marker is ${root?.dataset.prerenderRoute ?? 'missing'}`)
  if (root?.dataset.prerenderState !== 'ready')
    errors.push(`readiness is ${root?.dataset.prerenderState ?? 'missing'}`)
  if (!region) errors.push(`missing content region ${route.contentRegion}`)
  if (headings.length !== 1) errors.push(`expected one h1, found ${headings.length}`)
  const minimumChars = minimumContentCharacters(route)
  if (text.length < minimumChars)
    errors.push(`content region has ${text.length} characters; expected at least ${minimumChars}`)
  if (PLACEHOLDER.test(text)) errors.push('content region starts with a loading placeholder')
  if (document.querySelector('#disclaimer-title')) errors.push('disclaimer dialog was captured')
  if (document.title !== route.title) errors.push('title does not match route manifest')
  if (description !== route.description) errors.push('description does not match route manifest')
  const expectedCanonical = `https://www.pqctoday.com${route.path === '/' ? '/' : route.path}`
  if (canonical !== expectedCanonical) errors.push(`canonical is ${canonical ?? 'missing'}`)
  if (route.index && /noindex/i.test(robots)) errors.push('indexable route has noindex')
  if (!route.index && !/noindex/i.test(robots)) errors.push('non-indexed route lacks noindex')

  return { route: route.path, chars: text.length, h1Count: headings.length, errors }
}

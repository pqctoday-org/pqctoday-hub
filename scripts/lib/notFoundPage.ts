// SPDX-License-Identifier: GPL-3.0-only
import { JSDOM } from 'jsdom'
import {
  NOT_FOUND_DESCRIPTION,
  NOT_FOUND_LINKS,
  NOT_FOUND_TITLE,
} from '../../src/seo/notFoundContent'

/**
 * The page GitHub Pages serves, with a 404 status, for an address that has no file.
 *
 * It used to be a copy of the built home page, so a wrong address returned the home page's title,
 * description and canonical with a 404 status, and the app then redirected the visitor to "/".
 * It is now built from the same shell (so the app still starts: addresses that only the app knows,
 * such as the embed pages, are served from it too) with:
 *   - a title, a description and `noindex` of its own, and no canonical, Open Graph, Twitter or
 *     structured data, since there is no page for any of them to describe;
 *   - a visible "Page not found" message and links to the main sections inside #root, for visitors
 *     and crawlers that do not run JavaScript (the app replaces them when it starts, and removes the
 *     tags marked data-static-404, see src/seo/PageMeta.tsx).
 * The 404 status itself comes from the host: any address without a file gets this page with a 404.
 */

/** Marks the head tags this page adds, so the app can remove them once it has taken over. */
export const STATIC_404_ATTRIBUTE = 'data-static-404'

const REMOVED_FROM_HEAD = [
  'title',
  'meta[name="description"]',
  'meta[name="robots"]',
  'link[rel="canonical"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
  'script[type="application/ld+json"]',
]

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function notFoundBody(): string {
  const links = NOT_FOUND_LINKS.map(
    (link) => `<li><a href="${escapeHtml(link.path)}">${escapeHtml(link.label)}</a></li>`
  ).join('')
  return (
    '<main id="main-content">' +
    '<h1>Page not found</h1>' +
    `<p>${escapeHtml(NOT_FOUND_DESCRIPTION)}</p>` +
    `<ul>${links}</ul>` +
    '</main>'
  )
}

/** Builds 404.html from the built index.html. */
export function buildNotFoundPage(indexHtml: string): string {
  const dom = new JSDOM(indexHtml)
  const { document } = dom.window
  for (const selector of REMOVED_FROM_HEAD) {
    for (const element of Array.from(document.head.querySelectorAll(selector))) element.remove()
  }

  const add = (tag: string, attributes: Record<string, string>, text?: string) => {
    const element = document.createElement(tag)
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
    element.setAttribute(STATIC_404_ATTRIBUTE, '')
    if (text !== undefined) element.textContent = text
    document.head.appendChild(element)
  }
  add('title', {}, NOT_FOUND_TITLE)
  add('meta', { name: 'description', content: NOT_FOUND_DESCRIPTION })
  add('meta', { name: 'robots', content: 'noindex,follow' })

  const root = document.querySelector('#root')
  if (root) {
    for (const attribute of Array.from(root.attributes)) {
      if (attribute.name.startsWith('data-prerender-')) root.removeAttribute(attribute.name)
    }
    root.innerHTML = notFoundBody()
  }
  return dom.serialize()
}

/** What must hold for 404.html; empty when it does. */
export function validateNotFoundPage(html: string): string[] {
  const { document } = new JSDOM(html).window
  const errors: string[] = []
  const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''
  if (!/noindex/i.test(robots)) errors.push('404.html is not marked noindex')
  if (document.querySelector('link[rel="canonical"]')) errors.push('404.html has a canonical link')
  if (document.querySelector('script[type="application/ld+json"]')) {
    errors.push('404.html has structured data')
  }
  if (document.querySelector('meta[property="og:url"]')) errors.push('404.html has an og:url')
  if (document.title !== NOT_FOUND_TITLE) errors.push('404.html does not have the not-found title')
  const root = document.querySelector('#root')
  if (!root) {
    errors.push('404.html has no #root, so the app could not start from it')
  } else {
    if (root.querySelectorAll('h1').length !== 1) errors.push('404.html needs exactly one <h1>')
    if (!/not found/i.test(root.querySelector('h1')?.textContent ?? '')) {
      errors.push('404.html does not say the page was not found')
    }
    if (root.getAttributeNames().some((name) => name.startsWith('data-prerender-'))) {
      errors.push('404.html still carries a prerender marker from the page it was copied from')
    }
  }
  if (!document.querySelector('script[type="module"][src]')) {
    errors.push('404.html does not load the app, so addresses only the app knows would not work')
  }
  return errors
}

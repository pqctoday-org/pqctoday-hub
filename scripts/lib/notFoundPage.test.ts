// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import {
  NOT_FOUND_DESCRIPTION,
  NOT_FOUND_LINKS,
  NOT_FOUND_TITLE,
} from '../../src/seo/notFoundContent'
import { buildNotFoundPage, STATIC_404_ATTRIBUTE, validateNotFoundPage } from './notFoundPage'

/**
 * Starts from a prerendered home page, the page 404.html used to be a copy of, and from the real
 * index.html. Each rule of validateNotFoundPage has its own reject case, so removing a rule fails one.
 */

const PRERENDERED_HOME = `<!doctype html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="keywords" content="pqc"><meta name="author" content="PQC Today">
<link rel="icon" href="/favicon-32x32.png">
<link rel="modulepreload" crossorigin href="/assets/vendor-react-abc.js">
<link rel="stylesheet" crossorigin href="/assets/index-abc.css">
<script type="module" crossorigin src="/assets/index-abc.js"></script>
<title>PQC Today: Post-Quantum Cryptography Migration Hub</title>
<meta name="description" content="Home description">
<link rel="canonical" href="https://www.pqctoday.com/">
<meta property="og:title" content="Home"><meta property="og:url" content="https://www.pqctoday.com/">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Home">
<script type="application/ld+json">{"@type":"WebSite","name":"PQC Today"}</script>
</head><body>
<div id="root" data-prerender-route="/" data-prerender-state="ready"><main id="main-content"><h1>Welcome home</h1><p>Home page content.</p></main></div>
</body></html>`

const build = (html = PRERENDERED_HOME) => new JSDOM(buildNotFoundPage(html)).window.document
const valid = () => buildNotFoundPage(PRERENDERED_HOME)
const errorsOf = (html: string) => validateNotFoundPage(html)

describe('buildNotFoundPage: the head', () => {
  it('has exactly one title, with the not-found text', () => {
    const document = build()
    expect(document.querySelectorAll('title')).toHaveLength(1)
    expect(document.title).toBe(NOT_FOUND_TITLE)
  })

  it('has its own description and is marked noindex', () => {
    const document = build()
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      NOT_FOUND_DESCRIPTION
    )
    expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1)
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex,follow'
    )
  })

  it('carries nothing that describes the home page it was built from', () => {
    const document = build()
    expect(document.querySelector('link[rel="canonical"]')).toBeNull()
    expect(document.querySelector('meta[property^="og:"]')).toBeNull()
    expect(document.querySelector('meta[name^="twitter:"]')).toBeNull()
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull()
    expect(document.documentElement.outerHTML).not.toContain('Home description')
  })

  it('marks every tag it adds so the app can remove them once it has taken over', () => {
    const document = build()
    const marked = Array.from(document.head.querySelectorAll(`[${STATIC_404_ATTRIBUTE}]`))
    expect(marked.map((element) => element.tagName.toLowerCase()).sort()).toEqual([
      'meta',
      'meta',
      'title',
    ])
  })

  it('keeps what the app needs to start and what every page shares', () => {
    const document = build()
    expect(document.querySelector('meta[charset]')).not.toBeNull()
    expect(document.querySelector('meta[name="viewport"]')).not.toBeNull()
    expect(
      document.querySelector('script[type="module"][src="/assets/index-abc.js"]')
    ).not.toBeNull()
    expect(document.querySelector('link[rel="modulepreload"]')).not.toBeNull()
    expect(document.querySelector('link[rel="stylesheet"]')).not.toBeNull()
    expect(document.querySelector('meta[name="keywords"]')).not.toBeNull()
    expect(document.querySelector('link[rel="icon"]')).not.toBeNull()
  })
})

describe('buildNotFoundPage: the page body', () => {
  it('says the page was not found, with one heading', () => {
    const root = build().querySelector('#root')!
    expect(root.querySelectorAll('h1')).toHaveLength(1)
    expect(root.querySelector('h1')?.textContent).toBe('Page not found')
  })

  it('links to the main sections with real links', () => {
    const root = build().querySelector('#root')!
    const links = Array.from(root.querySelectorAll('a')).map((a) => [
      a.getAttribute('href'),
      a.textContent,
    ])
    expect(links).toEqual(NOT_FOUND_LINKS.map((link) => [link.path, link.label]))
  })

  it('no longer holds the home page content or its prerender marker', () => {
    const root = build().querySelector('#root')!
    expect(root.textContent).not.toContain('Welcome home')
    expect(root.getAttributeNames().filter((name) => name.startsWith('data-prerender-'))).toEqual(
      []
    )
  })

  it('gives the same page when built from its own output', () => {
    const once = buildNotFoundPage(PRERENDERED_HOME)
    expect(buildNotFoundPage(once)).toBe(once)
  })
})

describe('buildNotFoundPage: built from the real index.html', () => {
  const real = readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8')

  it('passes its own validation, and the app can still start from it', () => {
    const html = buildNotFoundPage(real)
    expect(validateNotFoundPage(html)).toEqual([])
    expect(
      new JSDOM(html).window.document.querySelector('script[type="module"][src]')
    ).not.toBeNull()
  })

  it('drops the site-wide structured data the shell carries', () => {
    expect(real).toContain('application/ld+json')
    expect(buildNotFoundPage(real)).not.toContain('application/ld+json')
  })
})

describe('validateNotFoundPage: each rule rejects on its own', () => {
  it('accepts the page the builder produces', () => {
    expect(errorsOf(valid())).toEqual([])
  })

  it.each([
    [
      'not marked noindex',
      (h: string) => h.replace('noindex,follow', 'index,follow'),
      '404.html is not marked noindex',
    ],
    [
      'no robots tag',
      (h: string) => h.replace(/<meta name="robots"[^>]*>/, ''),
      '404.html is not marked noindex',
    ],
    [
      'a canonical link',
      (h: string) =>
        h.replace('</head>', '<link rel="canonical" href="https://www.pqctoday.com/"></head>'),
      '404.html has a canonical link',
    ],
    [
      'structured data',
      (h: string) => h.replace('</head>', '<script type="application/ld+json">{}</script></head>'),
      '404.html has structured data',
    ],
    [
      'an og:url',
      (h: string) =>
        h.replace('</head>', '<meta property="og:url" content="https://www.pqctoday.com/"></head>'),
      '404.html has an og:url',
    ],
    [
      'another title',
      (h: string) => h.replace(NOT_FOUND_TITLE, 'PQC Today'),
      '404.html does not have the not-found title',
    ],
    [
      'no #root',
      (h: string) => h.replace('id="root"', 'id="app"'),
      '404.html has no #root, so the app could not start from it',
    ],
    [
      'no heading',
      (h: string) => h.replace('<h1>Page not found</h1>', ''),
      '404.html needs exactly one <h1>',
    ],
    [
      'two headings',
      (h: string) => h.replace('</main>', '<h1>More</h1></main>'),
      '404.html needs exactly one <h1>',
    ],
    [
      'a heading that does not say not found',
      (h: string) => h.replace('Page not found</h1>', 'Welcome</h1>'),
      '404.html does not say the page was not found',
    ],
    [
      'a prerender marker',
      (h: string) => h.replace('<div id="root"', '<div id="root" data-prerender-state="ready"'),
      '404.html still carries a prerender marker from the page it was copied from',
    ],
    [
      'no app script',
      (h: string) => h.replace(/<script type="module"[^>]*><\/script>/, ''),
      '404.html does not load the app, so addresses only the app knows would not work',
    ],
  ])('%s', (_name, change, expected) => {
    const base = buildNotFoundPage(PRERENDERED_HOME)
    const changed = change(base)
    expect(changed).not.toBe(base)
    expect(errorsOf(changed)).toContain(expected)
  })
})

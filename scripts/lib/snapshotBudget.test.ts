// SPDX-License-Identifier: GPL-3.0-only
import { JSDOM } from 'jsdom'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  MAX_INTACT_ITEMS,
  MIN_INTACT_ITEMS,
  SNAPSHOT_MAX_BYTES,
  SNAPSHOT_TARGET_BYTES,
  boundSnapshot,
  byteLength,
  type BoundResult,
  differences,
  fingerprint,
} from './snapshotBudget'

/** A page that is one long list of cards, each with the markup a real card carries. */
function listPage(cards: number, extra = ''): string {
  const card = (n: number) =>
    `<div class="glass-panel p-3.5 rounded-xl border border-border bg-card/60 hover:border-primary/50" data-card="${n}" style="opacity:1">` +
    `<svg class="h-4 w-4 text-primary" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h18v18H3z"/></svg>` +
    `<h3 class="font-semibold text-[13px] text-foreground">Item ${n} heading</h3>` +
    `<p class="text-[11.5px] text-muted-foreground leading-snug">Item ${n} says something useful about migration planning and key management.</p>` +
    `<a class="text-primary underline-offset-2" href="/library?ref=item-${n}">Open item ${n}</a>` +
    `<button class="btn" aria-pressed="false">Save item ${n}</button></div>`
  return (
    `<!DOCTYPE html><html><head><title>The list</title><meta name="description" content="A long list.">` +
    `<link rel="canonical" href="https://www.pqctoday.com/list">` +
    `<script type="application/ld+json">{"@type":"CollectionPage","name":"The list"}</script></head>` +
    `<body><div id="root"><nav><a href="/">Home</a><a href="/learn">Learn</a></nav>` +
    `<main id="main-content"><h1>The list</h1><h2>Why this list</h2><p>An introduction.</p>` +
    `<div class="grid grid-cols-1 gap-3">${Array.from({ length: cards }, (_, i) => card(i + 1)).join('')}</div>` +
    `${extra}<h2>After the list</h2><p>Closing words.</p></main></div></body></html>`
  )
}

const parse = (html: string) => new JSDOM(html).window.document
const listOf = (html: string) =>
  Array.from(parse(html).querySelector('#root .grid')!.children).map((c) => c.outerHTML)

const CARDS = 200
const RAW = listPage(CARDS)
/** Small enough that the page must be compacted, big enough that some items can stay intact. */
const TARGET = Math.floor(byteLength(RAW) * 0.45)

describe('boundSnapshot: a page within the target', () => {
  it('is returned exactly as captured', () => {
    const result = boundSnapshot(RAW, byteLength(RAW))
    expect(result.html).toBe(RAW)
    expect(result.compacted).toBeNull()
    expect(result.bytes).toBe(byteLength(RAW))
  })

  it('is left alone when it has no long list to compact, even over the target', () => {
    const small = listPage(5)
    const result = boundSnapshot(small, 100)
    expect(result.html).toBe(small)
    expect(result.compacted).toBeNull()
  })
})

describe('boundSnapshot: a page over the target', () => {
  // Run inside the suite, so a fault in the compaction fails these tests rather than the whole file.
  let result!: BoundResult
  beforeAll(() => {
    result = boundSnapshot(RAW, TARGET)
  })

  it('is brought within the target', () => {
    expect(result.compacted).not.toBeNull()
    expect(result.bytes).toBeLessThanOrEqual(TARGET)
    expect(result.bytes).toBeLessThan(result.originalBytes)
    expect(result.compacted).toMatchObject({ items: CARDS })
  })

  it('keeps the first items exactly as captured, byte for byte', () => {
    const raw = listOf(RAW)
    const out = listOf(result.html)
    const { intact } = result.compacted!
    expect(intact).toBeGreaterThanOrEqual(MIN_INTACT_ITEMS)
    expect(out.slice(0, intact)).toEqual(raw.slice(0, intact))
  })

  it('reduces the rest to their content: no classes, styles, data attributes or icons', () => {
    const { intact } = result.compacted!
    for (const html of listOf(result.html).slice(intact)) {
      expect(html).not.toMatch(/class=|style=|data-card|<svg|aria-pressed/)
      expect(html).toContain('<h3>')
      expect(html).toContain('href="/library?ref=item-')
    }
  })

  it('drops nothing: every link, every word, every heading and the whole head are as before', () => {
    const before = fingerprint(parse(RAW))
    const after = fingerprint(parse(result.html))
    expect(differences(before, after)).toEqual([])
    expect(after.links).toEqual(before.links)
    expect(after.text).toBe(before.text)
    expect(after.headings).toEqual(before.headings)
    expect(after.head).toBe(before.head)
    expect(after.links.filter((l) => l.startsWith('/library?ref=item-'))).toHaveLength(CARDS)
  })

  it('keeps the single h1, the structured data, the canonical and the description', () => {
    const document = parse(result.html)
    expect(document.querySelectorAll('h1')).toHaveLength(1)
    expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toBe(
      '{"@type":"CollectionPage","name":"The list"}'
    )
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://www.pqctoday.com/list'
    )
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'A long list.'
    )
  })

  it('marks the compacted list so a reader of the saved page can see what was done', () => {
    expect(
      parse(result.html).querySelector('#root .grid')?.getAttribute('data-snapshot-compacted')
    ).toBe(`${result.compacted!.intact}/${CARDS}`)
  })

  it('gives the same result every time', () => {
    expect(boundSnapshot(RAW, TARGET).html).toBe(result.html)
  })
})

describe('boundSnapshot: how many items stay intact', () => {
  const total = byteLength(RAW)

  it('keeps as many as fit, up to the maximum, when little needs to go', () => {
    expect(boundSnapshot(RAW, total - 1000).compacted!.intact).toBe(MAX_INTACT_ITEMS)
  })

  it('keeps fewer when the target is tight, but never fewer than the first screens', () => {
    const tight = boundSnapshot(RAW, 1)
    expect(tight.compacted!.intact).toBe(MIN_INTACT_ITEMS)
    const between = boundSnapshot(RAW, TARGET)
    expect(between.compacted!.intact).toBeGreaterThanOrEqual(MIN_INTACT_ITEMS)
    expect(between.compacted!.intact).toBeLessThanOrEqual(MAX_INTACT_ITEMS)
  })

  it('does its best and does not throw when the page cannot reach the target', () => {
    const result = boundSnapshot(RAW, 1)
    expect(result.bytes).toBeGreaterThan(1)
    expect(result.bytes).toBeLessThan(result.originalBytes)
  })

  it('has sensible limits', () => {
    expect(SNAPSHOT_TARGET_BYTES).toBeLessThan(SNAPSHOT_MAX_BYTES)
    expect(SNAPSHOT_MAX_BYTES).toBeLessThan(2 * 1024 * 1024)
  })
})

describe('the check that nothing was dropped catches a fault', () => {
  const raw = fingerprint(parse(RAW))
  const faulty = (mutate: (html: string) => string) => fingerprint(parse(mutate(RAW)))

  it('notices one missing link', () => {
    const lost = faulty((html) =>
      html.replace(
        '<a class="text-primary underline-offset-2" href="/library?ref=item-77">Open item 77</a>',
        ''
      )
    )
    // the link's own words go with it, so the text differs as well
    expect(differences(raw, lost)).toContainEqual(expect.stringContaining('links'))
  })

  it('notices one missing heading', () => {
    const lost = faulty((html) =>
      html.replace(
        '<h3 class="font-semibold text-[13px] text-foreground">Item 150 heading</h3>',
        ''
      )
    )
    expect(differences(raw, lost)).toContainEqual(expect.stringContaining('headings'))
  })

  it('notices one missing word', () => {
    const lost = faulty((html) => html.replace('Closing words.', 'Closing.'))
    expect(differences(raw, lost)).toEqual([expect.stringContaining('visible text')])
  })

  it('notices a changed head', () => {
    const lost = faulty((html) => html.replace('<title>The list</title>', '<title>Another</title>'))
    expect(differences(raw, lost)).toEqual(['head'])
  })

  it('does not mind presentation changes', () => {
    const same = faulty((html) => html.replace(/ class="[^"]*"/g, ''))
    expect(differences(raw, same)).toEqual([])
  })
})

describe('boundSnapshot refuses a reduction that drops something', () => {
  const dropFirst = (selector: string) => (item: Element) => {
    const clone = item.cloneNode(true) as Element
    clone.querySelector(selector)?.remove()
    return clone
  }

  it('throws when a link is dropped', () => {
    expect(() => boundSnapshot(RAW, TARGET, dropFirst('a[href]'))).toThrow(/links/)
  })

  it('throws when a heading is dropped', () => {
    expect(() => boundSnapshot(RAW, TARGET, dropFirst('h3'))).toThrow(/headings/)
  })

  it('throws when text is dropped', () => {
    expect(() => boundSnapshot(RAW, TARGET, dropFirst('p'))).toThrow(/visible text/)
  })
})

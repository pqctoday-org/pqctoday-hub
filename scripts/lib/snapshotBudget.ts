// SPDX-License-Identifier: GPL-3.0-only
import { JSDOM } from 'jsdom'

/**
 * Keeps the saved copy of a page small without taking anything out of it.
 *
 * Search engines read only the first 2 MB of a page's HTML (measured uncompressed), and every
 * visitor downloads the saved copy before the app starts. A few pages are one long list (the whole
 * library, the full changelog, every community profile), so their saved copy ran to several MB.
 *
 * Over the target size, the page's biggest repeated list keeps its first items exactly as they are
 * and the rest are reduced to their content: every heading, every word of text and every link stays,
 * and only presentation (classes, styles, icons, data attributes) is removed. The app replaces the
 * saved copy when it starts, so what visitors see is unchanged.
 *
 * Nothing is dropped, and each call proves it: the link targets, the visible text, the headings and
 * the whole <head> are compared before and after, and any difference throws.
 */

export const SNAPSHOT_TARGET_BYTES = Math.floor(1.5 * 1024 * 1024)
/** The build fails above this; search engines stop reading at 2 MB. */
export const SNAPSHOT_MAX_BYTES = Math.floor(1.9 * 1024 * 1024)
/** The first items of the list left exactly as captured: as many as fit, up to this many. */
export const MAX_INTACT_ITEMS = 25
/** ...but never fewer than this (the first screens), unless the list is shorter. */
export const MIN_INTACT_ITEMS = 12
/** A group of siblings counts as a list worth compacting from this many items. */
export const MIN_LIST_ITEMS = 20

/** Attributes that carry meaning for a reader or a crawler; every other attribute is presentation. */
const KEPT_ATTRIBUTES = new Set([
  'href',
  'src',
  'alt',
  'id',
  'lang',
  'datetime',
  'colspan',
  'rowspan',
  'scope',
  'headers',
  'role',
  'title',
  'name',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
])

export const byteLength = (text: string): number => Buffer.byteLength(text, 'utf8')

const collapse = (text: string | null): string => (text ?? '').replace(/\s+/g, ' ').trim()

/** Everything a reader or a crawler takes from a page that compaction must leave alone. */
export interface Fingerprint {
  /** Every link target, sorted, so a link moved or removed shows up. */
  links: string[]
  /** All visible text in the app's root, whitespace collapsed. */
  text: string
  /** Every heading as "H2: text", sorted. */
  headings: string[]
  /** The whole <head>: title, description, canonical, robots, structured data. */
  head: string
}

export function fingerprint(document: Document): Fingerprint {
  const root = document.querySelector('#root') ?? document.body
  return {
    links: Array.from(root.querySelectorAll('a[href]'))
      .map((link) => link.getAttribute('href') ?? '')
      .sort(),
    text: collapse(root.textContent),
    headings: Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6'))
      .map((heading) => `${heading.tagName}: ${collapse(heading.textContent)}`)
      .sort(),
    head: document.head.outerHTML,
  }
}

/** Which parts of two fingerprints differ; empty when nothing was dropped or changed. */
export function differences(before: Fingerprint, after: Fingerprint): string[] {
  const out: string[] = []
  if (before.links.join('\n') !== after.links.join('\n'))
    out.push(`links (${before.links.length} before, ${after.links.length} after)`)
  if (before.text !== after.text)
    out.push(`visible text (${before.text.length} characters before, ${after.text.length} after)`)
  if (before.headings.join('\n') !== after.headings.join('\n'))
    out.push(`headings (${before.headings.length} before, ${after.headings.length} after)`)
  if (before.head !== after.head) out.push('head')
  return out
}

/** The item reduced to its content: tags, text, links and meaningful attributes only. */
function compactItem(item: Element): Element {
  const clone = item.cloneNode(true) as Element
  // Icons carry no text; an icon that holds text or a link is kept.
  for (const svg of Array.from(clone.querySelectorAll('svg'))) {
    if (!collapse(svg.textContent) && !svg.querySelector('a')) svg.remove()
  }
  for (const element of [clone, ...Array.from(clone.querySelectorAll('*'))]) {
    for (const attribute of Array.from(element.attributes)) {
      if (!KEPT_ATTRIBUTES.has(attribute.name)) element.removeAttribute(attribute.name)
    }
  }
  return clone
}

/** The largest group of same-tag siblings in the app's root, with how many bytes it holds. */
function largestList(root: Element): { parent: Element; items: Element[]; bytes: number } | null {
  let best: { parent: Element; items: Element[]; bytes: number } | null = null
  for (const parent of [root, ...Array.from(root.querySelectorAll('*'))]) {
    const children = Array.from(parent.children)
    const first = children[0]
    if (!first || children.length < MIN_LIST_ITEMS) continue
    const items = children.filter((child) => child.tagName === first.tagName)
    if (items.length < MIN_LIST_ITEMS) continue
    const bytes = items.reduce((sum, item) => sum + byteLength(item.outerHTML), 0)
    if (!best || bytes > best.bytes) best = { parent, items, bytes }
  }
  return best
}

export interface BoundResult {
  /** The page to save: the input unchanged when it is within the target. */
  html: string
  bytes: number
  /** Size of the page as captured, before any compaction. */
  originalBytes: number
  /** Present when the page was compacted. */
  compacted: null | { items: number; intact: number; list: string }
}

/**
 * Bring a saved page within `target` bytes by compacting its biggest list. A page already within the
 * target, or one with no long list, is returned as it is; the size gate in validateSnapshot then
 * decides whether a page that is still too big may be published.
 */
export function boundSnapshot(
  html: string,
  target = SNAPSHOT_TARGET_BYTES,
  /** How an item is reduced; a parameter only so a test can prove a faulty reduction is caught. */
  reduce: typeof compactItem = compactItem
): BoundResult {
  const originalBytes = byteLength(html)
  const unchanged: BoundResult = { html, bytes: originalBytes, originalBytes, compacted: null }
  if (originalBytes <= target) return unchanged

  const dom = new JSDOM(html)
  const { document } = dom.window
  const root = document.querySelector('#root')
  const list = root ? largestList(root) : null
  if (!list || list.items.length <= MIN_INTACT_ITEMS) return unchanged

  const pairs = list.items.map((item) => {
    const reduced = reduce(item)
    return { item, reduced, saving: byteLength(item.outerHTML) - byteLength(reduced.outerHTML) }
  })
  const current = byteLength(dom.serialize())

  // As many items as fit stay intact, from MAX_INTACT_ITEMS down to MIN_INTACT_ITEMS.
  const most = Math.min(MAX_INTACT_ITEMS, pairs.length)
  let intact = Math.min(MIN_INTACT_ITEMS, pairs.length)
  for (let k = most; k >= intact; k--) {
    const size = current - pairs.slice(k).reduce((sum, pair) => sum + pair.saving, 0)
    if (size <= target) {
      intact = k
      break
    }
  }

  const before = fingerprint(document)
  for (const { item, reduced } of pairs.slice(intact)) item.replaceWith(reduced)
  list.parent.setAttribute('data-snapshot-compacted', `${intact}/${pairs.length}`)
  const broken = differences(before, fingerprint(document))
  if (broken.length > 0)
    throw new Error(`compaction changed the page's content: ${broken.join('; ')}`)

  const out = dom.serialize()
  const parent = list.parent
  return {
    html: out,
    bytes: byteLength(out),
    originalBytes,
    compacted: {
      items: list.items.length,
      intact,
      list: `${parent.tagName.toLowerCase()}${parent.id ? `#${parent.id}` : ''}`,
    },
  }
}

// SPDX-License-Identifier: AGPL-3.0-only
import type { KnowledgeCore, KnowledgeLink, KnowledgeRecord } from './knowledgeTypes'

/**
 * A name as the generator keys its alias table: accents and case folded away, every run of other characters one space.
 * (The same rule as `norm_name` in the private generator; `knowledgeReader.test.ts` checks it against the table.)
 */
export function normName(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0080-\uffff]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export type ResolveHow = 'tag' | 'alias' | 'link' | 'former-id'

export interface Resolution {
  record: KnowledgeRecord
  how: ResolveHow
}

export type Lookup =
  | { found: true; record: KnowledgeRecord; how: ResolveHow }
  | { found: false; reason: 'unknown' }
  | { found: false; reason: 'ambiguous'; candidates: KnowledgeRecord[] }

const IDENTITY = new Set(['former-id', 'navigate-node'])

/** One reader over the core file: look a tag, a former id, a name or a link up; walk parts and links. */
export class KnowledgeReader {
  readonly byTag = new Map<string, KnowledgeRecord>()
  private readonly byLink = new Map<string, KnowledgeRecord[]>()
  private readonly children = new Map<string, KnowledgeRecord[]>()
  private readonly linksFrom = new Map<string, KnowledgeLink[]>()
  private readonly linksTo = new Map<string, KnowledgeLink[]>()

  readonly core: KnowledgeCore

  constructor(core: KnowledgeCore) {
    this.core = core
    for (const r of core.records) {
      this.byTag.set(r.id, r)
      const list = this.byLink.get(r.link) ?? []
      list.push(r)
      this.byLink.set(r.link, list)
    }
    for (const r of core.records) {
      if (r.parent) {
        const list = this.children.get(r.parent) ?? []
        list.push(r)
        this.children.set(r.parent, list)
      }
    }
    for (const list of this.children.values()) {
      list.sort((a, b) => Number(a.pos ?? 0) - Number(b.pos ?? 0) || (a.id < b.id ? -1 : 1))
    }
    for (const l of core.links) {
      this.linksFrom.set(l[0], [...(this.linksFrom.get(l[0]) ?? []), l])
      this.linksTo.set(l[2], [...(this.linksTo.get(l[2]) ?? []), l])
    }
  }

  get(tag: string): KnowledgeRecord | undefined {
    return this.byTag.get(tag)
  }

  /** The Hub address a tag opens, or undefined for a tag the model does not have. */
  linkOf(tag: string): string | undefined {
    return this.byTag.get(tag)?.link
  }

  /** Records of the given tag's parts, in their order (a lesson's sections and steps, a stage's lessons). */
  partsOf(tag: string): KnowledgeRecord[] {
    return this.children.get(tag) ?? []
  }

  /** The chain of parents from the record up to the top of its tree, nearest first. */
  parentChain(tag: string): KnowledgeRecord[] {
    const out: KnowledgeRecord[] = []
    const seen = new Set<string>()
    let cur = this.byTag.get(tag)?.parent
    while (cur && !seen.has(cur)) {
      seen.add(cur)
      const r = this.byTag.get(cur)
      if (!r) break
      out.push(r)
      cur = r.parent
    }
    return out
  }

  linksOf(tag: string): { out: KnowledgeLink[]; in: KnowledgeLink[] } {
    return { out: this.linksFrom.get(tag) ?? [], in: this.linksTo.get(tag) ?? [] }
  }

  /**
   * What a visitor typed or followed: a tag (exact), then a former id or a name (the alias table), then an address.
   * A name that fits several records is `ambiguous`, never guessed; the same tag is never ambiguous.
   */
  lookup(input: string): Lookup {
    const text = input.trim()
    const exact = this.byTag.get(text)
    if (exact) return { found: true, record: exact, how: 'tag' }
    const entries = this.core.aliases[normName(text)] ?? []
    const ids = [...new Set(entries.map((e) => e[0]))]
    if (ids.length === 1) {
      const how: ResolveHow = entries.some((e) => IDENTITY.has(e[1])) ? 'former-id' : 'alias'
      const record = this.byTag.get(ids[0])
      if (record) return { found: true, record, how }
    }
    if (ids.length > 1) {
      const idKinds = ids.filter((id) => entries.some((e) => e[0] === id && IDENTITY.has(e[1])))
      if (idKinds.length === 1) {
        const record = this.byTag.get(idKinds[0])
        if (record) return { found: true, record, how: 'former-id' }
      }
      return {
        found: false,
        reason: 'ambiguous',
        candidates: ids.flatMap((id) => this.byTag.get(id) ?? []),
      }
    }
    const byLink = this.byLink.get(text)
    if (byLink) {
      const top = byLink.filter((r) => !r.parent)
      const pick = byLink.length === 1 ? byLink[0] : top.length === 1 ? top[0] : undefined
      if (pick) return { found: true, record: pick, how: 'link' }
    }
    return { found: false, reason: 'unknown' }
  }
}

let corePromise: Promise<KnowledgeReader> | null = null

/** The core file, fetched once (it is served beside the other data files) and read as one reader. */
export function loadKnowledgeReader(url = '/data/knowledge-core.json'): Promise<KnowledgeReader> {
  corePromise ??= fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(`knowledge core: ${res.status}`)
    return new KnowledgeReader((await res.json()) as KnowledgeCore)
  })
  corePromise.catch(() => {
    corePromise = null
  })
  return corePromise
}

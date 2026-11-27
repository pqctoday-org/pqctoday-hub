// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The answer engine, whole: question in, AnswerModel out.
 * It reads the Hub through a `Catalogue` (resources, passages, curriculum, dimensions, role paths) and the strict reader's model;
 * both are what the Hub's knowledge-file reader supplies. Rules, orders, notes and weights come from `data.generated.json`.
 */
import { Engine, normName, type Data, type Reading } from './engine'
import { Strict, type Model, type Rec, type Result } from './strict'

export interface Resource { link: string; title: string; type: string; group: string; extract: string; record_ids: string[]; passages: number[] }
export interface Passage { link: string; title: string; text: string; source: string }
export interface Catalogue {
  resources: Resource[]
  passages: Passage[]
  curriculum: { modules: Record<string, any>; stages: Record<string, string> } | null
  paid?: string[]                                                    // library documents marked as paid standards: linked, never quoted
  rolePaths?: Record<string, { first: string[]; rest: string[] }>   // the core's `PATH:<role>` records: the lessons of the path and those under "more"
  dims: Record<string, { industry: string[]; place: string[] }>
  inputs: string[]            // the data files the model was read from (for the evidence line)
  filePrefix: Record<string, string | null>
}
type Item = Record<string, any>
const GROUPS = ['Learn', 'References', 'Tools', 'Data pages']
const PER_GROUP = 3
const STRONG = 2.0
/** A row the plain text match adds beside the finders' rows must hold this many different words of the question: one rare word alone ("ok", "new") is not a match. */
const PLAIN_MIN_WORDS = 2
/** The reader's confidence when it recognised nothing in the question (no name, no shape): the reading is broad by default, not because the question is. */
const UNREAD = 0.1
const INTRODUCTION = 'post-quantum cryptography introduction basics' // what a request with no topic of its own is searched by
/** A single word that stands in more than this share of the resources' titles is the subject of the whole Hub ("quantum" is in about one title in ten; "security" in one in twenty; "5g" in three in a thousand). */
const WHOLE_SUBJECT_SHARE = 0.075
const STOP = new Set('the a an of to in on for and or is are was were be what which who whom how does do did can could would should i me my we our you your it its this that these those with by from about tell show give please there any some as at into if when where why'.split(' '))
const ASK = new Set('list show find tell explain describe learn lesson lessons module modules section sections tool tools tutorial course page pages information info resource resources material materials guide guides example examples understand know want need looking look use using work works available offer offers provide get give help site hub'.split(' '))
const GENERIC = ['handshake', 'overview', 'basics', 'fundamentals', 'protocol', 'standard', 'algorithm', 'concept', 'concepts', 'model', 'framework', 'principles']
const tokens = (t: string): string[] => String(t).toLowerCase().match(/[a-z0-9]+/g) ?? []
/** A whole number the data file keeps as a float ("1184.0") is said "1184"; other text is left alone. */
const plainValue = (t: string) => t.split('; ').map((p) => (/^-?\d+\.0+$/.test(p.trim()) ? p.trim().replace(/\.0+$/, '') : p)).join('; ')
/** How a retired record is named in "X was replaced by Y": its key with its title, unless the title already carries the key. */
const retiredName = (rec: Rec): string => {
  const key = String(rec.key ?? ''), label = String(rec.label ?? '')
  if (!key || label.toLowerCase().includes(key.toLowerCase()) || key.length > 40) return label || key
  return `${key} (${label})`
}
/** The strict reader's "what replaced X" answer: every link of the chain carried a supporting statement it may state. */
const provenSuccessor = (res: Result): boolean => String(res.read_as ?? '').startsWith('successor:') && !!(res.chain ?? []).length && (res.evidence ?? []).length === res.chain.length
/** At most `n` characters of a source passage, cut at word boundaries and marked where it is cut; a mention of the retired record beyond
 *  the first `n` characters moves the start of the excerpt to just before it. */
const excerpt = (raw: string, key: string, n: number, fromSource = true): string => {
  const text = String(raw).split(/\s+/).filter(Boolean).join(' ')
  let start = 0
  if (text.length > n && key) {
    const i = text.toLowerCase().indexOf(key.toLowerCase())
    if (i >= 0 && i + key.length > n) start = Math.max(0, i - 100)
  }
  let lead = false
  if (start > 0) { const sp = text.indexOf(' ', start); start = sp >= 0 ? sp + 1 : start; lead = true }
  else if (fromSource && /^\p{Ll}/u.test(text) && text.includes(' ')) { start = text.indexOf(' ') + 1; lead = true }
  let win = text.slice(start, start + n)
  const tail = start + n < text.length
  if (tail && win.includes(' ')) win = win.slice(0, win.lastIndexOf(' '))
  return (lead ? '…' : '') + win.trim() + (tail ? '…' : '')
}
const round = (x: number, d: number) => { const f = 10 ** d; return Math.round(x * f) / f }
const titleCase = (s: string) => s.replace(/[A-Za-z]+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
const pageOf = (l: string) => l.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'
const escRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const cmpTuple = (a: (number | string)[], b: (number | string)[]) => { for (let i = 0; i < a.length; i++) { if (a[i] === b[i]) continue; return a[i] < b[i] ? -1 : 1 } return 0 }
/** The character codes a page's source writes for punctuation, by name. A code this table does not hold is left as it is. */
const CODES: Record<string, string> = { quot: '"', amp: '&', apos: "'", lt: '<', gt: '>', nbsp: ' ', thinsp: ' ', shy: '', mdash: '—', ndash: '–', minus: '−', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', bull: '•', middot: '·', sect: '§', times: '×', prime: '′', rarr: '→', larr: '←', uarr: '↑', darr: '↓', harr: '↔', ge: '≥', le: '≤', ne: '≠', sup1: '¹', sup2: '²', sup3: '³', alpha: 'α', beta: 'β', deg: '°', plusmn: '±', copy: '©', reg: '®', trade: '™' }
/** Text with its character codes ("&quot;", "&mdash;", "&#8217;", "&#x2019;") written as the characters a reader sees. One pass: "&amp;quot;" becomes "&quot;". */
export function decodeCodes(text: string): string {
  const s = String(text ?? '')
  if (!s.includes('&')) return s
  return s.replace(/&(#[0-9]{1,7}|#[xX][0-9a-fA-F]{1,6}|[A-Za-z][A-Za-z0-9]{1,8});/g, (m: string, c: string) => {
    if (c[0] === '#') {
      const n = c[1] === 'x' || c[1] === 'X' ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10)
      return n >= 32 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : m
    }
    return Object.prototype.hasOwnProperty.call(CODES, c) ? CODES[c] : m
  })
}
/** A line of a record's text that only places the record in the Hub's own lists ("Index: 0", "List: workshop_steps", "Paths: developer", "Module: tls-basics"): never shown. */
export const STRUCTURE = /^(?:Index: [0-9]+|List: [a-z0-9_]+|Paths: [a-z0-9_,; -]+|Module: [a-z0-9]+(?:-[a-z0-9]+)*)$/
const HEADER = /^(?:Module|Component|Term|Reference|Title|Learning Module|Document|Section|Category):\s*/i
/** A line that gives one field of a record ("Status: Final"): searched, never shown as a sentence. */
const FIELD = /^[A-Z][A-Za-z0-9 /&()'-]{0,40}: /
/** Where one sentence ends and the next begins, in text whose spaces are single. */
const SENTENCE = /(?<=[.!?]) (?=[A-Z0-9"“(\[])/
/** The fewest words a sentence must have to open an extract: a heading or a label is not a sentence. */
const SENTENCE_MIN_WORDS = 5
/** A sentence ends as one: a table cell, a label or a line cut short is searched, never shown as a sentence. */
const SENTENCE_END = /[.!?]["”')\]]?$/
/** A sentence starts as one: the first words of a passage cut from a longer text may not, and are never shown. */
const SENTENCE_START = /^[A-Z0-9"“‘'(\[]/
/** A matched sentence replaces a record's own first lines only when it holds at least this share of the question's words, by weight. */
const MATCH_SHARE = 0.5
/** The sources of passages whose text is never shown as an extract: a known-answer test, and the passages kept from a document's own text. */
const NOT_SHOWN = ['known-answer test', 'library']
/** The sentences of a passage that may be shown, in order: its lines without titles, headings, structure and field lines, cut into sentences that start and end as one. */
function sentencesOf(text: string): string[] {
  const out: string[] = []
  for (const raw of String(text || '').split(/\r?\n/)) {
    let line = raw.replace(/\s+/g, ' ').trim()
    if (!line || line[0] === '#' || STRUCTURE.test(line) || HEADER.test(line) || FIELD.test(line)) continue
    line = line.replace(/^[-*•] /, '').replace(/\*\*/g, '').trim()
    for (const s of line.split(SENTENCE)) if (SENTENCE_START.test(s) && SENTENCE_END.test(s) && !FIELD.test(s)) out.push(s)
  }
  return out
}
/**
 * The part of a passage that says most about the question: it starts at the sentence that holds the most of the question's words by weight
 * (the first such sentence) and runs on, at most `limit` characters, cut at a word. `weights` gives each word of the question and its
 * weight, in a fixed order; `held` is the weight that sentence holds. Null when no sentence holds a word of the question.
 */
export function matchedExtract(text: string, weights: [string, number][], limit = 240): { text: string; held: number } | null {
  const sents = sentencesOf(text)
  let best = -1, held = 0
  sents.forEach((s, i) => {
    const toks = new Set(tokens(s))
    if (toks.size < SENTENCE_MIN_WORDS) return
    let n = 0
    for (const [w, x] of weights) if (toks.has(w)) n += x
    if (n > held) { held = n; best = i }
  })
  if (best < 0) return null
  let out = ''
  for (let i = best; i < sents.length && Array.from(out).length <= limit; i++) out += (out ? ' ' : '') + sents[i]
  const chars = Array.from(out)
  if (chars.length > limit) { const cut = chars.slice(0, limit).join(''); const i = cut.lastIndexOf(' '); out = (i >= 0 ? cut.slice(0, i) : cut) + '…' }
  return { text: out, held }
}
const extractOf = (raw: string, limit = 240): string => {
  const text = decodeCodes(raw)
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !STRUCTURE.test(l))
  const body = lines.filter((l) => !HEADER.test(l))
  const out = (body.length ? body : lines.map((l) => l.replace(HEADER, ''))).join(' ').replace(/\s+/g, ' ').trim()
  if (out.length > limit) { const cut = out.slice(0, limit); const i = cut.lastIndexOf(' '); return (i >= 0 ? cut.slice(0, i) : cut) + '…' }
  return out
}

class Search {
  post = new Map<string, [number, number][]>()
  len: number[] = []
  n: number
  avg: number
  private passages: Passage[]
  private k1: number
  private b: number
  constructor(passages: Passage[], k1 = 1.2, b = 0.75) {
    this.passages = passages
    this.k1 = k1
    this.b = b
    passages.forEach((p, i) => {
      const tf = new Map<string, number>()
      for (const w of [...tokens(p.title), ...tokens(p.title), ...tokens(p.text)]) tf.set(w, (tf.get(w) ?? 0) + 1)
      let total = 0
      for (const [w, f] of tf) { total += f; const a = this.post.get(w); if (a) a.push([i, f]); else this.post.set(w, [[i, f]]) }
      this.len.push(total)
    })
    this.n = this.len.length
    this.avg = this.n ? this.len.reduce((a, c) => a + c, 0) / this.n : 1
  }
  /** The passages that match the question's words, best first. With `minWords`, a passage must hold at least that many different words of the question (or every word the index knows, when the question has fewer), or one of the `enough` words. */
  hits(question: string, k = 200, minWords = 1, enough: string[] = []): [number, number][] {
    const score = new Map<number, number>()
    const held = new Map<number, number>()
    const alone = new Set(enough)
    const kept = new Set<number>()
    let known = 0
    for (const w of [...new Set(tokens(question).filter((t) => !STOP.has(t)))].sort()) {
      const plist = this.post.get(w)
      if (!plist) continue
      known++
      const idf = Math.log(1 + (this.n - plist.length + 0.5) / (plist.length + 0.5))
      for (const [i, f] of plist) { score.set(i, (score.get(i) ?? 0) + (idf * f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * this.len[i]) / this.avg))); held.set(i, (held.get(i) ?? 0) + 1); if (alone.has(w)) kept.add(i) }
    }
    const need = Math.min(minWords, known)
    return [...score.entries()].filter(([i]) => (held.get(i) ?? 0) >= need || kept.has(i)).map(([i, s]) => [s, i] as [number, number]).sort((x, y) => y[0] - x[0] || x[1] - y[1]).slice(0, k)
  }
  resources(question: string, k = 60, minWords = 1, enough: string[] = []): { link: string; score: number; passage: number }[] {
    const out: { link: string; score: number; passage: number }[] = []
    const seen = new Set<string>()
    for (const [s, i] of this.hits(question, 200, minWords, enough)) {
      const link = this.passages[i].link
      if (seen.has(link)) continue
      seen.add(link)
      out.push({ link, score: round(s, 3), passage: i })
      if (out.length >= k) break
    }
    return out
  }
}

class ResIndex {
  post = new Map<string, [number, number][]>()
  /** In how many resources' titles each word stands. */
  inTitles = new Map<string, number>()
  len: number[] = []
  links: string[]
  n: number
  avg: number
  private k1: number
  private b: number
  constructor(res: Resource[], k1 = 1.2, b = 0.5) {
    this.k1 = k1
    this.b = b
    this.links = res.map((r) => r.link)
    res.forEach((r, i) => {
      const tf = new Map<string, number>()
      for (const w of [...tokens(r.title), ...tokens(r.title), ...tokens(r.title), ...tokens(r.extract)]) tf.set(w, (tf.get(w) ?? 0) + 1)
      for (const w of new Set(tokens(r.title))) this.inTitles.set(w, (this.inTitles.get(w) ?? 0) + 1)
      let total = 0
      for (const [w, f] of tf) { total += f; const a = this.post.get(w); if (a) a.push([i, f]); else this.post.set(w, [[i, f]]) }
      this.len.push(total)
    })
    this.n = this.links.length
    this.avg = this.len.reduce((a, c) => a + c, 0) / Math.max(1, this.n)
  }
  /** The share of the resources whose title holds the word. */
  titleShare(w: string): number { return (this.inTitles.get(w) ?? 0) / Math.max(1, this.n) }
  idf(w: string): number { const n = this.post.get(w)?.length ?? 0; return Math.log(1 + (this.n - n + 0.5) / (n + 0.5)) }
  scores(words: string[]): Map<string, number> {
    const out = new Map<string, number>()
    for (const w of [...words].sort()) {
      const plist = this.post.get(w)
      if (!plist) continue
      const idf = this.idf(w)
      for (const [i, f] of plist) out.set(this.links[i], (out.get(this.links[i]) ?? 0) + (idf * f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * this.len[i]) / this.avg)))
    }
    return out
  }
}

/** A status that does not retire a record: no status at all (undefined or null), an empty one, or "active". */
export function isActiveStatus(s: string | null | undefined): boolean { return s === undefined || s === null || s === '' || s === 'active' }

/** The link with its path in lower case and without a trailing slash (a link to another site is left as it is). */
function pagePath(link: string): string {
  if (!link.startsWith('/')) return link
  const q = link.indexOf('?')
  const head = q < 0 ? link : link.slice(0, q)
  const tail = q < 0 ? '' : link.slice(q)
  const h = head.indexOf('#')
  const path = h < 0 ? head : head.slice(0, h)
  const frag = h < 0 ? '' : head.slice(h)
  return (path.replace(/\/+$/, '') || '/').toLowerCase() + frag + tail
}

/** The link with its path normalised (`pagePath`) and every alias parameter written as its canonical one, so that two spellings the Hub opens as one page compare equal (the id wins when both are present). */
export function canonicalLink(raw: string, aliases: { path: string; alias: string; canonical: string }[]): string {
  const link = pagePath(raw)
  const q = link.indexOf('?')
  if (q < 0) return link
  const base = link.slice(0, q)
  let rest = link.slice(q + 1)
  const path = base.split('#')[0].replace(/\/+$/, '') || '/'
  for (const al of aliases) {
    if (path !== al.path) continue
    const h = rest.indexOf('#')
    const query = h < 0 ? rest : rest.slice(0, h)
    const frag = h < 0 ? '' : rest.slice(h)
    const parts = query.split('&')
    const hasCanon = parts.some((p) => p.startsWith(al.canonical + '=') && p !== al.canonical + '=')
    const hasAlias = parts.some((p) => p.startsWith(al.alias + '='))
    const out: string[] = []
    for (let p of parts) {
      if (hasAlias && p === al.canonical + '=') continue
      if (p.startsWith(al.alias + '=')) { if (hasCanon) continue; p = al.canonical + p.slice(al.alias.length) }
      out.push(p)
    }
    rest = out.join('&') + frag
  }
  return base + '?' + rest
}

export class Answerer {
  strict: Strict
  engine: Engine
  search: Search
  res: ResIndex
  resByLink = new Map<string, Resource>()
  recOfLink = new Map<string, string[]>()
  recOfKey = new Map<string, string[]>()
  linkOfRec = new Map<string, string>()
  private raw = new Map<string, Result>()
  private personaPaths: Map<string, string[]> | null = null
  private near: Map<string, Set<string>> | null = null
  private paid: Set<string>
  private data: any
  private cat: Catalogue
  private model: Model
  constructor(data: any, cat: Catalogue, model: Model, strictPatterns: any, statements: any, docHashes: any) {
    this.data = data
    this.cat = cat
    this.paid = new Set(cat.paid ?? [])
    this.model = model
    this.strict = new Strict(model, strictPatterns, statements, docHashes)
    const names = { aliases: model.aliases, types: Object.fromEntries(model.records.map((r) => [r.id, r.type])) }
    this.engine = new Engine(data as Data, names)
    this.search = new Search(cat.passages)
    this.res = new ResIndex(cat.resources)
    for (const r of cat.resources) this.resByLink.set(r.link, r)
    for (const r of model.records) if (r.link) { this.linkOfRec.set(r.id, r.link); const a = this.recOfLink.get(r.link); if (a) a.push(r.id); else this.recOfLink.set(r.link, [r.id]) }
    for (const [link, ids] of this.recOfLink) { const k = this.linkKey(link); const a = this.recOfKey.get(k); if (a) a.push(...ids); else this.recOfKey.set(k, [...ids]) }
    // a page record of the link comes first (as in the catalogue); the sort is stable
    for (const ids of this.recOfLink.values()) ids.sort((a, b) => Number(this.strict.records.get(a)!.type !== 'page') - Number(this.strict.records.get(b)!.type !== 'page'))
  }
  /** The key a link is looked up by in the records that own it: its canonical spelling without a fragment. */
  linkKey(link: string): string { return canonicalLink(link, this.data.link_aliases ?? []).split('#')[0] }
  recordsOfLink(link: string): string[] { return this.recOfKey.get(this.linkKey(link)) ?? [] }
  rec(id: string): Rec { return this.strict.records.get(id)! }
  answerRaw(q: string): Result { let r = this.raw.get(q); if (!r) { r = this.strict.answer(q); this.raw.set(q, r) } return r }
  tagOf(id: string): string { const r = this.strict.records.get(id); return r && r.type === 'tool' && r.link ? 'TOOL:' + r.link.replace(/\/+$/, '').split('/').pop() : id }
  tagForLink(link: string): string {
    const ids = this.recOfLink.get(link) ?? this.resByLink.get(link)?.record_ids ?? []
    if (ids.length) return this.tagOf(ids[0])
    return 'PAGE:' + link.replace(/^\/+/, '').replace(/\//g, '-')
  }
  revisionOf(family: string): string {
    const prefix = this.cat.filePrefix[family]
    if (!prefix) return ''
    let best = ''
    for (const key of this.cat.inputs) {
      const base = key.split('/').pop()!
      if (base.startsWith(prefix + '_') && /^\d{8}/.test(base.slice(prefix.length + 1))) best = base.replace(/\.(csv|json)$/, '')
    }
    return best
  }
  private onlyLinks = new Map<string, string[]>()
  /** The links of every resource that a restricted group of the intent allows (cached per intent). */
  restricted(intent: string, cfg: any): string[] {
    let out = this.onlyLinks.get(intent)
    if (!out) {
      out = this.cat.resources.filter((r) => (cfg.only[r.group] ?? []).length && this.allowed({ type: r.type, link: r.link }, cfg.only[r.group])).map((r) => r.link)
      this.onlyLinks.set(intent, out)
    }
    return out
  }
  statusOk(r: Resource): boolean {
    const ids = r.record_ids.length ? r.record_ids : this.recordsOfLink(r.link)
    if (!ids.length) return true
    return ids.some((i) => isActiveStatus(this.strict.records.get(i)?.status))
  }

  // ------------------------------------------------------------ finders
  cfg(intent: string): any {
    const row = this.data.finders.intents[intent] ?? {}
    const d = this.data.finders.default
    return { w: { ...d.w, ...(row.w ?? {}) }, prior: row.prior ?? {}, only: row.only ?? {}, follow: row.follow ?? d.follow, journey: row.journey ?? d.journey, pin: row.pin ?? {}, filter: !!row.filter, field_bonus: row.field_bonus ?? {}, name_types: row.name_types ?? [], follow_fields: row.follow_fields ?? [], lead: row.lead ?? '' }
  }
  contentWords(reading: Reading): string[] {
    const namesToks = new Set(reading.names.flatMap((n) => tokens(n.text)))
    const base = new Set(tokens(reading.clean).filter((t) => !STOP.has(t)))
    const drop = new Set([...base].filter((t) => ASK.has(t) && !namesToks.has(t)))
    return [...base].filter((t) => !drop.has(t))
  }
  namedLinks(reading: Reading): Map<string, number> { const o = new Map<string, number>(); for (const id of reading.named_ids) { const l = this.linkOfRec.get(id); if (l) o.set(l, 1) } return o }
  readerLinks(question: string): Map<string, number> {
    const res = this.answerRaw(question)
    const o = new Map<string, number>()
    if (res.kind === 'answer') { for (const x of [res.record, res.answer, ...(res.records ?? [])]) if (x && x.link) o.set(x.link, 1) }
    else if (res.kind === 'clarify') for (const x of res.candidates ?? []) if (x.link) o.set(x.link, 0.5)
    return o
  }
  followed(reading: Reading, cfg: any): Map<string, number> {
    const o = new Map<string, number>()
    for (const rid of reading.named_ids) {
      for (const f of cfg.follow) {
        const tgt = f.dir === 'forward' ? this.strict.forward.get(rid + '\u0000' + f.rel) ?? [] : this.strict.inverse.get(rid + '\u0000' + f.rel) ?? []
        for (const t of tgt.slice(0, 12)) { const l = this.linkOfRec.get(t); if (l && isActiveStatus(this.rec(t).status)) o.set(l, Math.max(o.get(l) ?? 0, f.w)) }
      }
      // a record field that lists other records by id is a typed link too (an algorithm's `products`)
      for (const f of cfg.follow_fields) {
        const raw = (this.rec(rid).fields ?? {})[f.field] || []          // an empty string, 0 and null list nothing
        const vals: unknown[] = Array.isArray(raw) ? raw : [raw]
        const w = f.w / Math.sqrt(Math.max(1, vals.length))          // the more products an algorithm lists, the less each link says (every listed id counts, active or not)
        for (const v of vals) { const t = this.strict.records.get(f.prefix + String(v)); const l = t ? this.linkOfRec.get(t.id) : undefined; if (l && t && isActiveStatus(t.status)) o.set(l, Math.max(o.get(l) ?? 0, w)) }
      }
    }
    return o
  }
  prior(item: Item, spec: any): number {
    let best = 0
    for (const [key, bonus] of Object.entries(spec[item.group] ?? {}) as [string, number][]) {
      const i = key.indexOf(':'); const kind = key.slice(0, i), val = key.slice(i + 1)
      if ((kind === 'type' && item.type === val) || (kind === 'path' && item.link.startsWith(val))) best = Math.max(best, bonus)
    }
    return best
  }
  allowed(item: Item, only: string[] | undefined): boolean {
    if (!only || !only.length) return true
    return only.some((key) => { const i = key.indexOf(':'); const kind = key.slice(0, i), val = key.slice(i + 1); return (kind === 'type' && item.type === val) || (kind === 'path' && item.link.startsWith(val)) })
  }
  pool(reading: Reading & { question: string }, intent: string, extra = 80): Map<string, Item> {
    const cfg = this.cfg(intent)
    const words = this.contentWords(reading)
    const hits = this.search.resources(reading.clean, extra)
    const top = hits.length ? hits[0].score : 1.0
    const resScores = this.res.scores(words)
    const rtop = resScores.size ? Math.max(...resScores.values()) : 1.0
    const named = this.namedLinks(reading)
    const follow = this.followed(reading, cfg)
    const readers = cfg.w.reader ? this.readerLinks(reading.question) : new Map<string, number>()
    const links = new Map<string, number>()
    const via = new Map<string, number>()          // the passage each link was found through (its best one)
    for (const h of hits) if (!links.has(h.link)) { links.set(h.link, h.score / top); via.set(h.link, h.passage) }
    for (const [ln] of [...resScores.entries()].sort((a, b) => b[1] - a[1]).slice(0, extra)) if (!links.has(ln)) links.set(ln, 0)
    for (const ln of [...named.keys(), ...follow.keys(), ...readers.keys(), ...(Object.values(cfg.pin) as string[][]).flat()]) if (!links.has(ln)) links.set(ln, 0)
    // a group the intent restricts to a small set of pages (`only`): every page of that set that shares a word with the question is a
    // candidate, not only those among the best matches of the whole Hub
    for (const ln of this.restricted(intent, cfg)) if ((resScores.get(ln) ?? 0) > 0 && !links.has(ln)) links.set(ln, 0)
    // a question about the site itself: a page of the site is a candidate when the question holds a word visitors use for it, and
    // is scored by the share of the question's words that are such words
    const asked = cfg.w.asked ? this.askedPages(reading.clean) : new Map<string, number>()
    for (const [ln, share] of asked) if (share > 0 && !links.has(ln)) links.set(ln, 0)
    const pool = new Map<string, Item>()
    const sw = [...words].sort()
    const denom = Math.max(1e-9, sw.reduce((a, w) => a + this.res.idf(w), 0))
    for (const [ln, text] of links) {
      const r = this.resByLink.get(ln)
      if (!r || !this.statusOk(r) || (ln.startsWith('http') && !named.has(ln))) continue
      const tw = new Set(tokens(r.title))
      const overlap = words.length ? sw.filter((w) => tw.has(w)).reduce((a, w) => a + this.res.idf(w), 0) / denom : 0
      pool.set(ln, { link: ln, title: r.title, type: r.type, group: r.group, extract: r.extract, record_ids: r.record_ids, text, res: (resScores.get(ln) ?? 0) / rtop, title_overlap: overlap, named: named.has(ln), follow: follow.get(ln) ?? 0, reader: readers.get(ln) ?? 0, passage: via.get(ln) ?? null, asked: asked.get(ln) ?? 0 })
    }
    return pool
  }
  /** For each page of the site that has words of its own: the share of the question's words that are among them. */
  askedPages(clean: string): Map<string, number> {
    const toks = [...new Set(tokens(clean).filter((t) => !STOP.has(t)))].sort()
    const out = new Map<string, number>()
    for (const [ln, pageWords] of Object.entries((this.data.finders.page_words ?? {}) as Record<string, string[]>)) {
      if (this.resByLink.has(ln)) out.set(ln, toks.filter((t) => pageWords.includes(t)).length / Math.max(1, toks.length))
    }
    return out
  }
  /** The group order with the group that leads first (the group the finder marked as holding the best row); the others keep their order. */
  leadFirst(order: string[], groups: Record<string, Item[]>): string[] {
    const best = order.find((g) => (groups[g] ?? []).length && groups[g][0].leads)
    return best === undefined ? order : [best, ...order.filter((g) => g !== best)]
  }
  score(item: Item, cfg: any, filt: Map<string, number> | null): number {
    const w = cfg.w
    let v = w.text * item.text + w.res * item.res + w.title * item.title_overlap + w.name * (item.named && (!cfg.name_types.length || cfg.name_types.includes(item.type)) ? 1.0 : 0.0) + w.link * item.follow + w.prior * this.prior(item, cfg.prior) + (w.reader ?? 0.0) * (item.reader ?? 0.0) + (w.asked ?? 0.0) * (item.asked ?? 0.0)
    if (filt !== null) v += filt.get(item.link) ?? 0.0
    return v
  }
  filterBonus(reading: Reading, pool: Map<string, Item>, fb: any): Map<string, number> {
    const f = reading.filters
    const out = new Map<string, number>()
    if (!(f.industries.length || f.places.length)) return out
    for (const rec of this.model.records) {
      if (!['guidance', 'framework'].includes(rec.type) || !isActiveStatus(rec.status)) continue
      const d = this.cat.dims[rec.id]
      if (!rec.link || !d) continue
      let bonus = 0.0
      for (const [field, table] of Object.entries(fb ?? {}) as [string, Record<string, number>][]) bonus += table[String((rec.fields ?? {})[field] || '').toLowerCase()] ?? 0.0
      if (f.industries.length && f.industries.some((x) => x.match.some((m) => d.industry.includes(m)))) bonus += 1.5
      if (f.places.length) {
        if (f.places.some((x) => x.match.some((m) => d.place.includes(m)))) bonus += 2.0
        else if (d.place.some((p) => p.includes('GLOBAL'))) bonus += 0.7
      }
      if (bonus) {
        out.set(rec.link, bonus)
        const r = this.resByLink.get(rec.link)
        if (!pool.has(rec.link) && r) pool.set(rec.link, { link: rec.link, title: r.title, type: r.type, group: r.group, extract: r.extract, record_ids: r.record_ids, text: 0.0, res: 0.0, title_overlap: 0.0, named: false, follow: 0.0, reader: 0.0 })
      }
    }
    return out
  }
  find(reading: Reading & { question: string; forced?: boolean }, perGroup = 3, more = 3): Record<string, Item[]> {
    const merged: Record<string, Map<string, number>> = Object.fromEntries(GROUPS.map((g) => [g, new Map<string, number>()]))
    const items = new Map<string, Item>()
    let intents = reading.intents.filter((i) => !['name', 'broad', 'not_fact'].includes(i))
    if (!intents.length) intents = [reading.intents[0]]
    intents.forEach((intent, rank) => {
      const cfg = this.cfg(intent)
      const pool = this.pool(reading, intent)
      const filt = cfg.filter ? this.filterBonus(reading, pool, cfg.field_bonus) : null
      for (const [ln, it] of pool) {
        if (!this.allowed(it, cfg.only[it.group])) continue
        const sc = this.score(it, cfg, filt) * (rank === 0 ? 1.0 : 0.6)
        merged[it.group].set(ln, Math.max(merged[it.group].get(ln) ?? 0.0, sc))
        if (!items.has(ln)) items.set(ln, it)
      }
    })
    const out: Record<string, Item[]> = {}
    const cfg0 = this.cfg(intents[0])
    for (const g of GROUPS) {
      const ranked = [...merged[g].entries()].sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0]))
      ;((cfg0.pin[g] ?? []) as string[]).forEach((ln, k) => {
        const idx = ranked.findIndex((x) => x[0] === ln)
        if (idx >= 0) { const [hit] = ranked.splice(idx, 1); ranked.splice(k, 0, [hit[0], hit[1] + 100]) }
      })
      out[g] = ranked.slice(0, perGroup + more).map(([ln, sc]) => ({ ...items.get(ln)!, score: round(sc, 4) }))
    }
    if (cfg0.lead === 'best') {
      // the group whose first row scores highest leads (read before the plain matches are mixed in: their scores are another scale)
      let best: string | null = null
      for (const g of GROUPS) if (out[g].length && (best === null || out[g][0].score > out[best][0].score)) best = g
      if (best !== null) out[best][0].leads = true
    }
    if (cfg0.journey && reading.names.length) this.journey(reading, out, perGroup)
    if ((reading.confidence ?? 1.0) < STRONG && !reading.forced) this.withFallback(reading, out, perGroup + more)
    // quizzes follow the lessons and sections; nothing is added or removed
    const after = this.data.finders.learn_after as string[]
    const quiz = (x: Item) => after.some((p) => String(x.link).startsWith(p))
    out.Learn = [...out.Learn.filter((x) => !quiz(x)), ...out.Learn.filter(quiz)]
    return out
  }
  withFallback(reading: Reading & { question: string }, out: Record<string, Item[]>, size: number): void {
    const plain: Record<string, Item[]> = Object.fromEntries(GROUPS.map((g) => [g, []]))
    // a word of a name the question was read to hold ("sphincs" in "who created sphincs+") is enough on its own
    const nameWords = [...new Set(reading.names.flatMap((n) => tokens(n.text)))]
    for (const h of this.search.resources(reading.clean, 80, PLAIN_MIN_WORDS, nameWords)) {
      const r = this.resByLink.get(h.link)
      if (!r || !this.statusOk(r) || r.link.startsWith('http')) continue
      plain[r.group].push({ link: r.link, title: r.title, type: r.type, group: r.group, extract: r.extract, record_ids: r.record_ids, score: round(h.score, 4), text: 1.0, res: 0.0, title_overlap: 0.0, named: false, follow: 0.0, reader: 0.0, passage: h.passage })
    }
    for (const g of GROUPS) {
      const certain = reading.intents.includes('compare') ? out[g].filter((x) => x.named).slice(0, size) : []
      const mine = out[g].filter((x) => !certain.includes(x)); const theirs = plain[g]
      const seen = new Set(certain.map((x) => x.link)); const merged: Item[] = [...certain]
      let i = 0, j = 0
      while (merged.length < size && (i < mine.length || j < theirs.length)) {
        for (const which of ['i', 'j']) {
          const lst = which === 'i' ? mine : theirs
          let idx = which === 'i' ? i : j
          while (idx < lst.length && seen.has(lst[idx].link)) idx++
          if (idx < lst.length) { merged.push(lst[idx]); seen.add(lst[idx].link); idx++ }
          if (which === 'i') i = idx; else j = idx
        }
      }
      out[g] = merged.slice(0, size)
    }
  }
  journey(reading: Reading & { question: string }, out: Record<string, Item[]>, perGroup: number): void {
    const cur = this.cat.curriculum
    if (!cur) return
    // only a name that means a concept (a term, algorithm, standard or protocol) leads to the concept's lessons; a name that is only a vendor,
    // a page or a tool ("post quantum", "algorithms") does not
    const concept = ['term', 'algorithm', 'standard', 'protocol']
    const nameToks = new Set(reading.names.flatMap((n) => tokens(n.text)))
    const other = this.contentWords(reading).filter((w) => !nameToks.has(w))
    // a name for the whole subject of the Hub ("pqc") does not lead the journey when the question asks about something more specific
    const generic = other.length ? new Set((this.data.finders.generic_names as string[]).map((x) => x.toLowerCase())) : new Set<string>()
    const labels = new Set(reading.names.filter((n) => !generic.has(n.text.toLowerCase()) && n.ids.some((i) => concept.includes(this.rec(i).type))).map((n) => n.text))
    for (const rid of reading.named_ids) { const r = this.rec(rid); if (concept.includes(r.type) && !generic.has(r.label.toLowerCase())) labels.add(r.label) }
    const scores = new Map(this.search.resources(reading.clean, 60).map((h) => [h.link, h.score]))
    const picks = this.learnForConcept([...labels].sort(), cur, scores, Math.max(1, perGroup - 1))
    if (!picks.length) return
    const chosen = new Set(picks.map((p) => p.link))
    const rest = out.Learn.filter((x) => !chosen.has(x.link))
    out.Learn = [...picks.map((p, i) => ({ ...p, group: 'Learn', record_ids: this.resByLink.get(p.link)!.record_ids, score: 50.0 - i * 0.1 })), ...rest.slice(0, perGroup + 3 - picks.length)]
  }
  nameRx(name: string): RegExp | null {
    const parts = tokens(name)
    if (!parts.length || parts.join('').length < 3) return null
    return new RegExp('(?<![A-Za-z0-9])' + parts.map(escRx).join('[-\\s/.]?') + '(?![A-Za-z0-9])', 'i')
  }
  learnForConcept(names: string[], cur: NonNullable<Catalogue['curriculum']>, scores: Map<string, number>, limit: number): Item[] {
    const rxs = names.map((n) => this.nameRx(n)).filter((x): x is RegExp => !!x)
    if (!rxs.length) return []
    const named = new Set(names.map((n) => tokens(n).join('')))
    const explainsOf = (phrase: string) => { const t = tokens(phrase); const joined = t.join(''); return named.has(joined) || (t.length > 1 && GENERIC.includes(t[t.length - 1]) && named.has(t.slice(0, -1).join(''))) }
    const found: { key: (number | string)[]; item: Item }[] = []
    for (const r of this.cat.resources) {
      if (r.group !== 'Learn' || !r.link.startsWith('/learn/')) continue
      const mid = pageOf(r.link).slice('/learn/'.length)
      const m = cur.modules[mid]
      if (!m) continue
      const isModule = r.link === `/learn/${mid}`
      const titleHit = rxs.some((rx) => rx.test(r.title))
      let tier: number, why: string
      if (isModule) {
        const explains = (m.explains ?? []).some(explainsOf)
        const scope = r.passages.filter((i) => this.cat.passages[i].source === 'module-topic-summaries').map((i) => this.cat.passages[i].text.split('Out of scope')[0]).join(' ')
        if (!(explains || titleHit || rxs.some((rx) => rx.test(scope)))) continue
        ;[tier, why] = explains || titleHit ? [0, 'explains it'] : [1, 'covers it']
      } else if (titleHit && ['section', 'step'].includes(r.type)) [tier, why] = [2, 'a part about it']
      else continue
      const general = String(m.breadth ?? '').startsWith('general') && m.track !== 'Role Guides' ? 0 : 1
      const stageName = cur.stages && String(m.stage) in cur.stages ? cur.stages[String(m.stage)] : ''
      found.push({ key: [tier, general, m.stage, m.track === 'Foundations' ? 0 : 1, -(scores.get(r.link) ?? 0.0), r.title], item: { link: r.link, title: r.title, type: r.type, extract: r.extract, why: `${why}; stage ${m.stage} ${stageName}`.trim(), score: scores.get(r.link) ?? 0.0, stage: m.stage, tier } })
    }
    found.sort((a, b) => cmpTuple(a.key, b.key))
    return found.slice(0, limit).map((x) => x.item)
  }

  // ------------------------------------------------------------ direct answer
  /** The strict reader answered a question about the members of one of the relations that get a direct answer (`direct_links`). */
  private linkedAnswer(res: Result): boolean {
    return res.kind === 'answer' && (this.data.rules.direct_links.relations as string[]).includes(res.relation) && (res.records ?? []).length > 0
  }
  /** The records a link reaches, in the order they are named: by name (A to Z, letter case ignored), then by tag. */
  private linkedMembers(res: Result): Rec[] {
    return (res.records as { id: string }[]).map((r) => this.rec(r.id)).sort((a, b) => cmpTuple([String(a.label).toLowerCase(), a.id], [String(b.label).toLowerCase(), b.id]))
  }
  /** The records a link reaches, by name (A to Z, letter case ignored, then tag): the first `cap` named, the rest counted. */
  private linkedText(res: Result): string {
    const recs = this.linkedMembers(res)
    const cap: number = this.data.rules.direct_links.cap
    const names = recs.slice(0, cap).map((r) => String(r.label))
    if (recs.length > cap) names.push(this.data.notes.links.more.replace('{n}', String(recs.length - cap)))
    return names.join('; ')
  }
  direct(question: string, reading: Reading): Result | null {
    let intent = reading.intent
    // "What replaced X?" whose name carries a word that tips the question toward another intent ("... Roadmap-2026", "... pdf ...") is
    // still a successor question when currency is among the close readings and the reader holds a proven chain.
    const successor = reading.intents.includes('currency') && provenSuccessor(this.answerRaw(question))
    if (successor) intent = 'currency'
    const spec = this.data.intents.intents[intent]
    const res = this.answerRaw(question)
    const linked = this.linkedAnswer(res)
    if (!spec.direct && !linked) return null
    if (intent === 'source_document' && !linked) return this.documentAnswer(reading)
    if (res.kind !== 'answer' || res.tier === 2 || res.from_fields) return null
    const rec = this.strict.records.get((res.record ?? {}).id ?? '')
    // A retired record answers one question only: what replaced it, and only when the link is proven (the reader's chain).
    if (!rec || (!isActiveStatus(rec.status) && !successor)) return null
    if ((res.records ?? []).length > 1 && !linked) return null
    let value = res.value
    if (linked) value = this.linkedText(res)
    if ((value === null || value === undefined || value === '') && res.values && res.values.length) value = res.values.map(String).join('; ')
    if ((value === null || value === undefined || value === '') && intent === 'people' && String(res.text || '').split(/\s+/).filter(Boolean).length >= 5 && ['person', 'vendor', 'source'].includes(rec.type)) value = res.text
    if ((value === null || value === undefined || value === '') && intent === 'currency' && res.answer) value = res.answer.label || res.answer.key
    if (value === null || value === undefined || value === '') return null
    if (spec.direct_field_rx && res.field && !new RegExp(spec.direct_field_rx.replace(/^\(\?i\)/, ''), spec.direct_field_rx.startsWith('(?i)') ? 'i' : '').test(String(res.field))) return null
    if (spec.one_of_kind && !linked && reading.names.length && reading.names[0].ids.filter((i) => spec.one_of_kind.includes(this.rec(i).type)).length > 1) return null
    for (const n of reading.names.slice(0, 1)) {
      // a link answer is about the record the name reaches in its family: a document and a standard of one Library title are twins
      const twins = n.ids.filter((i) => this.rec(i).family === rec.family && (linked || this.rec(i).type === rec.type) && isActiveStatus(this.rec(i).status))
      if (twins.length > 1 && (linked || !(res.records && res.records.length > 1))) return null
    }
    let ev = this.evidence(rec, res)
    if (ev === null) return null
    let shown = rec
    if (intent === 'currency' && res.answer && this.strict.records.has(res.answer.id)) { shown = this.rec(res.answer.id); ev = this.evidence(shown, res) ?? ev }
    if (successor) {
      const { text, proof } = this.successorText(rec, res)
      return { value: text, field: res.field ?? null, evidence: ev, tag: this.tagOf(shown.id), record_id: shown.id, evidence_line: this.fmt(this.data.notes.successor.evidence, ev).replace('{proof}', () => proof) }
    }
    const out: Result = { value: plainValue(String(value)), field: res.field ?? null, evidence: ev, tag: this.tagOf(shown.id), record_id: shown.id, evidence_line: this.fmt(this.data.notes.evidence, ev) }
    // the records the answer names, which the resources then lead with
    if (linked) out.members = this.linkedMembers(res).map((r) => r.id)
    return out
  }
  /** The sentence "X was replaced by Y" and the proof line, from the reader's chain and the passages it cited. */
  private successorText(rec: Rec, res: Result): { text: string; proof: string } {
    const sp = this.data.notes.successor
    const sub = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_m, k: string) => v[k])
    const chain: Item[] = res.chain
    const names = [retiredName(rec), ...chain.map((l) => retiredName(this.rec(l.id)))]
    const same: boolean[] = chain.map((_l, i) => sp.same_kinds.includes(res.evidence[i].kind))
    // a link between two rows of one document is said as that, one sentence per link
    const text = !same.some(Boolean)
      ? sub(sp.value, { old: names[0], new: names[1] }) + names.slice(2).map((n) => sub(sp.value_next, { new: n })).join('')
      : same.map((s, i) => sub(s ? sp.same : sp.value, { old: names[i], new: names[i + 1] })).join('; ')
    const proof: string[] = []
    let prev = rec
    chain.forEach((link, i) => {
      const quoted = ['explicit', 'chain'].includes(res.evidence[i].kind)
      const to = this.rec(link.id)
      const cited = res.evidence[i]
      const passage = excerpt(cited.passage ?? '', prev.key, sp.clip, quoted)
      let part = !passage ? sp.names : quoted ? sub(sp.quote, { passage }) : sub(sp.basis, { passage: passage.replace(/\.+$/, '') })
      if (cited.source_url) part += ' ' + sub(sp.source, { url: cited.source_url })
      proof.push((chain.length > 1 ? sub(sp.step, { old: prev.key, new: to.key }) : '') + part)
      prev = to
    })
    return { text, proof: proof.join(' ') }
  }
  private fmt(t: string, ev: Item) { return t.replace('{kind}', ev.kind).replace('{title}', ev.title).replace('{tag}', ev.tag).replace('{revision}', ev.revision) }
  kindChip(rec: Rec): string { return this.data.rows.kind_chip[rec.type] ?? titleCase(rec.type) }
  evidence(rec: Rec, res: Result): Item | null {
    let rev = this.revisionOf(rec.family)
    if (rec.family === 'library') { const lv = rec.last_verified; if (lv) rev = rev ? `Verified ${lv}, ${rev}` : `Verified ${lv}`; else if (rev) rev = `Data file ${rev}` }
    else if (rev) rev = `Data file ${rev}`
    if (!rev && !(res.evidence && res.evidence.length)) return null
    return { kind: this.kindChip(rec), title: rec.label, tag: this.tagOf(rec.id), revision: rev || 'Source document checked' }
  }
  documentAnswer(reading: Reading): Result | null {
    const shape = (this.data.rules.direct_shape.source_document as string[]).map((r) => new RegExp(r, 'i'))
    let rest = reading.clean
    for (const n of reading.names) rest = rest.replace(new RegExp(escRx(n.text), 'gi'), ' ')
    if (!shape.some((rx) => rx.test(rest)) || ['answer', 'clarify'].includes(this.answerRaw(reading.question).kind)) return null
    const ids = new Set(reading.named_ids.filter((i) => ['document', 'standard'].includes(this.rec(i).type) && isActiveStatus(this.rec(i).status)))
    if (ids.size !== 1 || reading.names.length !== 1) return null
    const rec = this.rec([...ids][0])
    const ev = this.evidence(rec, {})
    if (ev === null) return null
    return { value: `${rec.label}. It opens in the Library.`, field: 'document', evidence: ev, tag: this.tagOf(rec.id), record_id: rec.id, evidence_line: this.fmt(this.data.notes.evidence, ev) }
  }

  // ------------------------------------------------------------ rows and the answer
  stageOf(link: string): number | null { const cur = this.cat.curriculum; if (!cur || !link.startsWith('/learn/')) return null; const m = cur.modules[link.slice('/learn/'.length).split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '')]; return m ? m.stage : null }
  dimsLine(rec: Rec | null, link: string): string | null {
    if (link.startsWith('/learn/') && this.cat.curriculum) { const st = this.stageOf(link); return st ? `Stage: ${this.cat.curriculum.stages[String(st)]}` : null }
    const d = rec ? this.cat.dims[rec.id] : undefined
    if (!d) return null
    const parts: string[] = []
    if (d.industry.length) parts.push('Industries: ' + [...d.industry].sort().slice(0, 3).join('; '))
    if (d.place.length) parts.push('Place: ' + [...d.place].sort().slice(0, 3).join('; '))
    return parts.join(' · ') || null
  }
  /**
   * What a row shows under its title: the record's own first lines, or, when the row was found through a passage with a sentence that
   * holds at least half of the question's words (by weight) and more of them than those lines do, that part of the passage.
   */
  shownExtract(item: Item, words: string[]): string {
    const own = String(item.extract ?? '')
    const p = typeof item.passage === 'number' ? this.cat.passages[item.passage] : undefined
    if (!p || !words.length || NOT_SHOWN.includes(p.source)) return own
    const weights: [string, number][] = [...words].sort().map((w) => [w, this.res.idf(w)])
    const m = matchedExtract(p.text, weights)
    if (!m) return own
    const total = weights.reduce((a, [, x]) => a + x, 0)
    const mine = new Set(tokens(own))
    let ownHeld = 0
    for (const [w, x] of weights) if (mine.has(w)) ownHeld += x
    return m.held >= MATCH_SHARE * total && m.held > ownHeld ? m.text : own
  }
  row(item: Item, words: string[] = []): Item {
    const rows = this.data.rows
    const ids: string[] = item.record_ids ?? []
    const rec = ids.length ? this.strict.records.get(ids[0]) ?? null : null
    const link = item.link
    let rtype = rec ? rec.type : item.type || 'page'
    if (!rec && this.resByLink.has(link) && !ids.length) rtype = 'page'
    const kind = rows.kind_chip[rtype] ?? titleCase(String(rtype))
    const tag = rec ? this.tagOf(rec.id) : this.tagForLink(link)
    let origin: string | null = null, status: string | null = null, dims: string | null = null
    if (rec) {
      origin = rows.source_by_family[rec.family ?? ''] ?? null
      if (rec.family === 'library') {
        const org = String((rec.fields ?? {}).authors_or_organization || '')
        for (const o of rows.library_origin) if (org.toLowerCase().includes(o.match.toLowerCase())) { origin = o.origin; break }
        status = (rec.fields ?? {}).document_status || null
      }
      dims = this.dimsLine(rec, link)
    } else if (item.group === 'Learn' && this.cat.curriculum) dims = this.dimsLine(null, link)
    const action = rows.action_by_type[rtype] || rows.action_by_group[item.group]
    const paid = !!rec && this.paid.has(rec.id)
    return { kind, tag, title: item.title, source: origin, status, dims, extract: paid ? '' : this.shownExtract(item, words), paidReferenceOnly: paid, action, link, group: item.group }
  }
  persona(): Map<string, string[]> {
    if (!this.personaPaths) {
      const out = new Map<string, string[]>()
      for (const [k, srcs] of this.strict.inverse) {
        const [to, rel] = k.split('\u0000')
        if (rel === 'on_path_of' && to.startsWith('persona:')) { const p = to.split(':')[1]; out.set(p, [...(out.get(p) ?? []), ...srcs.filter((s) => this.strict.records.get(s)?.type === 'module')]) }
      }
      this.personaPaths = new Map([...out].map(([k, v]) => [k, [...new Set(v)].sort()]))
    }
    return this.personaPaths
  }
  rolePathRow(role: string): Item | null {
    const stored = (this.cat.rolePaths?.[role]?.first ?? []).filter((m) => this.strict.records.has(m))
    let first = stored
    if (!stored.length) {
      const mine = this.persona().get(role)
      if (!mine) return null
      const share = new Map(mine.map((m) => [m, [...this.persona().values()].filter((p) => p.includes(m)).length]))
      const ranked = [...mine].sort((a, b) => share.get(a)! - share.get(b)! || cmpStr(a, b))
      const stage = (m: string) => this.cat.curriculum?.modules[this.rec(m).key]?.stage ?? 9
      first = ranked.slice(0, 10).sort((a, b) => stage(a) - stage(b) || share.get(a)! - share.get(b)! || cmpStr(a, b))
    }
    const title = titleCase(role.replace(/-/g, ' ')) + ' path'
    return { kind: this.data.rows.kind_chip.path, tag: `PATH:${role}`, title, source: 'Hub curriculum', status: null, dims: null, extract: `The ${first.length} modules most specific to the ${titleCase(role.replace(/-/g, ' '))} role, in stage order: ${first.map((m) => this.rec(m).label).join(', ')}. The rest are under "more for this role".`, paidReferenceOnly: false, action: 'Open path', link: `/go/PATH:${role}`, group: 'Learn' }
  }
  linksOf(recs: Rec[]): Item {
    const taught: Item[] = [], tried: Item[] = []
    for (const r of recs) {
      for (const t of (this.strict.forward.get(r.id + '\u0000taught_in') ?? []).slice(0, 2)) { const x = this.strict.records.get(t); if (x && !taught.some((y) => y.tag === this.tagOf(t))) taught.push({ title: x.label, tag: this.tagOf(t) }) }
      for (const t of (this.strict.forward.get(r.id + '\u0000practised_with') ?? []).slice(0, 2)) { const x = this.strict.records.get(t); if (x && !tried.some((y) => y.tag === this.tagOf(t))) tried.push({ title: x.label, tag: this.tagOf(t) }) }
    }
    return { taughtIn: taught.slice(0, 2), tryIn: tried.slice(0, 2) }
  }
  entities(ids: string[]): Item[] {
    const recs = ids.map((i) => this.rec(i))
    const chip = (r: Rec) => this.data.rows.kind_chip[r.type] ?? titleCase(r.type)
    const single = (r: Rec): Item => ({ kind: chip(r), title: r.label, tag: this.tagOf(r.id), link: r.link || '', ids: [r.id], extract: extractOf(r.definition || ''), ...this.linksOf([r]) })
    const fams = recs.filter((r) => r.type === 'algorithmfamily')
    const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (fams.length) {
      const f = fams[0]
      const joined = recs.filter((r) => r === f || (r.type === 'term' && norm(r.label) === norm(f.label)) || r.type === 'algorithm')
      const ent: Item = { kind: 'Algorithm', title: f.label, tag: this.tagOf(f.id), link: f.link || '', ids: joined.map((r) => r.id), extract: extractOf((joined.find((r) => r.type === 'term' && r.definition)?.definition) ?? f.definition ?? ''), ...this.linksOf(joined) }
      return [ent, ...recs.filter((r) => !joined.includes(r)).map(single)]
    }
    const algs = recs.filter((r) => r.type === 'algorithm'), terms = recs.filter((r) => r.type === 'term'), others = recs.filter((r) => r.type !== 'algorithm' && r.type !== 'term')
    const out: Item[] = []
    const sameFam = (new Set(algs.map((r) => r.family)).size === 1)
    if (algs.length > 1 || (algs.length && terms.length && sameFam && algs.every((a) => norm(a.label).startsWith(norm(terms[0].label))))) {
      const base = terms.length ? terms[0].label : algs[0].label.replace(/[-\s]*\d+.*$/, '')
      out.push({ kind: 'Algorithm', title: base, tag: 'ALG:' + base, link: algs[0].link, ids: [...algs, ...terms].map((r) => r.id), extract: (terms.length ? terms[0].definition : algs[0].definition) || '', ...this.linksOf([...terms, ...algs]) })
    }
    void others
    for (const r of out.length ? others : recs) { if (out.length && [...algs, ...terms].includes(r)) continue; out.push(single(r)) }
    return out
  }
  groupOrder(intent: string, role: string | null): string[] { return this.engine.groupOrder(intent, role) }
  /** Every record joined to `id` by a link of the model, in either direction. */
  private neighbours(id: string): Set<string> {
    if (!this.near) {
      const near = new Map<string, Set<string>>()
      const add = (a: string, b: string) => { const s = near.get(a); if (s) s.add(b); else near.set(a, new Set([b])) }
      for (const e of this.model.links) { add(e.from, e.to); add(e.to, e.from) }
      this.near = near
    }
    return this.near.get(id) ?? new Set<string>()
  }
  /** The records a part belongs to by its tag: `LM-008/s:intro` belongs to `LM-008`. */
  private ancestors(id: string): Set<string> {
    const parts = id.split('/')
    const out = new Set<string>()
    for (let i = 1; i < parts.length; i++) out.add(parts.slice(0, i).join('/'))
    return out
  }
  /** 0 when the item is the page itself, 1 when it is directly linked to it (a link of the model, or a lesson and its sections), else 2. */
  pageRank(item: Item, page: string): number {
    const ids: string[] = item.record_ids ?? []
    const own = this.linkOfRec.get(page)
    if (ids.includes(page) || (own && this.linkKey(String(item.link)) === this.linkKey(own))) return 0
    const near = this.neighbours(page)
    const up = this.ancestors(page)
    for (const i of ids) if (near.has(i) || up.has(i) || this.ancestors(i).has(page)) return 1
    return 2
  }
  /**
   * Moves the rows that belong to the page earlier within their group: the page itself first, then what is linked to it. The rows are the
   * ones already chosen for the answer and the split between shown and more keeps its sizes, so nothing is added or removed and the answer
   * type is untouched. A row the intent pins (its first places) stays ahead, and quizzes stay after the lessons.
   */
  orderByPage(group: string, reading: Reading & { question: string }, items: Item[], rows: Item[], shown: Item[], more: Item[], page: string): [Item[], Item[]] {
    const rank = new Map<Item, number>()
    rows.forEach((r, i) => rank.set(r, this.pageRank(items[i], page)))
    const lead = reading.intents.filter((i) => !['name', 'broad', 'not_fact'].includes(i))[0] ?? reading.intents[0]
    const pinned = new Set<string>(((this.cfg(lead).pin[group] ?? []) as string[]))
    const after: string[] = group === 'Learn' ? (this.data.finders.learn_after as string[]) : []
    const key = (r: Item): number[] =>
      pinned.has(r.link) ? [0, 0, 0] : [1, after.length && after.some((p) => String(r.link).startsWith(p)) ? 1 : 0, rank.get(r) ?? 2] // the pinned rows keep their own order, ahead of everything the page moves
    const both = [...shown, ...more].map((r, i) => ({ r, i, k: key(r) }))
    both.sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.k[2] - b.k[2] || a.i - b.i)
    const sorted = both.map((x) => x.r)
    return [sorted.slice(0, shown.length), sorted.slice(shown.length)]
  }
  ask(question: string, role: string | null = null, forceIntent: string | null = null, page: string | null = null): Item {
    let reading: Reading & { question: string; forced?: boolean } = this.engine.read(question) as any
    if (forceIntent) reading = { ...reading, intent: forceIntent, intents: [forceIntent], forced: true }
    if (reading.intent === 'name' && reading.name_match) {
      // a retired record is never a name card or a choice: the name keeps the records that are live; when none is, the question is read as a named thing alone and answered by the finders
      const live = reading.name_match.filter((i) => isActiveStatus(this.rec(i).status))
      reading = live.length ? { ...reading, name_match: live } : { ...reading, intent: 'concept', intents: ['concept'], name_match: null, confidence: 0.3 }
    }
    const intent = reading.intent
    const spec = this.data.intents.intents[intent]
    const N = this.data.notes
    const model: Item = { question, intent, intents: reading.intents, role, answerText: N.answer_text.default, note: '', direct: null, source: null, nameCard: null, choices: null, groups: [], reading: { names: reading.names.map((n) => n.text), scores: reading.scores, filters: reading.filters } }
    if (intent === 'name') return this.nameAnswer(model, reading, role, page)
    let findReading = reading
    if (intent === 'broad' || intent === 'not_fact') {
      // a question nothing was recognised in, but which has words of its own ("5g", "quantum"), is searched by those words;
      // only a request with no topic at all ("hello", "tell me something") gets the introduction
      // a single word that stands in the titles of very many records ("quantum") names the subject of the whole Hub, not a topic: it gets the introduction too
      const own = this.contentWords(reading)
      const ownWords = intent === 'broad' && (reading.confidence ?? 0) <= UNREAD && own.length > 0 && !(own.length === 1 && this.res.titleShare(own[0]) > WHOLE_SUBJECT_SHARE)
      findReading = { ...reading, intents: [reading.names.length ? 'concept' : 'risk'], intent: reading.names.length ? 'concept' : 'risk', clean: reading.clean && (reading.intent !== 'broad' || ownWords) ? reading.clean : INTRODUCTION }
    }
    let groups = this.find(findReading, PER_GROUP, PER_GROUP)
    if (intent === 'broad' && findReading.clean !== INTRODUCTION && !Object.values(groups).some((g) => g.length)) {
      // words the Hub holds nothing on ("qwertyzzxx blorp") are answered like a request with no topic: the introduction
      findReading = { ...findReading, clean: INTRODUCTION }
      groups = this.find(findReading, PER_GROUP, PER_GROUP)
    }
    const order = this.leadFirst(this.groupOrder(intent, role), groups)
    const words = findReading.clean === reading.clean ? this.contentWords(findReading) : [] // the introduction is shown in its own words
    const d = intent !== 'broad' && intent !== 'not_fact' ? this.direct(question, reading) : null
    model.direct = d ? { value: d.value, evidence_line: d.evidence_line, tag: d.tag, field: d.field, evidence: d.evidence } : null
    if (d && d.members) groups = this.membersFirst(groups, d.members)
    const outGroups: Item[] = []
    let first: Item | null = null
    for (const g of order) {
      const items = groups[g] ?? []
      if (!items.length) continue
      const rows = items.map((x) => this.row(x, words))
      let shown = rows.slice(0, PER_GROUP), more = rows.slice(PER_GROUP)
      if (g === 'Learn' && role && ['learning', 'planning'].includes(intent) && shown.length) {
        const pr = this.rolePathRow(role)
        if (pr) { shown = [...shown.slice(0, 1), pr, ...shown.slice(1, PER_GROUP - 1)]; more = rows.length > PER_GROUP - 1 ? rows.slice(PER_GROUP - 1, PER_GROUP - 1 + PER_GROUP) : more }
      }
      if (!first && shown.length) first = shown[0] // the closest source is read before the page moves anything: the page never changes it
      if (page) [shown, more] = this.orderByPage(g, findReading, items, rows, shown, more, page)
      outGroups.push({ name: g, rows: shown, more })
    }
    model.groups = outGroups
    const label = spec.label
    if (intent === 'broad') model.note = N.note.broad
    else if (intent === 'not_fact') model.note = N.note.not_fact
    else if (d) { model.note = N.note.direct.replace('{label}', label); model.source = { label: N.source_line.direct, ...d.evidence, tag: d.tag } }
    else { model.note = N.note.no_direct.replace('{label}', label); if (first) model.source = { label: N.source_line.no_direct, kind: first.kind, title: first.title, tag: first.tag } }
    return model
  }
  /** The records a link answer names lead their group (in the order they are named), so the rest of them are the card's resources. The group keeps its size: the records that were not named make room. */
  private membersFirst(groups: Record<string, Item[]>, members: string[]): Record<string, Item[]> {
    const lead: Record<string, Item[]> = {}
    for (const id of members) {
      const link = this.rec(id).link
      const item = link ? this.resByLink.get(link) : undefined
      if (item && item.group in groups && !(lead[item.group] ?? []).some((x) => x.link === item.link)) (lead[item.group] ??= []).push(item as unknown as Item)
    }
    const out: Record<string, Item[]> = Object.fromEntries(Object.entries(groups).map(([g, items]) => [g, [...items]]))
    const size = PER_GROUP * 2
    for (const [g, first] of Object.entries(lead)) {
      const head = first.slice(0, size)
      const have = new Set(head.map((x) => x.link))
      out[g] = [...head, ...out[g].filter((x) => !have.has(x.link))].slice(0, size)
    }
    return out
  }
  nameAnswer(model: Item, reading: Reading & { question: string }, role: string | null, page: string | null = null): Item {
    const N = this.data.notes
    const ents = this.entities(reading.name_match!)
    if (ents.length > 1) { model.answerText = N.answer_text.name_several; model.choices = ents.map((e) => ({ kind: e.kind, title: e.title, tag: e.tag })); model.note = ''; return model }
    const e = ents[0]
    model.answerText = N.answer_text.name
    model.nameCard = { kind: e.kind, title: e.title, tag: e.tag, link: e.link, taughtIn: e.taughtIn, tryIn: e.tryIn, extract: e.extract }
    model.note = N.note.name
    const sub = { ...reading, named_ids: e.ids, intents: ['name'], intent: 'name' }
    const groups = this.find(sub, PER_GROUP, PER_GROUP)
    const words = this.contentWords(sub)
    for (const g of this.groupOrder('name', role)) {
      const items = (groups[g] ?? []).filter((x) => x.link !== e.link)
      if (items.length) {
        const rows = items.map((x) => this.row(x, words))
        let shown = rows.slice(0, PER_GROUP), more = rows.slice(PER_GROUP)
        if (page) [shown, more] = this.orderByPage(g, sub as any, items, rows, shown, more, page)
        model.groups.push({ name: g, rows: shown, more })
      }
    }
    return model
  }
}
void normName

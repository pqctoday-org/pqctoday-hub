// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The answer engine, whole (port of engine/core.py, finders.py, direct.py and the session helpers): question in, AnswerModel out.
 * It reads the Hub through a `Catalogue` (resources, passages, curriculum, dimensions, role paths) and the strict reader's model;
 * both are what the knowledge-file reader of step 3.4 supplies. Rules, orders, notes and weights come from `data.generated.json`.
 */
import { Engine, normName, type Data, type Reading } from './engine'
import { Strict, type Model, type Rec, type Result } from './strict'

export interface Resource { link: string; title: string; type: string; group: string; extract: string; record_ids: string[]; passages: number[] }
export interface Passage { link: string; title: string; text: string; source: string }
export interface Catalogue {
  resources: Resource[]
  passages: Passage[]
  curriculum: { modules: Record<string, any>; stages: Record<string, string> } | null
  dims: Record<string, { industry: string[]; place: string[] }>
  inputs: string[]            // the data files the model was read from (for the evidence line)
  filePrefix: Record<string, string | null>
}
type Item = Record<string, any>
const GROUPS = ['Learn', 'References', 'Tools', 'Data pages']
const PER_GROUP = 3
const STRONG = 2.0
const STOP = new Set('the a an of to in on for and or is are was were be what which who whom how does do did can could would should i me my we our you your it its this that these those with by from about tell show give please there any some as at into if when where why'.split(' '))
const ASK = new Set('list show find tell explain describe learn lesson lessons module modules section sections tool tools tutorial course page pages information info resource resources material materials guide guides example examples understand know want need looking look use using work works available offer offers provide get give help site hub'.split(' '))
const GENERIC = ['handshake', 'overview', 'basics', 'fundamentals', 'protocol', 'standard', 'algorithm', 'concept', 'concepts', 'model', 'framework', 'principles']
const tokens = (t: string): string[] => String(t).toLowerCase().match(/[a-z0-9]+/g) ?? []
const round = (x: number, d: number) => { const f = 10 ** d; return Math.round(x * f) / f }
const pyTitle = (s: string) => s.replace(/[A-Za-z]+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
const pageOf = (l: string) => l.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'
const escRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const cmpTuple = (a: (number | string)[], b: (number | string)[]) => { for (let i = 0; i < a.length; i++) { if (a[i] === b[i]) continue; return a[i] < b[i] ? -1 : 1 } return 0 }
const extractOf = (text: string, limit = 240): string => {
  const HEADER = /^(?:Module|Component|Term|Reference|Title|Learning Module|Document|Section|Category):\s*/i
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
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
  constructor(private passages: Passage[], private k1 = 1.2, private b = 0.75) {
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
  hits(question: string, k = 200): [number, number][] {
    const score = new Map<number, number>()
    for (const w of [...new Set(tokens(question).filter((t) => !STOP.has(t)))].sort()) {
      const plist = this.post.get(w)
      if (!plist) continue
      const idf = Math.log(1 + (this.n - plist.length + 0.5) / (plist.length + 0.5))
      for (const [i, f] of plist) score.set(i, (score.get(i) ?? 0) + (idf * f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * this.len[i]) / this.avg)))
    }
    return [...score.entries()].map(([i, s]) => [s, i] as [number, number]).sort((x, y) => y[0] - x[0] || x[1] - y[1]).slice(0, k)
  }
  resources(question: string, k = 60): { link: string; score: number; passage: number }[] {
    const out: { link: string; score: number; passage: number }[] = []
    const seen = new Set<string>()
    for (const [s, i] of this.hits(question)) {
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
  len: number[] = []
  links: string[]
  n: number
  avg: number
  constructor(res: Resource[], private k1 = 1.2, private b = 0.5) {
    this.links = res.map((r) => r.link)
    res.forEach((r, i) => {
      const tf = new Map<string, number>()
      for (const w of [...tokens(r.title), ...tokens(r.title), ...tokens(r.title), ...tokens(r.extract)]) tf.set(w, (tf.get(w) ?? 0) + 1)
      let total = 0
      for (const [w, f] of tf) { total += f; const a = this.post.get(w); if (a) a.push([i, f]); else this.post.set(w, [[i, f]]) }
      this.len.push(total)
    })
    this.n = this.links.length
    this.avg = this.len.reduce((a, c) => a + c, 0) / Math.max(1, this.n)
  }
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

export class Answerer {
  strict: Strict
  engine: Engine
  search: Search
  res: ResIndex
  resByLink = new Map<string, Resource>()
  recOfLink = new Map<string, string[]>()
  linkOfRec = new Map<string, string>()
  private raw = new Map<string, Result>()
  private personaPaths: Map<string, string[]> | null = null
  constructor(private data: any, private cat: Catalogue, private model: Model, strictPatterns: any, statements: any, docHashes: any) {
    this.strict = new Strict(model, strictPatterns, statements, docHashes)
    const names = { aliases: model.aliases, types: Object.fromEntries(model.records.map((r) => [r.id, r.type])) }
    this.engine = new Engine(data as Data, names)
    this.search = new Search(cat.passages)
    this.res = new ResIndex(cat.resources)
    for (const r of cat.resources) this.resByLink.set(r.link, r)
    for (const r of model.records) if (r.link) { this.linkOfRec.set(r.id, r.link); const a = this.recOfLink.get(r.link); if (a) a.push(r.id); else this.recOfLink.set(r.link, [r.id]) }
  }
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
  statusOk(r: Resource): boolean {
    if (!r.record_ids.length) return true
    return r.record_ids.some((i) => [undefined, '', 'active'].includes(this.strict.records.get(i)?.status))
  }

  // ------------------------------------------------------------ finders
  cfg(intent: string): any {
    const row = this.data.finders.intents[intent] ?? {}
    const d = this.data.finders.default
    return { w: { ...d.w, ...(row.w ?? {}) }, prior: row.prior ?? {}, only: row.only ?? {}, follow: row.follow ?? d.follow, journey: row.journey ?? d.journey, pin: row.pin ?? {}, filter: !!row.filter, field_bonus: row.field_bonus ?? {} }
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
    for (const rid of reading.named_ids) for (const f of cfg.follow) {
      const tgt = f.dir === 'forward' ? this.strict.forward.get(rid + '\u0000' + f.rel) ?? [] : this.strict.inverse.get(rid + '\u0000' + f.rel) ?? []
      for (const t of tgt.slice(0, 12)) { const l = this.linkOfRec.get(t); if (l && (this.rec(t).active ?? true)) o.set(l, Math.max(o.get(l) ?? 0, f.w)) }
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
    for (const h of hits) if (!links.has(h.link)) links.set(h.link, h.score / top)
    for (const [ln] of [...resScores.entries()].sort((a, b) => b[1] - a[1]).slice(0, extra)) if (!links.has(ln)) links.set(ln, 0)
    for (const ln of [...named.keys(), ...follow.keys(), ...readers.keys(), ...(Object.values(cfg.pin) as string[][]).flat()]) if (!links.has(ln)) links.set(ln, 0)
    const pool = new Map<string, Item>()
    const sw = [...words].sort()
    const denom = Math.max(1e-9, sw.reduce((a, w) => a + this.res.idf(w), 0))
    for (const [ln, text] of links) {
      const r = this.resByLink.get(ln)
      if (!r || !this.statusOk(r) || (ln.startsWith('http') && !named.has(ln))) continue
      const tw = new Set(tokens(r.title))
      const overlap = words.length ? sw.filter((w) => tw.has(w)).reduce((a, w) => a + this.res.idf(w), 0) / denom : 0
      pool.set(ln, { link: ln, title: r.title, type: r.type, group: r.group, extract: r.extract, record_ids: r.record_ids, text, res: (resScores.get(ln) ?? 0) / rtop, title_overlap: overlap, named: named.has(ln), follow: follow.get(ln) ?? 0, reader: readers.get(ln) ?? 0 })
    }
    return pool
  }
  score(item: Item, cfg: any, filt: Map<string, number> | null): number {
    const w = cfg.w
    let v = w.text * item.text + w.res * item.res + w.title * item.title_overlap + w.name * (item.named ? 1.0 : 0.0) + w.link * item.follow + w.prior * this.prior(item, cfg.prior) + (w.reader ?? 0.0) * (item.reader ?? 0.0)
    if (filt !== null) v += filt.get(item.link) ?? 0.0
    return v
  }
  filterBonus(reading: Reading, pool: Map<string, Item>, fb: any): Map<string, number> {
    const f = reading.filters
    const out = new Map<string, number>()
    if (!(f.industries.length || f.places.length)) return out
    for (const rec of this.model.records) {
      if (!['guidance', 'framework'].includes(rec.type) || ![undefined, '', 'active'].includes(rec.status)) continue
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
    if (cfg0.journey && reading.names.length) this.journey(reading, out, perGroup)
    if ((reading.confidence ?? 1.0) < STRONG && !reading.forced) this.withFallback(reading, out, perGroup + more)
    return out
  }
  withFallback(reading: Reading & { question: string }, out: Record<string, Item[]>, size: number): void {
    const plain: Record<string, Item[]> = Object.fromEntries(GROUPS.map((g) => [g, []]))
    for (const h of this.search.resources(reading.clean, 80)) {
      const r = this.resByLink.get(h.link)
      if (!r || !this.statusOk(r) || r.link.startsWith('http')) continue
      plain[r.group].push({ link: r.link, title: r.title, type: r.type, group: r.group, extract: r.extract, record_ids: r.record_ids, score: round(h.score, 4), text: 1.0, res: 0.0, title_overlap: 0.0, named: false, follow: 0.0, reader: 0.0 })
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
    const labels = new Set(reading.names.map((n) => n.text))
    for (const rid of reading.named_ids) { const r = this.rec(rid); if (['term', 'algorithm', 'standard', 'protocol'].includes(r.type)) labels.add(r.label) }
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
  direct(question: string, reading: Reading): Result | null {
    const intent = reading.intent
    const spec = this.data.intents.intents[intent]
    if (!spec.direct) return null
    if (intent === 'source_document') return this.documentAnswer(reading)
    const res = this.answerRaw(question)
    if (res.kind !== 'answer' || res.tier === 2 || res.from_fields) return null
    const rec = this.strict.records.get((res.record ?? {}).id ?? '')
    if (!rec || ![undefined, '', 'active'].includes(rec.status)) return null
    if ((res.records ?? []).length > 1) return null
    let value = res.value
    if ((value === null || value === undefined || value === '') && res.values && res.values.length) value = res.values.map(String).join('; ')
    if ((value === null || value === undefined || value === '') && intent === 'people' && String(res.text || '').split(/\s+/).filter(Boolean).length >= 5 && ['person', 'vendor', 'source'].includes(rec.type)) value = res.text
    if ((value === null || value === undefined || value === '') && intent === 'currency' && res.answer) value = res.answer.label || res.answer.key
    if (value === null || value === undefined || value === '') return null
    if (spec.direct_field_rx && res.field && !new RegExp(spec.direct_field_rx.replace(/^\(\?i\)/, ''), spec.direct_field_rx.startsWith('(?i)') ? 'i' : '').test(String(res.field))) return null
    if (spec.one_of_kind && reading.names.length && reading.names[0].ids.filter((i) => spec.one_of_kind.includes(this.rec(i).type)).length > 1) return null
    for (const n of reading.names.slice(0, 1)) {
      const twins = n.ids.filter((i) => this.rec(i).family === rec.family && this.rec(i).type === rec.type && [undefined, '', 'active'].includes(this.rec(i).status))
      if (twins.length > 1 && !(res.records && res.records.length > 1)) return null
    }
    let ev = this.evidence(rec, res)
    if (ev === null) return null
    let shown = rec
    if (intent === 'currency' && res.answer && this.strict.records.has(res.answer.id)) { shown = this.rec(res.answer.id); ev = this.evidence(shown, res) ?? ev }
    return { value: String(value), field: res.field ?? null, evidence: ev, tag: this.tagOf(shown.id), record_id: shown.id, evidence_line: this.fmt(this.data.notes.evidence, ev) }
  }
  private fmt(t: string, ev: Item) { return t.replace('{kind}', ev.kind).replace('{title}', ev.title).replace('{tag}', ev.tag).replace('{revision}', ev.revision) }
  kindChip(rec: Rec): string { return this.data.rows.kind_chip[rec.type] ?? pyTitle(rec.type) }
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
    const ids = new Set(reading.named_ids.filter((i) => ['document', 'standard'].includes(this.rec(i).type) && [undefined, '', 'active'].includes(this.rec(i).status)))
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
  row(item: Item): Item {
    const rows = this.data.rows
    const ids: string[] = item.record_ids ?? []
    const rec = ids.length ? this.strict.records.get(ids[0]) ?? null : null
    const link = item.link
    let rtype = rec ? rec.type : item.type || 'page'
    if (!rec && this.resByLink.has(link) && !ids.length) rtype = 'page'
    const kind = rows.kind_chip[rtype] ?? pyTitle(String(rtype))
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
    return { kind, tag, title: item.title, source: origin, status, dims, extract: item.extract, paidReferenceOnly: false, action, link, group: item.group }
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
    const mine = this.persona().get(role)
    if (!mine) return null
    const share = new Map(mine.map((m) => [m, [...this.persona().values()].filter((p) => p.includes(m)).length]))
    const ranked = [...mine].sort((a, b) => share.get(a)! - share.get(b)! || cmpStr(a, b))
    const stage = (m: string) => this.cat.curriculum?.modules[this.rec(m).key]?.stage ?? 9
    const first = ranked.slice(0, 10).sort((a, b) => stage(a) - stage(b) || share.get(a)! - share.get(b)! || cmpStr(a, b))
    const title = pyTitle(role.replace(/-/g, ' ')) + ' path'
    return { kind: this.data.rows.kind_chip.path, tag: `PATH:${role}`, title, source: 'Hub curriculum', status: null, dims: null, extract: `The ${first.length} modules most specific to the ${pyTitle(role.replace(/-/g, ' '))} role, in stage order: ${first.map((m) => this.rec(m).label).join(', ')}. The rest are under "more for this role".`, paidReferenceOnly: false, action: 'Open path', link: `/go/PATH:${role}`, group: 'Learn' }
  }
  linksOf(recs: Rec[]): Item {
    const taught: Item[] = [], tried: Item[] = []
    for (const r of recs) {
      for (const t of (this.strict.forward.get(r.id + '\u0000taught_in') ?? []).slice(0, 2)) { const x = this.strict.records.get(t); if (x) taught.push({ title: x.label, tag: this.tagOf(t) }) }
      for (const t of (this.strict.forward.get(r.id + '\u0000practised_with') ?? []).slice(0, 2)) { const x = this.strict.records.get(t); if (x) tried.push({ title: x.label, tag: this.tagOf(t) }) }
    }
    return { taughtIn: taught.slice(0, 2), tryIn: tried.slice(0, 2) }
  }
  entities(ids: string[]): Item[] {
    const recs = ids.map((i) => this.rec(i))
    const chip = (r: Rec) => this.data.rows.kind_chip[r.type] ?? pyTitle(r.type)
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
  ask(question: string, role: string | null = null, forceIntent: string | null = null): Item {
    let reading: Reading & { question: string; forced?: boolean } = this.engine.read(question) as any
    if (forceIntent) reading = { ...reading, intent: forceIntent, intents: [forceIntent], forced: true }
    const intent = reading.intent
    const spec = this.data.intents.intents[intent]
    const N = this.data.notes
    const model: Item = { question, intent, intents: reading.intents, role, answerText: N.answer_text.default, note: '', direct: null, source: null, nameCard: null, choices: null, groups: [], reading: { names: reading.names.map((n) => n.text), scores: reading.scores, filters: reading.filters } }
    if (intent === 'name') return this.nameAnswer(model, reading, role)
    let findReading = reading
    if (intent === 'broad' || intent === 'not_fact') findReading = { ...reading, intents: [reading.names.length ? 'concept' : 'risk'], intent: reading.names.length ? 'concept' : 'risk', clean: reading.clean && reading.intent !== 'broad' ? reading.clean : 'post-quantum cryptography introduction basics' }
    const groups = this.find(findReading, PER_GROUP, PER_GROUP)
    const order = this.groupOrder(intent, role)
    const d = intent !== 'broad' && intent !== 'not_fact' ? this.direct(question, reading) : null
    model.direct = d ? { value: d.value, evidence_line: d.evidence_line, tag: d.tag, field: d.field, evidence: d.evidence } : null
    const outGroups: Item[] = []
    for (const g of order) {
      const items = groups[g] ?? []
      if (!items.length) continue
      const rows = items.map((x) => this.row(x))
      let shown = rows.slice(0, PER_GROUP), more = rows.slice(PER_GROUP)
      if (g === 'Learn' && role && ['learning', 'planning'].includes(intent) && shown.length) {
        const pr = this.rolePathRow(role)
        if (pr) { shown = [...shown.slice(0, 1), pr, ...shown.slice(1, PER_GROUP - 1)]; more = rows.length > PER_GROUP - 1 ? rows.slice(PER_GROUP - 1, PER_GROUP - 1 + PER_GROUP) : more }
      }
      outGroups.push({ name: g, rows: shown, more })
    }
    model.groups = outGroups
    const first = outGroups.find((g) => g.rows.length)?.rows[0] ?? null
    const label = spec.label
    if (intent === 'broad') model.note = N.note.broad
    else if (intent === 'not_fact') model.note = N.note.not_fact
    else if (d) { model.note = N.note.direct.replace('{label}', label); model.source = { label: N.source_line.direct, ...d.evidence, tag: d.tag } }
    else { model.note = N.note.no_direct.replace('{label}', label); if (first) model.source = { label: N.source_line.no_direct, kind: first.kind, title: first.title, tag: first.tag } }
    return model
  }
  nameAnswer(model: Item, reading: Reading & { question: string }, role: string | null): Item {
    const N = this.data.notes
    const ents = this.entities(reading.name_match!)
    if (ents.length > 1) { model.answerText = N.answer_text.name_several; model.choices = ents.map((e) => ({ kind: e.kind, title: e.title, tag: e.tag })); model.note = ''; return model }
    const e = ents[0]
    model.answerText = N.answer_text.name
    model.nameCard = { kind: e.kind, title: e.title, tag: e.tag, link: e.link, taughtIn: e.taughtIn, tryIn: e.tryIn, extract: e.extract }
    model.note = N.note.name
    const sub = { ...reading, named_ids: e.ids, intents: ['name'], intent: 'name' }
    const groups = this.find(sub, PER_GROUP, PER_GROUP)
    for (const g of this.groupOrder('name', role)) {
      const items = (groups[g] ?? []).filter((x) => x.link !== e.link)
      if (items.length) { const rows = items.map((x) => this.row(x)); model.groups.push({ name: g, rows: rows.slice(0, PER_GROUP), more: rows.slice(PER_GROUP) }) }
    }
    return model
  }
}
void normName

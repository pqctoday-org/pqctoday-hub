// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The strict direct-answer reader: question -> pattern -> record name -> alias lookup ->
 * query on the link table -> answer, built only from records, links and statements. Never guesses: a name that fits several
 * records asks the reader to choose; a successor without an eligible, current passage is not stated.
 * Result kinds: answer, clarify, unanswered (with a reason), no_pattern.
 * Question words and patterns are data (`answer.generated.json`, a generated copy of the reader's pattern and cue files); no language model is involved.
 */

export interface Rec {
  id: string; type: string; family: string; key: string; label: string; definition?: string; status?: string; active?: boolean
  last_verified?: string; link: string; fields?: Record<string, any>
}
export interface Model {
  records: Rec[]
  aliases: Record<string, { id: string; kind: string }[]>
  links: { from: string; rel: string; to: string; basis?: string }[]
  qa?: { question: string; key: string; source: string; answer: string; eligibility: any }[]
  qa_match?: { min_words?: number; min_overlap?: number }
  meta: { fields_by_family: Record<string, string[]>; same_label_same_thing?: string[] }
}
interface PatternRx { src: string; field: string | null }
export interface Patterns {
  cleanup: { strip_prefixes: string[]; strip_suffixes: string[] }
  patterns: { id: string; query: any; rx: PatternRx[] }[]
  cues: Record<string, any>
  typewords: Record<string, string[]>
  words: { stop: string[]; filler: string[] }
}
export type Result = Record<string, any>

const WHEN = /^\s*(?:when\b|by when\b|by what date\b|(?:on |by |in )?(?:what|which) (?:date|year|month)\b|how soon\b)/
const POLITE = /^\s*(?:(?:please|kindly|hi|hey)[, ]+)?(?:(?:can|could|would) you (?:please )?(?:tell me|say|let me know)|tell me|let me know|i(?:'d| would)? (?:like|want) to know|do you know|i wonder)\s+/
const WHEN_ANY = /\bwhen\b(?! it comes)|\b(?:the|what|which) (?:date|year|month)\b|\bhow soon\b/
const DATEISH = /date|year|deadline|_at$|month|when/i
const WHO_NOUN = '\\bthe (?:organi[sz]ation|body|company|agency|authority|entity|group|institution|publisher) (?:that|which|who|behind|responsible)\\b'
const WHO = /^\s*(?:who\b|whom\b|(?:which|what) (?:organi[sz]ation|body|company|agency|authority|entity|vendor)\b)/
const NAMEISH = /^(?:[A-Za-z]+[0-9][A-Za-z0-9.\-]*|[0-9][0-9.\-]*[A-Za-z]*|[A-Z][a-z]+[A-Z][A-Za-z0-9]*|[A-Z]{3,}[A-Za-z0-9\-]*)$/
const PAIR = [
  /\bbetween\s+(?<a>.+?)\s+and\s+(?<b>.+?)\s*\??$/i,
  /\bhow\s+(?:are|do|does|is)\s+(?<a>.+?)\s+and\s+(?<b>.+?)\s+(?:are\s+|is\s+)?(?:related|connected|connect|linked|relate|link|associated|tie together|correspond(?: to one another| to each other)?)\b/i,
  /\bconnects\s+(?<a>.+?)\s+and\s+(?<b>.+?)\s*\??$/i,
  /^\s*what\s+links\s+(?<a>.+?)\s+(?:and|with|to)\s+(?<b>.+?)(?:\s+together)?\s*\??$/i,
  /\b(?:how|in what ways?)\s+(?:do\s+|does\s+)?(?<a>.+?)\s+and\s+(?<b>.+?)\s+(?:are\s+|is\s+)?(?:related|connected|connect|associated|linked|relate(?: to each other)?|fit together|tie together|correspond(?: to one another| to each other)?|intersect(?: or tie together)?)\s*[.?]*$/i,
]

export function normName(text: string): string {
  return text.normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const has = (text: string, cue: string): boolean => (cue.trim() ? new RegExp('(?<![a-z0-9])' + esc(cue.trim()) + '(?![a-z0-9])').test(text) : false)
const setLeq = (a: Iterable<string>, b: Iterable<string>) => { const B = new Set(b); for (const x of a) if (!B.has(x)) return false; return true }
const uniqSorted = (a: Iterable<string>) => [...new Set(a)].sort()

export class Strict {
  records = new Map<string, Rec>()
  forward = new Map<string, string[]>()
  inverse = new Map<string, string[]>()
  outRels = new Map<string, Set<string>>()
  reviewed = new Map<string, Set<string>>()
  qa: { entry: any; words: Set<string> }[] = []
  qaByWord = new Map<string, number[]>()
  stop: Set<string>
  filler: Set<string>
  typewords: Map<string, Set<string>>
  pats: { id: string; query: any; rx: { re: RegExp; field: string | null }[] }[]
  cues: Record<string, any>
  private model: Model
  private patterns: Patterns
  private statements: Record<string, any>
  private docHashes: Record<string, string | null>
  constructor(model: Model, patterns: Patterns, statements: Record<string, any>, docHashes: Record<string, string | null>) {
    this.model = model
    this.patterns = patterns
    this.statements = statements
    this.docHashes = docHashes
    for (const r of model.records) this.records.set(r.id, r)
    const push = (m: Map<string, string[]>, k: string, v: string) => { const a = m.get(k); if (a) a.push(v); else m.set(k, [v]) }
    for (const e of model.links) {
      push(this.forward, e.from + '\u0000' + e.rel, e.to)
      push(this.inverse, e.to + '\u0000' + e.rel, e.from)
      if (!this.outRels.has(e.from)) this.outRels.set(e.from, new Set())
      this.outRels.get(e.from)!.add(e.rel)
      if (e.basis === 'reviewed') { const k = e.from + '\u0000' + e.to; if (!this.reviewed.has(k)) this.reviewed.set(k, new Set()); this.reviewed.get(k)!.add(e.rel) }
    }
    this.stop = new Set(patterns.words.stop)
    this.filler = new Set(patterns.words.filler)
    this.qa = (model.qa ?? []).map((q) => ({ entry: q, words: this.words(q.question) }))
    this.qa.forEach((q, i) => { for (const w of q.words) push2(this.qaByWord, w, i) })
    this.typewords = new Map(Object.entries(patterns.typewords).map(([k, v]) => [k, new Set(v)]))
    this.cues = patterns.cues
    this.pats = patterns.patterns.map((p) => ({ id: p.id, query: p.query, rx: p.rx.map((x) => ({ re: new RegExp('^(?:' + x.src + ')', 'i'), field: x.field })) }))
  }
  private fwd(id: string, rel: string): string[] { return this.forward.get(id + '\u0000' + rel) ?? [] }
  private inv(id: string, rel: string): string[] { return this.inverse.get(id + '\u0000' + rel) ?? [] }
  words(text: string): Set<string> {
    return new Set((text.toLowerCase().match(/[a-z0-9][a-z0-9\-]*/g) ?? []).filter((w) => !this.stop.has(w) && w.length > 1))
  }
  brief(r: Rec): Result { return { id: r.id, key: r.key, label: r.label, link: r.link, status: r.status, family: r.family, type: r.type, list: (r.fields ?? {}).list ?? '' } }
  resolve(name: string): string[] { return uniqSorted((this.model.aliases[normName(name)] ?? []).map((h) => h.id)) }

  // ---------------------------------------------------------------- reading
  clean(q: string): string {
    q = q.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim()
    q = q.replace(/[?!.]+$/, '').trim()
    return q.replace(/\s+/g, ' ')
  }
  readQuestion(question: string): Result | null {
    const q = this.clean(question)
    for (const p of this.pats) {
      for (const { re, field } of p.rx) {
        const m = re.exec(q)
        if (!m) continue
        let name = (m.groups!.name as string).trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
        let low = name.toLowerCase()
        for (const pre of this.patterns.cleanup.strip_prefixes) if (low.startsWith(pre)) { name = name.slice(pre.length); low = low.slice(pre.length) }
        for (const suf of this.patterns.cleanup.strip_suffixes) if (low.endsWith(suf)) { name = name.slice(0, name.length - suf.length); low = low.slice(0, low.length - suf.length) }
        const tw = m.groups?.typeword
        return { pattern: p.id, query: p.query, name: name.trim(), field, typeword: tw ? tw.toLowerCase() : null }
      }
    }
    return null
  }

  spotNames(question: string, maxLen = 40, skip?: Set<string>, mask?: Set<string>): { ids: string[]; span: [number, number] | null; toks: string[] } {
    const toks = normName(question).split(' ').filter(Boolean)
    const phrases: [number, number][] = []
    for (const ph of mask ?? []) {
      const pt = ph.split(' ')
      for (let i = 0; i + pt.length <= toks.length; i++) if (toks.slice(i, i + pt.length).join(' ') === ph) phrases.push([i, i + pt.length])
    }
    let best: [number, number] | null = null
    for (let i = 0; i < toks.length; i++) {
      for (let j = Math.min(toks.length, i + maxLen); j > i; j--) {
        if (best && j - i <= best[1] - best[0]) break
        const span = toks.slice(i, j).join(' ')
        if (skip && skip.has(span)) continue
        if (phrases.some(([ps, pe]) => i < pe && ps < j && !(i <= ps && pe <= j))) continue
        const entries = this.model.aliases[span]
        if (!entries) continue
        if (entries.every((e) => e.kind === 'former-id') && ['source', 'document', 'product', 'term', 'module', 'section', 'tool'].includes(toks[i])) continue
        const part = toks.slice(i, j)
        const common = part.every((t) => this.stop.has(t) || this.filler.has(t) || (t.length <= 2 && !/[0-9]/.test(t)))
        if (common && (j - i === 1 || part.every((t) => this.stop.has(t)))) continue
        best = [i, j]
        break
      }
    }
    if (!best) return { ids: [], span: null, toks }
    return { ids: this.resolve(toks.slice(best[0], best[1]).join(' ')), span: best, toks }
  }

  private readByLinks(ids: string[], named: string, rest: string, narrowed: string[] | null): Result | null {
    const table = this.cues.links ?? {}
    for (const direction of ['reverse', 'forward']) {
      const pool = direction === 'reverse' || narrowed === null ? ids : narrowed
      const types = new Set(pool.map((i) => this.records.get(i)!.type))
      for (const row of table[direction] ?? []) {
        if (!types.has(row.named) || !row.cues.some((c: string) => has(rest, c.toLowerCase()))) continue
        const pick = pool.filter((i) => this.records.get(i)!.type === row.named)
        const q: Result = { relation: row.relation, walk: direction === 'reverse' ? 'inverse_members' : 'members', active_only: true }
        if (row.answer) q.family = row.answer
        return { pattern: `links.${direction}`, query: q, name: named, field: null, typeword: null, ids: pick }
      }
    }
    return null
  }

  readByName(question0: string): Result | null {
    const cues = this.cues
    let question = question0
    question = question.replace(/\b(what|where|who|how|that|it|there|here)['’]s\b/gi, '$1 is')
    question = question.replace(/\b(you|we|they)['’]re\b/gi, '$1 are')
    question = question.replace(/\bI['’]m\b/g, 'I am')
    question = question.replace(/\b(I|you|we|they)['’]ll\b/g, '$1 will')
    question = question.replace(/\s*[—–]\s*/g, ' - ')
    let low = ' ' + question.toLowerCase().trim() + ' '
    for (const phrase of cues.not_advice ?? []) low = low.split(' ' + phrase + ' ').join(' ')
    let hits: string[] = (cues.out_of_scope ?? []).filter((c: string) => has(low, c) || (c.endsWith(' ') && low.includes(c)))
    const soft: Record<string, string[]> = cues.soft_out_of_scope ?? {}
    const softKeys = Object.keys(soft)
    if (hits.length && !setLeq(hits, softKeys)) {
      const r0 = this.spotNames(question)
      if (r0.ids.length && r0.span) {
        const inside = ' ' + r0.toks.slice(r0.span[0], r0.span[1]).join(' ') + ' '
        const outside = ' ' + [...r0.toks.slice(0, r0.span[0]), ...r0.toks.slice(r0.span[1])].join(' ') + ' '
        hits = hits.filter((h) => !(has(inside, normName(h)) && !has(outside, normName(h))))
      }
      if (!setLeq(hits, softKeys)) return { kind: 'unanswered', reason: 'outside what the Hub states as fact', read_as: 'out of scope' }
    }
    const fieldsCues: Record<string, string[]> = cues.fields ?? {}
    const cueSpans = new Set<string>()
    for (const v of Object.values(fieldsCues)) for (const c of v) if (c.trim().includes(' ')) cueSpans.add(normName(c))
    const topic = new Set<string>((cues.topic_words ?? []).map((c: string) => normName(c)))
    const cueWords = new Set<string>()
    for (const v of Object.values(fieldsCues)) for (const c of v) if (c.trim().includes(' ')) for (const w of normName(c).split(' ')) cueWords.add(w)
    const toks0 = normName(question).split(' ').filter(Boolean)
    const yielding = new Set(toks0.filter((w) => cueWords.has(w)))
    let r = this.spotNames(question, 40, new Set([...cueSpans, ...topic, ...yielding]), cueSpans)
    if (!r.ids.length) r = this.spotNames(question)
    let ids = r.ids
    const span = r.span as [number, number]
    const toks = r.toks
    if (hits.length && ids.length) {
      const inside = ' ' + toks.slice(span[0], span[1]).join(' ') + ' '
      const outside = ' ' + [...toks.slice(0, span[0]), ...toks.slice(span[1])].join(' ') + ' '
      hits = hits.filter((h) => !(has(inside, normName(h)) && !has(outside, normName(h))))
    }
    if (hits.length && !hits.every((h) => ids.some((i) => (soft[h] ?? []).includes(this.records.get(i)!.type)))) return { kind: 'unanswered', reason: 'outside what the Hub states as fact', read_as: 'out of scope' }
    if (!ids.length) return null
    const named = toks.slice(span[0], span[1]).join(' ')
    const covered = new Set(named.split(' '))
    const rawWords = [...question.matchAll(/[\p{L}\p{N}][\p{L}\p{N}_.\-]*/gu)].map((m) => m[0])
    for (const raw of rawWords) {
      const w = normName(raw)
      if (!w || setLeq(w.split(' '), covered)) continue
      if (w in this.model.aliases) continue
      const cueLists: string[][] = [...Object.values(fieldsCues), ...Object.values(cues.links ?? {}).flatMap((d: any) => d.map((row: any) => row.cues))]
      if ((NAMEISH.test(raw) || /[0-9]/.test(raw)) && !cueLists.some((v) => v.some((c) => c.includes(raw.toLowerCase()) && has(low, c))))
        return { kind: 'unanswered', reason: `'${raw}' is not something the Hub knows`, read_as: `name: ${named}` }
    }
    const rest = ' ' + [...toks.slice(0, span[0]), ...toks.slice(span[1])].join(' ') + ' '
    const ids0 = [...ids]
    let narrowed: string[] | null = null
    const linkRows: any[] = Object.values(cues.links ?? {}).flat() as any[]
    const linkTypes = new Set(linkRows.map((row) => row.named))
    const reverseTypes = new Set(((cues.links ?? {}).reverse ?? []).map((row: any) => row.named))
    const rolesNamed = ids0.some((i) => linkTypes.has(this.records.get(i)!.type))
    const answerTyped = ids0.some((i) => reverseTypes.has(this.records.get(i)!.type))
    const fbf0 = this.model.meta.fields_by_family
    const famsOf = (pool: string[]) => new Set(pool.map((i) => this.records.get(i)!.family))
    for (const [tw, allowed] of this.typewords) {
      if (!has(rest, tw)) continue
      ids = ids.filter((i) => allowed.has(this.records.get(i)!.type))
      if (!ids.length && answerTyped) { narrowed = null; ids = ids0; break }
      if (!ids.length && [...famsOf(ids0)].some((f) => (fbf0[f] ?? []).some((fld) => (fieldsCues[fld] ?? []).some((c) => has(' ' + c.toLowerCase() + ' ', tw))))) { ids = ids0; break }
      const fwdRows: any[] = (cues.links ?? {}).forward ?? []
      const types0 = new Set(ids0.map((i) => this.records.get(i)!.type))
      if (!ids.length && fwdRows.some((rw) => types0.has(rw.named) && rw.cues.some((c: string) => has(rest, c.toLowerCase())))) { ids = ids0; narrowed = null; break }
      if (!ids.length && types0.has('module') && ((cues.intents ?? {}).steps ?? []).some((c: string) => has(rest, c.toLowerCase()))) { ids = ids0.filter((i) => this.records.get(i)!.type === 'module'); break }
      const loc: string[] = (cues.intents ?? {}).locate ?? []
      if (!ids.length && ['section', 'lesson', 'module'].some((t) => types0.has(t)) && [...loc, 'covers', 'cover'].some((c) => has(rest, c.toLowerCase()))) { ids = ids0.filter((i) => ['section', 'lesson', 'module'].includes(this.records.get(i)!.type)); break }
      const restTw = rest.split(` ${tw} `).join(' ')
      const asks = (pool: string[], text: string, multi: boolean) => [...famsOf(pool)].some((f) => (fbf0[f] ?? []).some((fld) => (fieldsCues[fld] ?? []).some((c) => (!multi || c.trim().includes(' ')) && has(text, c.toLowerCase()))))
      if (!ids.length && asks(ids0, restTw, true)) { ids = ids0; break }
      if (!ids.length) return { kind: 'unanswered', reason: `no ${tw} has this name`, read_as: `name: ${named} (${tw})` }
      if (!asks(ids, restTw, true) && asks(ids0.filter((i) => !ids.includes(i)), restTw, true)) { ids = ids0; break }
      narrowed = [...ids]
      break
    }
    const known = new Set<string>([...this.stop, ...this.typewords.keys(), 'modules', 'tools', 'steps'])
    for (const c of cues.topic_words ?? []) for (const w of normName(c).split(' ')) known.add(w)
    const groups: string[][] = [...Object.values(cues.intents ?? {}) as string[][], ...Object.values(fieldsCues), ...linkRows.map((row) => row.cues)]
    for (const g of groups) for (const c of g) for (const w of normName(c).split(' ')) known.add(w)
    for (const w of this.filler) known.add(w)
    for (const tw of this.typewords.keys()) for (const w of tw.split(' ')) known.add(w)
    const leftover = rest.split(' ').filter((w) => w && !known.has(w) && w.length > 1)
    const words = question.match(/[A-Za-z][A-Za-z0-9\-]*/g) ?? []
    const proper = new Set(words.slice(1).filter((w) => w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase()).map(normName))
    for (const x of [...proper]) if (covered.has(x) || known.has(x)) proper.delete(x)
    if (leftover.length > 1 || (leftover.length && leftover.some((w) => proper.has(w)))) return { kind: 'unanswered', reason: `only part of the question is recognised (${named})`, read_as: `name: ${named}; not understood: ${leftover.slice(0, 6).join(' ')}` }
    if (rolesNamed) {
      const byLink = this.readByLinks(answerTyped ? ids0 : ids, named, rest, narrowed)
      if (byLink !== null) {
        if (leftover.length) return { kind: 'unanswered', reason: `only part of the question is recognised (${named})`, read_as: `name: ${named}; not understood: ${leftover.join(' ')}` }
        return byLink
      }
    }
    if ((cues.use_cues ?? []).some((c: string) => has(low, c))) {
      const tools = ids.filter((i) => this.records.get(i)!.type === 'tool')
      if (tools.length) return { pattern: 'define', query: { relation: null, walk: 'none' }, name: named, field: null, typeword: null, ids: tools, fields_summary_ok: true }
    }
    const fams = famsOf(ids)
    const fbf = this.model.meta.fields_by_family
    let bestField: string | null = null
    let bestHits = 0
    const ql = question.toLowerCase()
    const who = new RegExp('\\bwho(?:m)?\\b|\\b(?:which|what) (?:organi[sz]ation|body|company|agency|authority|group)\\b|' + WHO_NOUN).test(ql)
    const when = WHEN_ANY.test(ql)
    const scored: [number, string][] = []
    for (const [field, cl] of Object.entries(fieldsCues)) {
      if (![...fams].some((f) => (fbf[f] ?? []).includes(field))) continue
      let h = cl.filter((c) => has(rest, c.toLowerCase())).reduce((a, c) => a + c.split(/\s+/).filter(Boolean).length, 0)
      if (h && who && (cues.who_fields ?? []).includes(field)) h += 2
      if (h && when && DATEISH.test(field)) h += 2
      if (h) scored.push([h, field])
      if (h > bestHits) { bestField = field; bestHits = h }
    }
    for (const [intent, cl] of Object.entries(cues.intents ?? {}) as [string, string[]][]) {
      if (intent === 'define' || !cl.some((c) => has(rest, c.toLowerCase()))) continue
      if (intent === 'successor') {
        if (!ids.some((i) => this.records.get(i)!.family === 'library')) continue
        return { pattern: 'successor', query: { relation: 'replaced_by', walk: 'chain' }, name: named, field: null, typeword: null }
      }
      if (intent === 'steps') return { pattern: 'steps', query: { relation: null, walk: 'list_field', field: 'steps' }, name: named, field: 'steps', typeword: null }
      if (intent === 'locate' && ids.every((i) => this.records.get(i)!.type === 'lesson')) return { pattern: 'field', query: { relation: null, walk: 'field' }, name: named, field: 'playground_label', typeword: null }
      if (intent === 'locate' && bestField && !ids.some((i) => ['section', 'module'].includes(this.records.get(i)!.type))) continue
      if (intent === 'locate') return { pattern: 'locate', query: { relation: 'taught_in', walk: 'members', records_answer_themselves: ['section', 'module'] }, name: named, field: null, typeword: null }
      if (intent === 'cites') {
        if (!ids.some((i) => this.outRels.get(i)?.has('cites'))) continue
        return { pattern: 'cites', query: { relation: 'cites', walk: 'members' }, name: named, field: null, typeword: null }
      }
    }
    const sameFact: Set<string>[] = [...(cues.same_fact_fields ?? []), ...(cues.tie_ok ?? [])].map((p: string[]) => new Set(p))
    const pairSame = (a: string, b: string) => sameFact.some((s) => s.size === new Set([a, b]).size && [a, b].every((x) => s.has(x)))
    const rivals = scored.filter(([h, f]) => h === bestHits && f !== bestField && !pairSame(f, bestField!) && [...fams].some((fam) => (fbf[fam] ?? []).includes(f) && (fbf[fam] ?? []).includes(bestField!))).map(([, f]) => f)
    if (rivals.length) return { kind: 'unanswered', reason: 'the question fits two different facts of this record', read_as: `name: ${named}; asks for: ${bestField} or ${rivals[0]}` }
    if (bestField) return { pattern: 'field', query: { relation: null, walk: 'field' }, name: named, field: bestField, typeword: null }
    const unheld = Object.entries(fieldsCues).filter(([fld, cl]) => ![...fams].some((f) => (fbf[f] ?? []).includes(fld)) && cl.some((c) => c.trim().includes(' ') && has(rest, c.toLowerCase()))).map(([f]) => f)
    if (unheld.length && !(cues.define_over_unheld ?? []).some((c: string) => has(rest, c))) return { kind: 'unanswered', reason: 'the Hub keeps no such value for this record', read_as: `name: ${named}; asks for: ${unheld[0]}` }
    if (leftover.length) return { kind: 'unanswered', reason: `found ${named} but not what is asked about it`, read_as: `name: ${named}; not understood: ${leftover.join(' ')}` }
    const contentRest = rest.split(' ').filter((w) => w && !this.stop.has(w) && !this.filler.has(w))
    const fieldWords = new Set(Object.values(fieldsCues).flatMap((cl) => cl.flatMap((c) => normName(c).split(' '))))
    const mostlyName = span[1] - span[0] >= 3 && !contentRest.length && !rest.split(' ').filter((w) => w && !this.stop.has(w)).some((w) => fieldWords.has(w))
    if (((cues.intents ?? {}).define ?? []).some((c: string) => has(rest, c.toLowerCase())) || !rest.trim() || mostlyName)
      return { pattern: 'define', query: { relation: null, walk: 'none' }, name: named, field: null, typeword: null, ids, fields_summary_ok: true }
    return { kind: 'unanswered', reason: 'found the name but not what is being asked', read_as: `name: ${named}` }
  }

  closestQa(question: string): Result | null {
    const qw = this.words(question)
    if (qw.size < (this.model.qa_match?.min_words ?? 4)) return null
    const cand = new Set<number>()
    for (const w of qw) for (const i of this.qaByWord.get(w) ?? []) cand.add(i)
    let best: any = null
    let bestScore = 0
    for (const i of [...cand].sort((a, b) => a - b)) {
      const { entry, words: ew } = this.qa[i]
      if (!ew.size) continue
      let inter = 0
      for (const w of qw) if (ew.has(w)) inter++
      const score = Math.min(inter / ew.size, inter / qw.size)
      if (score > bestScore) { best = entry; bestScore = score }
    }
    if (best === null || bestScore < (this.model.qa_match?.min_overlap ?? 0.75)) return null
    return { ...best, score: Math.round(bestScore * 1000) / 1000 }
  }

  pairQuestion(question: string): Result | null {
    for (const rx of PAIR) {
      const m = rx.exec(question.trim())
      if (!m) continue
      const trim = (s: string) => s.replace(/^[ ?.]+|[ ?.]+$/g, '')
      const a = this.resolve(trim(m.groups!.a)), b = this.resolve(trim(m.groups!.b))
      if (!a.length || !b.length) return null
      const linked: [string, string, string[]][] = []
      for (const x of a) for (const y of b) {
        const rels = new Set([...(this.reviewed.get(x + '\u0000' + y) ?? []), ...(this.reviewed.get(y + '\u0000' + x) ?? [])])
        if (rels.size) linked.push([x, y, [...rels].sort()])
      }
      if (linked.length !== 1 || linked[0][2].length !== 1) return null
      const ra = this.records.get(linked[0][0])!, rb = this.records.get(linked[0][1])!
      return { kind: 'answer', read_as: `pair: ${ra.label} / ${rb.label}`, record: this.brief(ra), answer: this.brief(ra), value: linked[0][2][0], field: 'relationship_type', records: [this.brief(ra), this.brief(rb)], evidence: [] }
    }
    return null
  }

  // ---------------------------------------------------------------- answering
  answer(question: string): Result {
    const pair = this.pairQuestion(question)
    if (pair !== null) return pair
    const first = this.answerOf(question, this.readQuestion(question))
    if (first.kind === 'answer' || first.kind === 'clarify') return first
    const exact = this.closestQa(question)
    const qaAnswer = (h: any): Result => ({ kind: 'answer', tier: 2, read_as: 'closest Q&A entry', reviewed_key: h.key, qa_source: h.source, text: h.answer, eligibility: h.eligibility, score: h.score, evidence: [] })
    if (exact && exact.score >= 0.95) return qaAnswer(exact)
    const second = this.readByName(question)
    let final = first
    if (second !== null && 'kind' in second) final = first.kind === 'no_pattern' ? second : first
    else if (second !== null) {
      const res = this.answerOf(question, second)
      if (res.kind === 'answer' || res.kind === 'clarify') { res.reader = 'name-first'; return res }
      if (first.kind === 'no_pattern') final = res
    }
    const reasons = [first, second, final].map((r) => String((r && r.reason) || '')).join(' ')
    const hit = this.closestQa(question)
    if (hit && (!reasons.includes('outside what the Hub states') || hit.score >= 0.9)) return qaAnswer(hit)
    return final
  }

  private answerOf(question: string, read: Result | null): Result {
    if (read === null) return { kind: 'no_pattern', reason: 'no question pattern fits', read_as: null }
    const R = this.records
    const readAs = `${read.pattern}: ${read.name}` + (read.typeword ? ` (${read.typeword})` : '')
    let ids: string[] = read.ids && read.ids.length ? read.ids : this.resolve(read.name)
    if (read.typeword) {
      const allowed = this.typewords.get(read.typeword) ?? new Set<string>()
      ids = ids.filter((i) => allowed.has(R.get(i)!.type))
      if (!ids.length) return { kind: 'unanswered', reason: `no ${read.typeword} has this name`, read_as: readAs }
    }
    if (!ids.length) return { kind: 'unanswered', reason: 'no record has this name', read_as: readAs }
    const q = read.query
    const walkOf = q.walk
    if (ids.length > 1 && walkOf === 'none') {
      const kinds = new Map((this.model.aliases[normName(read.name)] ?? []).map((e) => [e.id, e.kind]))
      const direct = ids.filter((i) => !['family', 'former', 'variant'].includes(kinds.get(i) as string))
      if (direct.length && direct.length < ids.length) ids = direct
    }
    if (ids.length > 1 && walkOf === 'none') {
      const withdef = ids.filter((i) => R.get(i)!.definition)
      if (withdef.length && ids.filter((i) => !withdef.includes(i)).every((i) => R.get(i)!.type === 'step')) ids = withdef
    }
    if (ids.length > 1 && (walkOf === 'members' || walkOf === 'inverse_members') && q.relation && !q.records_answer_themselves) {
      const linked = ids.filter((i) => (walkOf === 'members' ? this.fwd(i, q.relation) : this.inv(i, q.relation)).length)
      if (linked.length === 1) ids = linked
    }
    if (ids.length > 1 && walkOf !== 'chain') {
      const active = ids.filter((i) => R.get(i)!.status === 'active')
      if (active.length === 1) ids = active
    }
    const ra: string[] | undefined = q.records_answer_themselves
    if (ids.length > 1 && ra && ra.length) {
      const selfans = ids.filter((i) => ra.includes(R.get(i)!.type))
      if (selfans.length) ids = selfans
    }
    if (walkOf === 'chain') {
      const docs = ids.filter((i) => R.get(i)!.family === 'library')
      if (!docs.length) return { kind: 'unanswered', reason: 'only documents have successors', read_as: readAs }
      const later = new Set(docs.flatMap((i) => this.fwd(i, q.relation)))
      const earliest = docs.filter((i) => !later.has(i))
      ids = earliest.length ? earliest : docs
      const own = ids.filter((i) => normName(R.get(i)!.key) === normName(read.name))
      if (ids.length > 1 && own.length === 1) ids = own
    }
    if (ids.length > 1 && walkOf === 'none') {
      const yields = new Set<string>(this.cues.define_yields ?? [])
      let keep = ids.filter((i) => !yields.has(R.get(i)!.family))
      const tells = (i: string) => { const r = R.get(i)!; return !!r.definition || Object.values(r.fields ?? {}).some((v) => !(v === null || v === '' || (Array.isArray(v) && !v.length))) }
      if (keep.length && !keep.some(tells)) { const t = ids.filter(tells); keep = t.length ? t : keep }
      if (keep.length && keep.length < ids.length) ids = keep
    }
    if (ids.length > 1 && walkOf === 'none') {
      const lowQ = ' ' + question.toLowerCase() + ' '
      for (const [cue, types] of Object.entries(this.cues.define_prefers ?? {}) as [string, string[]][]) {
        if (has(lowQ, cue)) {
          const pick = ids.filter((i) => types.includes(R.get(i)!.type))
          if (pick.length === 1) { ids = pick; break }
        }
      }
    }
    if (ids.length > 1 && walkOf !== 'field' && walkOf !== 'list_field') return { kind: 'clarify', reason: 'several records have this name', read_as: readAs, candidates: ids.map((i) => this.brief(R.get(i)!)) }
    const rel = q.relation
    let start = R.get(ids[0])!
    const walk = walkOf
    let readF = read.field
    if (walk === 'field' || walk === 'list_field') {
      const want = read.field || q.field
      const ql = ' ' + question.toLowerCase().trim()
      const qlp = ql.replace(POLITE, '')
      const urgent = qlp.trimStart().startsWith('how soon') && (this.cues.urgency_fields ?? []).includes(want)
      if ((WHEN.test(qlp) || WHEN_ANY.test(qlp)) && !DATEISH.test(want || '') && !urgent) return { kind: 'unanswered', reason: "a 'when' question, but this is not a date", read_as: readAs }
      const whoFields = new Set<string>([...(this.cues.who_fields ?? []), 'authority', 'partners', 'products'])
      const asksWho = WHO.test(qlp) || new RegExp('\\bby whom\\b|\\bwho (?:published|wrote|issued|released|authored|owns|enforces|leads|runs|maintains|is behind)\\b|' + WHO_NOUN).test(qlp)
      if (asksWho && !whoFields.has(want)) return { kind: 'unanswered', reason: "a 'who' question, but this is not a person or body", read_as: readAs }
      const fbf = this.model.meta.fields_by_family
      let held = ids.filter((i) => (fbf[R.get(i)!.family] ?? []).includes(want))
      if (!held.length) return { kind: 'unanswered', reason: 'the Hub keeps no such value for this record', read_as: readAs }
      const emptyV = (v: any) => v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)
      if (held.length > 1) {
        const valued = held.filter((i) => !emptyV((R.get(i)!.fields ?? {})[want]))
        if (valued.length === 1) held = valued
      }
      if (held.length > 1) {
        const same = new Set(this.model.meta.same_label_same_thing ?? [])
        const vals = held.map((i) => (R.get(i)!.fields ?? {})[want])
        const famsH = new Set(held.map((i) => R.get(i)!.family))
        const labels = new Set(held.map((i) => normName(R.get(i)!.label || '')))
        const scalar = !!vals[0] && !Array.isArray(vals[0])
        if (famsH.size === 1 && setLeq(famsH, same) && labels.size === 1 && walk === 'field' && scalar && vals.every((v) => v === vals[0]))
          return { kind: 'answer', read_as: readAs, record: this.brief(R.get(held[0])!), answer: this.brief(R.get(held[0])!), value: vals[0], field: want, records: held.map((i) => this.brief(R.get(i)!)), evidence: [] }
        const kinds = new Map((this.model.aliases[normName(read.name)] ?? []).map((e) => [e.id, e.kind]))
        const linked = held.every((i) => ['family', 'former', 'variant'].includes(kinds.get(i) as string))
        if (linked && walk === 'field' && scalar && vals.every((v) => v === vals[0]))
          return { kind: 'answer', read_as: readAs, record: this.brief(R.get(held[0])!), answer: this.brief(R.get(held[0])!), value: vals[0], field: want, records: held.map((i) => this.brief(R.get(i)!)), evidence: [] }
        return { kind: 'clarify', reason: 'several records have this name', read_as: readAs, candidates: held.map((i) => this.brief(R.get(i)!)) }
      }
      start = R.get(held[0])!
      readF = want
    }
    const emptyV2 = (v: any) => v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)
    const fieldsOf = (r: Rec) => r.fields ?? {}
    if (walk === 'list_field') {
      const vals = fieldsOf(start)[readF]
      if (emptyV2(vals)) return { kind: 'unanswered', reason: 'the Hub holds no value for this', read_as: readAs, record: this.brief(start) }
      return { kind: 'answer', read_as: readAs, record: this.brief(start), answer: this.brief(start), values: [...vals], evidence: [] }
    }
    if (walk === 'field') {
      let val = fieldsOf(start)[readF]
      for (const pair of this.cues.same_fact_fields ?? []) {
        if (pair.includes(readF)) {
          const vs = new Set<string>()
          for (const f of pair) { const v = fieldsOf(start)[f]; if (!emptyV2(v)) vs.add(String(fieldText(v)).trim().toLowerCase().replace(/_/g, ' ')) }
          if (vs.size > 1) return { kind: 'unanswered', reason: "the Hub's tables disagree on this value", read_as: readAs, record: this.brief(start), conflict: [...vs].sort() }
        }
      }
      if (emptyV2(val) || !val) {
        for (const pair of this.cues.same_fact_fields ?? []) {
          if (pair.includes(readF)) {
            const other = pair.find((f: string) => f !== readF && !emptyV2(fieldsOf(start)[f]))
            if (other) { val = fieldsOf(start)[other]; readF = other }
          }
        }
      }
      if (!val || emptyV2(val)) return { kind: 'unanswered', reason: 'the Hub holds no value for this', read_as: readAs, record: this.brief(start) }
      if (Array.isArray(val)) return { kind: 'answer', read_as: readAs, record: this.brief(start), answer: this.brief(start), values: [...val], field: readF, evidence: [] }
      return { kind: 'answer', read_as: readAs, record: this.brief(start), answer: this.brief(start), value: val, field: readF, evidence: [] }
    }
    if (walk === 'inverse_members') {
      const fam = q.family
      const sources = this.inv(start.id, rel).filter((i) => (fam === undefined || fam === null || R.get(i)!.family === fam) && (R.get(i)!.active ?? true)).sort()
      if (!sources.length) return { kind: 'unanswered', reason: 'the Hub links nothing to this', read_as: readAs, record: this.brief(start) }
      return { kind: 'answer', read_as: readAs, record: this.brief(start), answer: this.brief(start), values: sources.map((i) => R.get(i)!.key), records: sources.map((i) => this.brief(R.get(i)!)), relation: rel, evidence: [] }
    }
    if (walk === 'members') {
      if ((q.records_answer_themselves ?? []).includes(start.type)) return { kind: 'answer', read_as: readAs, record: this.brief(start), answer: this.brief(start), evidence: [] }
      const targets = this.fwd(start.id, rel).filter((t) => !q.active_only || (R.get(t)!.active ?? true)).sort()
      if (!targets.length) return { kind: 'unanswered', reason: 'the Hub links nothing to this', read_as: readAs, record: this.brief(start) }
      return { kind: 'answer', read_as: readAs, record: this.brief(start), answer: this.brief(start), values: targets.map((t) => R.get(t)!.key), records: targets.map((t) => this.brief(R.get(t)!)), relation: rel, evidence: [] }
    }
    if (rel === null || rel === undefined) {
      if (!start.definition) {
        const flds = Object.entries(fieldsOf(start)).filter(([, v]) => !emptyV2(v))
        if (!flds.length || !read.fields_summary_ok) return { kind: 'unanswered', reason: 'record found but it has no definition', read_as: readAs, record: this.brief(start) }
        const text = flds.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.map(fieldText).join(', ') : fieldText(v)}`).join('; ')
        return { kind: 'answer', read_as: readAs, record: this.brief(start), answer: this.brief(start), text: `${start.label || start.key} - ${text}`, from_fields: true, evidence: [] }
      }
      const out: Result = { kind: 'answer', read_as: readAs, record: this.brief(start), answer: this.brief(start), text: start.definition, evidence: [] }
      const goal = fieldsOf(start).goal
      if (start.type === 'mission' && goal && !Array.isArray(goal)) { out.value = goal; out.field = 'goal' }
      return out
    }
    const chain: Result[] = []
    const cited: Result[] = []
    let cur = start.id
    const seen = new Set([cur])
    for (;;) {
      const nxt = this.fwd(cur, rel)
      if (!nxt.length) break
      if (nxt.length > 1) return { kind: 'unanswered', reason: 'more than one successor recorded', read_as: readAs, record: this.brief(start) }
      const to = nxt[0]
      const st = this.statements[`${cur}|${rel}|${to}`]
      if (!st || !ELIGIBLE.includes(st.kind)) return { kind: 'unanswered', reason: 'successor recorded but no supporting passage', read_as: readAs, record: this.brief(start), unconfirmed: this.brief(R.get(to)!) }
      if (st.doc && this.docHashes[st.doc] !== st.doc_sha256) return { kind: 'unanswered', reason: 'source document changed since the check', read_as: readAs, record: this.brief(start) }
      chain.push(this.brief(R.get(to)!))
      cited.push({ kind: st.kind, passage: st.passage, source_url: st.source_url, about: `${cur} -> ${to}` })
      if (seen.has(to)) return { kind: 'unanswered', reason: 'successor chain loops', read_as: readAs, record: this.brief(start) }
      seen.add(to)
      cur = to
    }
    if (!chain.length) return { kind: 'unanswered', reason: 'no successor recorded (this alone does not show the document is current)', read_as: readAs, record: this.brief(start) }
    return { kind: 'answer', read_as: readAs, record: this.brief(start), answer: chain[chain.length - 1], chain, evidence: cited }
  }
}
const ELIGIBLE = ['explicit', 'series', 'ietf-record', 'same-rfc', 'same-document', 'version', 'chain']
function push2(m: Map<string, number[]>, k: string, v: number) { const a = m.get(k); if (a) a.push(v); else m.set(k, [v]) }
/** A field value as text; fields are strings in the model. */
function fieldText(v: any): string { return typeof v === 'string' ? v : String(v) }

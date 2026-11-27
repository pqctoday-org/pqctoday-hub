// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The answer engine's question reader and answer shell, in TypeScript with no dependency outside the language.
 * Logic only: every rule, word list, order, note and label is read from `data.generated.json`, a generated copy of the
 * reader's data files. It turns a question into a reading (cleaned text, names found, intents with scores, filters) and a
 * reading into the answer text, note and source-line label.
 */

export interface Data {
  intents: { groups: Record<string, string>; intents: Record<string, IntentSpec> }
  rules: Rules
  roles: { no_role: string[]; roles: Record<string, { order: string[] }> }
  notes: Notes
  filters: { industries: FilterRow[]; places: FilterRow[] }
  words: { stop: string[]; filler: string[] }
}
export interface IntentSpec { number: number; label: string; order: string[] | 'role'; direct: boolean }
interface FilterRow { cues: string[]; match: string[] }
interface Rule { rx: string; w: number; has_name?: boolean; no_name?: boolean; min_names?: number; named?: string[] }
interface Rules {
  second_ratio: number
  priority: string[]
  strip_prefix: string[]
  broad: { exact: string[]; rx: string[] }
  intents: Record<string, Rule[]>
}
interface Notes {
  answer_text: Record<string, string>
  note: Record<string, string>
  source_line: Record<string, string>
}
/** What the reader needs of the Hub: each normalised name -> the records it names, and each record's type. */
export interface Names {
  aliases: Record<string, { id: string; kind: string }[]>
  types: Record<string, string>
}
export interface Reading {
  question: string
  clean: string
  intent: string
  intents: string[]
  scores: Record<string, number>
  names: { text: string; ids: string[] }[]
  named_ids: string[]
  named_types: string[]
  name_match: string[] | null
  filters: { industries: { cue: string; match: string[] }[]; places: { cue: string; match: string[] }[] }
  confidence: number
}

const MASK = 'zzmaskzz'
const TITLED = new Set(['document', 'standard', 'source', 'vendor', 'product', 'person', 'event', 'patent', 'industrystandard'])
const TYPE_GROUP: Record<string, string[]> = {
  person: ['person'], vendor: ['vendor'], product: ['product'], source: ['source'], document: ['document', 'standard'],
  standard: ['document', 'standard'], guidance: ['guidance'], framework: ['framework', 'guidance'], tool: ['tool'],
  algorithm: ['algorithm'], transition: ['transition'],
}

/** Alias key: case, accents, punctuation and spacing folded away (the same folding the knowledge files use for their alias keys). */
export function normName(text: string): string {
  return text.normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function escapeRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class Engine {
  private stop: Set<string>
  private filler: Set<string>
  private strip: RegExp[]
  private broadRx: RegExp[]
  private rules: Record<string, (Rule & { re: RegExp })[]>
  private data: Data
  private names: Names
  constructor(data: Data, names: Names) {
    this.data = data
    this.names = names
    this.stop = new Set(data.words.stop)
    this.filler = new Set(data.words.filler)
    this.strip = data.rules.strip_prefix.map((p) => new RegExp(p, 'i'))
    this.broadRx = data.rules.broad.rx.map((p) => new RegExp(p, 'i'))
    this.rules = {}
    for (const [k, rows] of Object.entries(data.rules.intents)) this.rules[k] = rows.map((r) => ({ ...r, re: new RegExp(r.rx, 'i') }))
  }

  // ------------------------------------------------------------------ layer 1 and 2
  clean(question: string): string {
    let q = (question ?? '').replace(/\s+/g, ' ').trim()
    q = q.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim()
    q = q.replace(/[?!.…]+$/, '').trim()
    let low = q.toLowerCase()
    let changed = true
    while (changed) {
      changed = false
      for (const rx of this.strip) {
        const m = rx.exec(low)
        if (m && m.index === 0 && m[0].length < low.length) {
          low = low.slice(m[0].length).trim()
          q = q.slice(m[0].length).trim()
          changed = true
        }
      }
    }
    return q
  }

  /** The longest known name in the question (no skipped or masked words). */
  spotNames(question: string, maxLen = 40): { ids: string[]; span: [number, number] | null; toks: string[] } {
    const toks = normName(question).split(' ').filter(Boolean)
    let best: [number, number] | null = null
    for (let i = 0; i < toks.length; i++) {
      for (let j = Math.min(toks.length, i + maxLen); j > i; j--) {
        if (best && j - i <= best[1] - best[0]) break
        const span = toks.slice(i, j).join(' ')
        const entries = this.names.aliases[span]
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
    const hits = this.names.aliases[toks.slice(best[0], best[1]).join(' ')] ?? []
    return { ids: [...new Set(hits.map((h) => h.id))].sort(), span: best, toks }
  }

  allNames(question: string, limit = 4): { text: string; ids: string[] }[] {
    let text = question
    const found: { text: string; ids: string[] }[] = []
    for (let n = 0; n < limit; n++) {
      const { ids, span, toks } = this.spotNames(text)
      if (!ids.length || !span) break
      found.push({ text: toks.slice(span[0], span[1]).join(' '), ids })
      const t = [...toks]
      for (let i = span[0]; i < span[1]; i++) t[i] = MASK
      text = t.join(' ')
    }
    return found
  }

  wholeName(q: string): string[] | null {
    if (q in this.names.types) return [q]
    let r = this.spotNames(q)
    if (r.ids.length && r.span && r.span[0] === 0 && r.span[1] === r.toks.length) return r.ids
    const stripped = q.replace(/^(?:the|a|an)\s+/i, '')
    if (stripped !== q) {
      r = this.spotNames(stripped)
      if (r.ids.length && r.span && r.span[0] === 0 && r.span[1] === r.toks.length) return r.ids
    }
    return null
  }

  filtersOf(low: string): Reading['filters'] {
    const out: Reading['filters'] = { industries: [], places: [] }
    for (const key of ['industries', 'places'] as const) {
      for (const row of this.data.filters[key]) {
        if (row.cues.some((c) => new RegExp('(?<![a-z0-9])' + escapeRx(c) + '(?![a-z0-9])').test(low))) out[key].push({ cue: row.cues[0], match: row.match })
      }
    }
    return out
  }

  read(question: string): Reading {
    const q = this.clean(question)
    const low = q.toLowerCase()
    const reading: Reading = { question, clean: q, intent: 'broad', intents: ['broad'], scores: {}, names: [], named_ids: [], named_types: [], name_match: null, filters: { industries: [], places: [] }, confidence: 0 }
    if (!low) return reading
    const whole = this.wholeName(q)
    const names = this.allNames(q)
    reading.names = names
    reading.named_ids = [...new Set(names.flatMap((n) => n.ids))].sort()
    reading.named_types = [...new Set(reading.named_ids.map((i) => this.names.types[i]))].sort()
    reading.filters = this.filtersOf(low)
    if (whole) return { ...reading, intent: 'name', intents: ['name'], name_match: whole, confidence: 1 }
    if (this.data.rules.broad.exact.includes(low) || this.broadRx.some((rx) => rx.test(low))) return { ...reading, intent: 'broad', intents: ['broad'], confidence: 0.9 }
    const types = new Set(reading.named_types)
    const scores: Record<string, number> = {}
    let shape = low
    for (const n of names) {
      if (n.ids.every((i) => TITLED.has(this.names.types[i]))) shape = shape.replace(new RegExp('(?<![a-z0-9])' + escapeRx(n.text.toLowerCase()) + '(?![a-z0-9])', 'g'), ' zzname ')
    }
    shape = shape.replace(/\s+/g, ' ').trim() // one space between words, so a rule that counts words reads a masked name as one word
    for (const [intent, rows] of Object.entries(this.rules)) {
      for (const r of rows) {
        if (!r.w || !r.re.test(shape)) continue
        if (r.has_name && !names.length) continue
        if (r.no_name && names.length) continue
        if (r.min_names && names.length < r.min_names) continue
        if (r.named && ![...types].some((t) => r.named!.flatMap((g) => TYPE_GROUP[g] ?? [g]).includes(t))) continue
        scores[intent] = (scores[intent] ?? 0) + r.w
      }
    }
    this.typeVotes(low, names, types, scores)
    reading.scores = scores
    if (!Object.keys(scores).length) return names.length ? { ...reading, intent: 'concept', intents: ['concept'], confidence: 0.3 } : { ...reading, intent: 'broad', intents: ['broad'], confidence: 0.1 }
    const order = new Map(this.data.rules.priority.map((k, i) => [k, i]))
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1] || (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99))
    const [top, topScore] = ranked[0]
    const chosen = [top, ...ranked.slice(1, 3).filter(([, v]) => v >= this.data.rules.second_ratio * topScore).map(([k]) => k)]
    return { ...reading, intent: top, intents: chosen, confidence: Math.round(Math.min(1, topScore / 6) * 100) / 100 }
  }

  private typeVotes(low: string, names: { text: string; ids: string[] }[], types: Set<string>, scores: Record<string, number>): void {
    if (!names.length) return
    const define = /^(?:what|who|which) (?:is|are|was|were)\b|^(?:explain|describe|tell me about|about)\b/i.test(low) || low.split(' ').length <= 3
    const toolIds = names.flatMap((n) => n.ids).filter((i) => this.names.types[i] === 'tool')
    const add = (k: string, v: number) => { scores[k] = (scores[k] ?? 0) + v }
    const kindOf = (i: string) => (i.startsWith('PT') || i.startsWith('SB') ? 'playground' : 'business')
    if (toolIds.length && !define) for (const k of new Set(toolIds.map(kindOf))) add(k === 'playground' ? 'technical_tool' : 'business_tool', 2)
    if (define && toolIds.length) {
      const kinds = new Set(toolIds.map(kindOf))
      if (kinds.has('playground')) add('technical_tool', 4)
      if (kinds.has('business')) add('business_tool', 4)
    }
    if (['term', 'algorithm', 'protocol'].some((t) => types.has(t)) && !types.has('tool')) add('concept', define ? 2 : 1)
    if (define && types.has('person')) add('people', 3)
    if (define && types.size && [...types].every((t) => t === 'vendor' || t === 'source')) add('people', 2)
  }

  // ------------------------------------------------------------------ answer shell
  groupOrder(intent: string, role: string | null): string[] {
    let order = this.data.intents.intents[intent].order
    if (order === 'role') order = this.data.roles.roles[role ?? '']?.order ?? this.data.roles.no_role
    return order.map((x) => this.data.intents.groups[x])
  }

  /** The note, answer text and source-line label the contract gives a reading for a reading. */
  shell(reading: Reading, hasDirect: boolean, role: string | null): { answerText: string; note: string; sourceLabel: string | null; order: string[] } {
    const spec = this.data.intents.intents[reading.intent]
    const n = this.data.notes
    let answerText = n.answer_text.default
    let note: string
    let sourceLabel: string | null = null
    if (reading.intent === 'name') {
      answerText = reading.name_match && reading.name_match.length > 1 ? n.answer_text.name_several : n.answer_text.name
      note = n.note.name
    } else if (reading.intent === 'broad') note = n.note.broad
    else if (reading.intent === 'not_fact') note = n.note.not_fact
    else if (hasDirect) { note = n.note.direct.replace('{label}', spec.label); sourceLabel = n.source_line.direct }
    else { note = n.note.no_direct.replace('{label}', spec.label); sourceLabel = n.source_line.no_direct }
    return { answerText, note, sourceLabel, order: this.groupOrder(reading.intent, role) }
  }
}

// SPDX-License-Identifier: AGPL-3.0-only
import { normName } from '@/services/knowledge/knowledgeReader'
import type { KnowledgeCore, KnowledgeRecord } from '@/services/knowledge/knowledgeTypes'
import type { KnowledgeTextEntry, KnowledgeTextFile } from '@/services/knowledge/knowledgeText'
import { decodeCodes, type Catalogue, type Passage, type Resource } from './engine/answerer'
import type { Model, Rec } from './engine/strict'

/**
 * Builds what the answer engine reads from the Hub's two knowledge files: the records, names and links the strict reader
 * runs on (`Model`), and the resources, passages, dimensions and curriculum the finders run on (`Catalogue`).
 * Pure: no fetch, no state. The engine itself is the unchanged TypeScript engine; this file is the only place that knows
 * the shape of the knowledge files.
 *
 * The knowledge text keeps the character codes of the pages it was read from ("&quot;", "&mdash;"). They are decoded here,
 * in every title, extract and passage the learner may be shown, and nowhere else.
 */

const ACTIVE = (r: KnowledgeRecord) => (r.status ?? 'active') === 'active' && r.active !== false
const TOOL_PATHS = ['/playground', '/business', '/assess', '/report', '/openssl', '/simulation']
const HEADER =
  /^(?:Module|Component|Term|Reference|Title|Learning Module|Document|Section|Category):\s*/i
/** A passage keeps this many characters of a record's text, as the search index always has. */
const PASSAGE_CHARS = 8000
/** A lesson's text is cut into passages of this many characters. */
const LESSON_PIECE = 3000
/** The kinds of text a record keeps, in order, and the name each passage carries (`null`: the record's own kind). */
const TEXT_KINDS: [keyof KnowledgeTextEntry, string | null][] = [
  ['full', null],
  ['summary', 'module-summaries'],
  ['topic', 'module-topic-summaries'],
  ['curious', 'module-curious'],
  ['analysis', 'document-enrichment'],
  ['release_notes', 'changelog'],
  ['manual', 'user-manual'],
]

/**
 * The newest dated data file of each family names its revision in the evidence line ("Data file compliance_11182026_r3").
 * Family of the record -> the file name prefix in `src/data/`. A test checks every prefix against the file's own inputs.
 */
export const FAMILY_FILE_PREFIX: Record<string, string> = {
  library: 'library',
  compliance: 'compliance',
  timeline: 'timeline',
  product: 'pqc_product_catalog',
  algorithm: 'pqc_complete_algorithm_reference',
  country: 'jurisdictions',
  usecase: 'industry_landscape',
  vendor: 'vendors',
  cert: 'migrate_certification_xref',
  leader: 'leaders',
  threat: 'quantum_threats_hsm_industries',
  lesson: 'playground_content',
  assessment: 'pqcassessment',
  patent: 'patents',
  source: 'trusted_sources',
  standard_row: 'industry_standards',
  mission: 'sim_missions',
  sector: 'sector_vocabulary',
  algorithms_transitions: 'algorithms_transitions',
  business_tools_content: 'business_tools_content',
  pqc_implementation_attacks: 'pqc_implementation_attacks',
  pqc_maturity_governance_requirements: 'pqc_maturity_governance_requirements',
  role_board_variants: 'role_board_variants',
}

/**
 * Which record names an address that several records share: lower comes first. A page is what its address opens, then a
 * lesson; a known-answer test comes last. Every other kind keeps the order of the file.
 */
const ADDRESS_OWNER_RANK: Record<string, number> = { page: 0, module: 1, kat: 3 }
const ADDRESS_OWNER_DEFAULT = 2

/** Families whose records of one label may be the same thing under two ids (their one value is then not a clash). */
const SAME_LABEL_SAME_THING = ['standard_row']

/** Which of the four groups a link belongs to. */
export function groupOf(link: string, type = ''): string {
  const path = link.split('?')[0]
  if (link.startsWith('/learn?glossary=') || type === 'term') return 'References'
  if (path.startsWith('/learn')) return 'Learn'
  if (TOOL_PATHS.some((p) => path.startsWith(p))) return 'Tools'
  if (path.startsWith('/library') || link.startsWith('http')) return 'References'
  return 'Data pages'
}

/** The Hub's own words of a record, one line, at most `limit` characters, cut at a word. */
export function extractOf(text: string, limit = 240): string {
  const lines = decodeCodes(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const body = lines.filter((l) => !HEADER.test(l))
  const out = (body.length ? body : lines.map((l) => l.replace(HEADER, '')))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (out.length <= limit) return out
  const cut = out.slice(0, limit)
  const i = cut.lastIndexOf(' ')
  return (i >= 0 ? cut.slice(0, i) : cut) + '…'
}

const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

/** The natural key of a record: the part of its tag after the kind, in the label's own spelling when they agree. */
function keyOf(r: KnowledgeRecord): string {
  if (r.type === 'module') return r.link.replace(/^\/learn\//, '').split(/[?#]/)[0]
  const tail = r.id.includes(':') ? r.id.slice(r.id.indexOf(':') + 1) : r.id
  return normKey(tail) === normKey(r.label) ? r.label : tail
}

const asList = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]

/**
 * The record's definition: the core file keeps a short extract; the text file keeps the whole lead text, then one
 * "Label: value" line per field. The definition is the lead text without the field lines. When the extract is whole
 * (it does not end with an ellipsis) it is the definition.
 */
function definitionOf(r: KnowledgeRecord, full: string | undefined): string {
  const extract = r.extract ?? ''
  if (!extract.endsWith('…') || !full) return extract
  const lead = extract.slice(0, -1).trimEnd()
  if (!full.startsWith(lead.slice(0, Math.min(lead.length, 60)))) return extract
  const kept: string[] = []
  for (const line of full.split(/\r?\n/)) {
    if (kept.length && /^[A-Z][A-Za-z0-9 /&()'-]{0,40}: /.test(line)) break
    kept.push(line)
  }
  const whole = kept.join('\n').trim()
  return whole.length >= lead.length ? whole : extract
}

export interface BuiltEngineInput {
  model: Model
  catalogue: Catalogue
  /** The checked passages that say one document replaces another, as the strict reader reads them. */
  statements: Record<string, unknown>
}

/** Everything the engine reads, from the core file and the text file. */
export function buildEngineInput(core: KnowledgeCore, text: KnowledgeTextFile): BuiltEngineInput {
  const entries = text.entries ?? {}
  const byId = new Map<string, KnowledgeRecord>()
  for (const r of core.records) byId.set(r.id, r)

  // ---------------------------------------------------------------- the strict reader's model
  const fieldsByFamily = new Map<string, Set<string>>()
  const records: Rec[] = core.records.map((r) => {
    const fields = r.fields ?? {}
    const known = fieldsByFamily.get(r.family) ?? new Set<string>()
    for (const k of Object.keys(fields)) known.add(k)
    fieldsByFamily.set(r.family, known)
    return {
      id: r.id,
      type: r.type,
      family: r.family,
      key: keyOf(r),
      label: decodeCodes(r.label),
      definition: definitionOf(r, entries[r.id]?.full),
      status: r.status,
      active: ACTIVE(r),
      last_verified: r.verified ?? '',
      link: r.link,
      fields,
    }
  })
  const aliases: Model['aliases'] = {}
  for (const [name, list] of Object.entries(core.aliases)) {
    aliases[name] = list.map(([id, kind]) => ({ id, kind }))
  }
  // A glossary term and an algorithm family can share one name ("ML-KEM"). The core file's name table maps that name to the
  // family only, so a question that names it would never meet the term, which is the best first answer to "What is ML-KEM?".
  // A term is always named by its own label.
  for (const r of core.records) {
    if (r.type !== 'term') continue
    const key = normName(r.label)
    if (!key) continue
    const list = (aliases[key] ??= [])
    if (!list.some((e) => e.id === r.id)) list.push({ id: r.id, kind: 'label' })
  }
  const model: Model = {
    records,
    aliases,
    links: core.links.map(([from, rel, to, basis]) => ({ from, rel, to, basis })),
    qa: [],
    meta: {
      fields_by_family: Object.fromEntries([...fieldsByFamily].map(([f, s]) => [f, [...s].sort()])),
      same_label_same_thing: SAME_LABEL_SAME_THING,
    },
  }

  // ---------------------------------------------------------------- resources: one per address
  // An address several records share is one resource, named by the record the address opens: the page, else the lesson,
  // else the first record of the file. A known-answer test shares its lesson's address and never names it, whatever
  // the order of the file ("/learn/tls-basics" is the lesson TLS Basics, not the first test that runs in it).
  const resources = new Map<string, Resource>()
  const rankOf = (r: KnowledgeRecord) => ADDRESS_OWNER_RANK[r.type] ?? ADDRESS_OWNER_DEFAULT
  const owner = new Map<string, KnowledgeRecord>()
  for (const r of core.records) {
    if (!r.link || !ACTIVE(r)) continue
    const cur = owner.get(r.link)
    if (!cur || rankOf(r) < rankOf(cur)) owner.set(r.link, r)
  }
  const sharing = new Map<string, KnowledgeRecord[]>()
  for (const r of core.records) {
    if (!r.link || !ACTIVE(r)) continue
    const list = sharing.get(r.link)
    if (!list) sharing.set(r.link, r === owner.get(r.link) ? [r] : [owner.get(r.link)!, r])
    else if (r !== owner.get(r.link)) list.push(r)
  }
  for (const r of [...sharing.values()].flat()) {
    const cur = resources.get(r.link)
    const extract = extractOf(definitionOf(r, entries[r.id]?.full))
    if (!cur) {
      resources.set(r.link, {
        link: r.link,
        title: decodeCodes(r.label),
        type: r.type,
        group: groupOf(r.link, r.type),
        extract,
        record_ids: [r.id],
        passages: [],
      })
    } else {
      cur.record_ids.push(r.id)
      if (!cur.extract) cur.extract = extract
    }
  }

  // ---------------------------------------------------------------- passages: each active record's own text
  const passages: Passage[] = []
  const addPassage = (r: KnowledgeRecord, rawTitle: string, rawContent: string, source: string) => {
    const title = decodeCodes(rawTitle)
    const content = decodeCodes(rawContent)
    let res = resources.get(r.link)
    if (!res) {
      res = {
        link: r.link,
        title: decodeCodes(r.label),
        type: r.kind,
        group: groupOf(r.link),
        extract: '',
        record_ids: [],
        passages: [],
      }
      resources.set(r.link, res)
    }
    res.passages.push(passages.length)
    if (!res.extract) res.extract = extractOf(content)
    passages.push({ link: r.link, title, text: content, source })
  }
  for (const [id, entry] of Object.entries(entries)) {
    const r = byId.get(id)
    if (!r || !r.link || !ACTIVE(r)) continue
    // one passage per kind of text, named by what it is, so the finder weighs each kind as it should
    for (const [key, source] of TEXT_KINDS) {
      const text = key === 'full' ? entry.full : (entry[key] as string | undefined)
      if (text)
        addPassage(
          r,
          r.label,
          String(text).slice(0, PASSAGE_CHARS),
          source ?? (r.type === 'module' ? 'modules' : r.kind)
        )
    }
    if (entry.passages?.length)
      addPassage(r, r.label, entry.passages.join('\n').slice(0, PASSAGE_CHARS), 'library')
    // a lesson's own text, a file at a time, in pieces the size of a search passage
    for (const [, text] of entry.lesson ?? []) {
      for (let i = 0; i < text.length; i += LESSON_PIECE)
        addPassage(r, r.label, text.slice(i, i + LESSON_PIECE), 'module-content')
    }
    const q = entry.quiz
    if (q)
      addPassage(
        r,
        r.label,
        [q.question, ...Object.values(q.options), q.explanation ?? ''].join('\n'),
        'quiz'
      )
    for (const qa of entry.qa ?? [])
      addPassage(r, qa.question, `${qa.question}\n${qa.answer}`, 'module-qa')
  }

  // ---------------------------------------------------------------- dimensions, curriculum, file revisions
  const dims: Catalogue['dims'] = {}
  for (const r of core.records) {
    const industry = asList(r.d?.ind).sort()
    const place = asList(r.d?.geo).sort()
    if (industry.length || place.length) dims[r.id] = { industry, place }
  }
  // the learning journey: only the lessons the core's curriculum names, each with its stage (the stage record it belongs
  // to), its track, how general it is and the topics it explains
  const stages: Record<string, string> = {}
  for (const r of core.records) {
    if (r.id.startsWith('STG:')) stages[r.id.slice(4)] = r.label
  }
  const modules: Record<string, Record<string, unknown>> = {}
  for (const [tag, extra] of Object.entries(core.curriculum ?? {})) {
    const r = byId.get(tag)
    if (!r || !r.link.startsWith('/learn/') || !(r.parent ?? '').startsWith('STG:')) continue
    const track = byId.get(r.facets?.track ?? '')?.label ?? ''
    modules[r.link.slice('/learn/'.length)] = { stage: Number(r.parent?.slice(4)), track, ...extra }
  }
  // each role path record: the lessons of the path, and those under "more for this role"
  const rolePaths: Record<string, { first: string[]; rest: string[] }> = {}
  for (const r of core.records) {
    if (r.kind === 'role path' && r.parts?.length)
      rolePaths[r.id.slice(r.id.indexOf(':') + 1)] = {
        first: [...r.parts],
        rest: [...(r.more ?? [])],
      }
  }

  const catalogue: Catalogue = {
    resources: [...resources.values()],
    passages,
    curriculum: { modules, stages },
    paid: core.records.filter((r) => r.paid).map((r) => r.id),
    rolePaths,
    dims,
    inputs: core.meta.inputs.map((i) => i[0]),
    filePrefix: FAMILY_FILE_PREFIX,
  }
  return { model, catalogue, statements: core.successors ?? {} }
}

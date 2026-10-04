// SPDX-License-Identifier: GPL-3.0-only
/**
 * openClaimsData — the claims the site shows as settled, broken, open or superseded.
 *
 * Loads the newest `src/data/open_claims_<MMDDYYYY>.json`. The file holds only claims the
 * owner approved, in plain words: who said it, what state it is in and why, and each source
 * with its link and the exact words quoted. A newer statement may replace, update or add to an
 * older one; the file keeps the older ones and links them, and a newer statement can carry the
 * points on which it differs.
 *
 * The loader is strict on purpose: a file that fails any check below is refused as a whole, so
 * a half-valid file can never reach a page. It also refuses any field that belongs to how a
 * claim was produced rather than to what is claimed.
 */
import { sortCSVFiles } from './csvUtils'

export type ClaimState = 'Settled' | 'Broken' | 'Open' | 'Superseded'
export type ClaimRelation = 'replaces' | 'updates' | 'adds-to'

/**
 * What a claim is about and where it shows. `estimates`: it is the basis of one entry in the
 * CRQC estimates list; `estimate-update`: a newer statement that updates such an entry (reached from
 * it through `newerStatements`); `open-questions`: it belongs in the short list of open questions.
 * The rest say what the claim is about.
 */
export type ClaimTopic =
  | 'estimates'
  | 'estimate-update'
  | 'open-questions'
  | 'arrival-forecast'
  | 'migration-deadline'
  | 'planning-guidance'
  | 'hardware-requirements'

export const CLAIM_TOPICS: readonly ClaimTopic[] = [
  'estimates',
  'estimate-update',
  'open-questions',
  'arrival-forecast',
  'migration-deadline',
  'planning-guidance',
  'hardware-requirements',
]

export interface ClaimSource {
  name: string
  url: string
  /** What this source states, in a few words. */
  states: string
  /** The exact words of the source. */
  quote: string
}

export interface ClaimChange {
  /** The point on which the newer statement differs from the older one. */
  point: string
  before: { text: string; quote: string }
  after: { text: string; quote: string }
}

/** On a newer claim: how it relates to an older one, and what changed. */
export interface ClaimEarlier {
  claim: string
  relation: ClaimRelation
  detail: string
  madeBy: string
  url: string | null
  changes?: ClaimChange[]
}

/** On an older claim: a newer statement that relates to it. */
export interface ClaimNewer {
  claim: string
  relation: ClaimRelation
}

export interface OpenClaim {
  id: string
  claim: string
  madeBy: string
  state: ClaimState
  reason: string
  lastChecked: string | null
  sources: ClaimSource[]
  /** Open claim for which credible sources give answers that cannot both be right. */
  inConflict?: boolean
  /** Set when this site, not a source, derived the figure. */
  derivedBy?: 'this site'
  supersededBy?: string
  /** Tags saying what the claim is about and where it shows; see `ClaimTopic`. */
  topics?: ClaimTopic[]
  newerStatements?: ClaimNewer[]
  earlier?: ClaimEarlier[]
}

export const CLAIM_STATES: readonly ClaimState[] = ['Settled', 'Broken', 'Open', 'Superseded']
const RELATIONS: readonly ClaimRelation[] = ['replaces', 'updates', 'adds-to']
const SCHEMA_VERSION = 1

/** A Settled, Broken or Superseded claim must show where the proof is. */
const NEEDS_SOURCE: readonly ClaimState[] = ['Settled', 'Broken', 'Superseded']

/** Fields that describe how a claim was produced; they must never appear in the public file. */
const PRIVATE_KEYS = [
  'status',
  'decision',
  'draftedBy',
  'evidenceFile',
  'evidenceSha256',
  'evidencePath',
  'retrieved',
  'basis',
  'note',
  'relatesTo',
]

export class OpenClaimsFileError extends Error {}

function fail(message: string): never {
  throw new OpenClaimsFileError(`open claims: ${message}`)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function text(o: Record<string, unknown>, key: string, where: string): string {
  // eslint-disable-next-line security/detect-object-injection -- key is one of this file's own field names
  const v = o[key]
  if (typeof v !== 'string' || !v.trim()) fail(`${where} has no ${key}`)
  return v
}

function refuseKeys(o: Record<string, unknown>, where: string): void {
  for (const key of PRIVATE_KEYS) {
    if (key in o) fail(`${where} carries "${key}", which does not belong in the public file`)
  }
}

function https(url: string, where: string): string {
  if (!/^https:\/\//i.test(url)) fail(`${where} has a link that is not https`)
  return url
}

function parseChanges(raw: unknown, where: string): ClaimChange[] {
  if (!Array.isArray(raw)) fail(`${where} changes is not a list`)
  return raw.map((c, i) => {
    if (!isRecord(c)) fail(`${where} change ${i} is not an object`)
    const side = (name: 'before' | 'after') => {
      // eslint-disable-next-line security/detect-object-injection -- name is 'before' or 'after'
      const s = c[name]
      if (!isRecord(s)) fail(`${where} change ${i} has no ${name}`)
      return {
        text: text(s, 'text', `${where} change ${i} ${name}`),
        quote: text(s, 'quote', `${where} change ${i} ${name}`),
      }
    }
    return {
      point: text(c, 'point', `${where} change ${i}`),
      before: side('before'),
      after: side('after'),
    }
  })
}

function relation(o: Record<string, unknown>, where: string): ClaimRelation {
  const r = o.relation
  if (typeof r !== 'string' || !RELATIONS.includes(r as ClaimRelation))
    fail(`${where} has an unknown relation`)
  return r as ClaimRelation
}

/** Validates the parsed file and returns its claims; throws OpenClaimsFileError on any problem. */
export function parseOpenClaims(raw: unknown): OpenClaim[] {
  if (!isRecord(raw)) fail('the file is not an object')
  if (raw.version !== SCHEMA_VERSION) fail(`version ${String(raw.version)} is not supported`)
  if (!Array.isArray(raw.claims)) fail('the file has no list of claims')

  const claims = raw.claims.map((c, i): OpenClaim => {
    if (!isRecord(c)) fail(`claim ${i} is not an object`)
    const id = text(c, 'id', `claim ${i}`)
    const where = `claim ${id}`
    refuseKeys(c, where)
    const state = c.state
    if (typeof state !== 'string' || !CLAIM_STATES.includes(state as ClaimState))
      fail(`${where} has an unknown state`)
    const sourcesRaw = c.sources
    if (!Array.isArray(sourcesRaw)) fail(`${where} has no list of sources`)
    const sources = sourcesRaw.map((s, j): ClaimSource => {
      if (!isRecord(s)) fail(`${where} source ${j} is not an object`)
      refuseKeys(s, `${where} source ${j}`)
      return {
        name: text(s, 'name', `${where} source ${j}`),
        url: https(text(s, 'url', `${where} source ${j}`), `${where} source ${j}`),
        states: text(s, 'states', `${where} source ${j}`),
        quote: text(s, 'quote', `${where} source ${j}`),
      }
    })
    if (NEEDS_SOURCE.includes(state as ClaimState) && sources.length === 0) {
      fail(`${where} is ${state} and needs at least one source`)
    }
    const lastChecked = c.lastChecked
    if (
      lastChecked !== null &&
      lastChecked !== undefined &&
      (typeof lastChecked !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(lastChecked))
    ) {
      fail(`${where} has a lastChecked that is not a date`)
    }
    const out: OpenClaim = {
      id,
      claim: text(c, 'claim', where),
      madeBy: text(c, 'madeBy', where),
      state: state as ClaimState,
      reason: text(c, 'reason', where),
      lastChecked: (lastChecked as string | null | undefined) ?? null,
      sources,
    }
    if (c.inConflict === true) out.inConflict = true
    if (c.derivedBy === 'this site') out.derivedBy = 'this site'
    if (typeof c.supersededBy === 'string') out.supersededBy = c.supersededBy
    if (c.topics !== undefined) {
      if (!Array.isArray(c.topics) || c.topics.length === 0)
        fail(`${where} has a topics field that is not a list of tags`)
      out.topics = c.topics.map((t) => {
        if (typeof t !== 'string' || !CLAIM_TOPICS.includes(t as ClaimTopic))
          fail(`${where} has an unknown topic`)
        return t as ClaimTopic
      })
    }
    if (Array.isArray(c.newerStatements)) {
      out.newerStatements = c.newerStatements.map((n, j) => {
        if (!isRecord(n)) fail(`${where} newer statement ${j} is not an object`)
        return {
          claim: text(n, 'claim', `${where} newer statement ${j}`),
          relation: relation(n, `${where} newer statement ${j}`),
        }
      })
    }
    if (Array.isArray(c.earlier)) {
      out.earlier = c.earlier.map((e, j): ClaimEarlier => {
        if (!isRecord(e)) fail(`${where} earlier statement ${j} is not an object`)
        const w = `${where} earlier statement ${j}`
        const url = e.url === null || e.url === undefined ? null : https(text(e, 'url', w), w)
        const link: ClaimEarlier = {
          claim: text(e, 'claim', w),
          relation: relation(e, w),
          detail: text(e, 'detail', w),
          madeBy: text(e, 'madeBy', w),
          url,
        }
        if (e.changes !== undefined) link.changes = parseChanges(e.changes, w)
        return link
      })
    }
    return out
  })

  const ids = new Set<string>()
  for (const c of claims) {
    if (ids.has(c.id)) fail(`id ${c.id} appears twice`)
    ids.add(c.id)
  }
  for (const c of claims) {
    const refs = [
      ...(c.supersededBy ? [c.supersededBy] : []),
      ...(c.newerStatements ?? []).map((n) => n.claim),
      ...(c.earlier ?? []).map((e) => e.claim),
    ]
    for (const ref of refs)
      if (!ids.has(ref)) fail(`claim ${c.id} points to ${ref}, which is not in the file`)
    if (c.state === 'Superseded' && !c.supersededBy)
      fail(`claim ${c.id} is Superseded but names no newer claim`)
  }
  return claims
}

const modules = import.meta.glob('./open_claims_*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function loadLatest(): OpenClaim[] {
  // eslint-disable-next-line security/detect-unsafe-regex -- fixed-width date groups, same pattern as the CSV loaders
  const files = sortCSVFiles(modules, /open_claims_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.json$/)
  if (files.length === 0) return []
  return parseOpenClaims(JSON.parse(files[0].content as string))
}

export const OPEN_CLAIMS: OpenClaim[] = loadLatest()
const BY_ID = new Map(OPEN_CLAIMS.map((c) => [c.id, c]))

export function getOpenClaim(id: string): OpenClaim | undefined {
  return BY_ID.get(id)
}

export function getOpenClaims(ids: readonly string[]): OpenClaim[] {
  return ids.map((id) => BY_ID.get(id)).filter((c): c is OpenClaim => c !== undefined)
}

/** The claims carrying a topic tag, in file order. */
export function claimsWithTopic(topic: ClaimTopic): OpenClaim[] {
  return OPEN_CLAIMS.filter((c) => c.topics?.includes(topic))
}

/** The claims that are still open questions. */
export function openQuestions(): OpenClaim[] {
  return OPEN_CLAIMS.filter((c) => c.state === 'Open')
}

/** The newest claim in a chain of replacements: follows `supersededBy` until there is none. */
export function latestInChain(id: string): OpenClaim | undefined {
  let current = BY_ID.get(id)
  const seen = new Set<string>()
  while (current?.supersededBy && !seen.has(current.id)) {
    seen.add(current.id)
    const next = BY_ID.get(current.supersededBy)
    if (!next) break
    current = next
  }
  return current
}

export const CLAIM_STATE_LABELS: Record<ClaimState, string> = {
  Settled: 'Settled',
  Broken: 'Did not hold',
  Open: 'Open question',
  Superseded: 'Replaced by a newer statement',
}

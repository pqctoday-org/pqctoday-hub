/**
 * The one rule for whether a citation of a library reference_id may stand: a citation of a RETIRED id (status deprecated or obsolete) is
 * accepted ONLY when its superseded_by chain ends at an ACTIVE row. A blank successor, a
 * broken chain, a cycle (self included), a chain ending at a retired or non-active row, and
 * an unknown id all fail. A chain may end at an active Internet-Draft, whatever its lifecycle_state.
 *
 * Pure: it takes the rows, so the rule is tested without a CSV. libraryData.ts builds the
 * rows from the newest library CSV and exposes the resolution to the checks.
 */

export interface CitationRow {
  referenceId: string
  /** Lower-cased CSV status. Blank counts as active, as every other check in this repo does. */
  status: string
  /** The raw superseded_by cell; only its first ';'-separated id is followed. */
  supersededBy?: string
}

export type CitationVerdict =
  | { ok: true; activeId: string; chain: readonly string[] }
  | { ok: false; reason: string; chain: readonly string[] }

const RETIRED: ReadonlySet<string> = new Set(['deprecated', 'obsolete'])
export const CITATION_MAX_HOPS = 8

/** reference_id -> row, first row wins on a duplicate id. */
export type CitationIndex = ReadonlyMap<string, CitationRow>

const statusOf = (row: CitationRow): string => (row.status || 'active').trim().toLowerCase()

const successorOf = (row: CitationRow): string => (row.supersededBy ?? '').split(';')[0].trim()

/** Builds a CitationIndex from plain rows (CSV columns already mapped). Blank ids are dropped. */
export function citationIndexFromRows(rows: readonly CitationRow[]): CitationIndex {
  const index = new Map<string, CitationRow>()
  for (const row of rows) {
    const id = row.referenceId.trim()
    if (id && !index.has(id)) index.set(id, { ...row, referenceId: id })
  }
  return index
}

const refused = (chain: string[], reason: string): CitationVerdict => ({
  ok: false,
  reason,
  chain,
})

/** Applies the citation rule to one cited reference_id. */
export function resolveCitation(ref: string, index: CitationIndex): CitationVerdict {
  const id = ref.trim()
  if (!id) return refused([], 'blank reference_id')
  const row = index.get(id)
  if (!row) return refused([id], `'${id}' is not a library reference_id`)
  const status = statusOf(row)
  if (status === 'active') return { ok: true, activeId: id, chain: [id] }
  if (!RETIRED.has(status)) {
    return refused([id], `'${id}' has status '${status}': neither an active nor a retired row`)
  }
  const chain: string[] = [id]
  let current = row
  for (let hop = 0; hop < CITATION_MAX_HOPS; hop++) {
    const next = successorOf(current)
    if (!next) {
      return refused(
        chain,
        `retired row '${chain[chain.length - 1]}' has no superseded_by successor`
      )
    }
    if (chain.includes(next)) {
      return refused([...chain, next], `superseded_by cycle: ${[...chain, next].join(' -> ')}`)
    }
    chain.push(next)
    const nextRow = index.get(next)
    if (!nextRow) {
      return refused(chain, `superseded_by chain breaks: '${next}' is not a library reference_id`)
    }
    const nextStatus = statusOf(nextRow)
    if (nextStatus === 'active') return { ok: true, activeId: next, chain }
    if (!RETIRED.has(nextStatus)) {
      return refused(
        chain,
        `chain ends at '${next}' with status '${nextStatus}', not an active row`
      )
    }
    current = nextRow
  }
  return refused(
    chain,
    `superseded_by chain longer than ${CITATION_MAX_HOPS} hops: ${chain.join(' -> ')}`
  )
}

/** Every reference_id a citation may name: the active rows, plus the retired rows whose chain
 * ends at an active row. */
export function citableReferenceIds(index: CitationIndex): Set<string> {
  const out = new Set<string>()
  for (const id of index.keys()) if (resolveCitation(id, index).ok) out.add(id)
  return out
}

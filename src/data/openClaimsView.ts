// SPDX-License-Identifier: GPL-3.0-only
/**
 * How a page picks which statement of a claim to show. A page that points at a claim id gets
 * the LATEST statement: a newer statement that replaces or updates the claim is shown first,
 * and the older one stays one link away (the newer claim's `earlier`). A statement that only
 * adds to an older one is its own claim and does not hide it. Nothing is ever deleted.
 */
import { getOpenClaim, type ClaimRelation, type OpenClaim } from './openClaimsData'

/** Relations under which the newer statement is the one to show first. */
const SUCCEEDS: readonly ClaimRelation[] = ['replaces', 'updates']

/** The newest statement that replaces or updates `id`, or the claim itself when none does. */
export function headStatement(
  id: string,
  lookup: (id: string) => OpenClaim | undefined = getOpenClaim
): OpenClaim | undefined {
  let current = lookup(id)
  const seen = new Set<string>()
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    const next = current.newerStatements?.find((n) => SUCCEEDS.includes(n.relation))
    const newer = next ? lookup(next.claim) : undefined
    if (!newer) break
    current = newer
  }
  return current
}

/** The statements to show for a list of claim ids: latest of each, each once, in the order asked. */
export function headStatements(
  ids: readonly string[],
  lookup: (id: string) => OpenClaim | undefined = getOpenClaim
): OpenClaim[] {
  const out: OpenClaim[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    const head = headStatement(id, lookup)
    if (head && !seen.has(head.id)) {
      seen.add(head.id)
      out.push(head)
    }
  }
  return out
}

const RELATION_LABELS: Record<ClaimRelation, string> = {
  replaces: 'Replaces an earlier statement',
  updates: 'Updates an earlier statement',
  'adds-to': 'Adds to an earlier statement',
}

export function relationLabel(relation: ClaimRelation): string {
  return RELATION_LABELS[relation]
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "2026-10-03" → "3 October 2026" (no time zone involved), or null for no date. */
export function formatClaimDate(iso: string | null): string | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null

  const month = MONTHS[Number(m[2]) - 1]
  return month ? `${Number(m[3])} ${month} ${m[1]}` : null
}

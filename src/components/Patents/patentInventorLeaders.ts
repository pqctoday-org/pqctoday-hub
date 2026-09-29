// SPDX-License-Identifier: GPL-3.0-only
/**
 * Community leaders behind a patent's inventors, for PatentDetail's
 * `/leaders?leader=<name>` links.
 *
 * `patents.inventors` is raw USPTO format — "Surname; Givenname et al.", the
 * first-named inventor only (see usePatentResults' inventorMatches). A leader
 * matches when:
 *  1. their `PatentRefs` list this patent (authoritative — also finds
 *     co-inventors hidden behind "et al."), or
 *  2. the first-named inventor, re-ordered to "Givenname Surname", resolves via
 *     the Community page's own tolerant `?leader=` matcher (findLeaderByName).
 */
import { leadersData, type Leader } from '@/data/leadersData'
import { normalizePatentNumber } from '@/data/patentsScope'
import { findLeaderByName } from '@/components/Leaders/leaderDeepLink'
import type { PatentItem } from '@/types/PatentTypes'

export interface InventorLeaders {
  /** The first-named inventor text as displayed, without the "et al." tail. */
  firstInventor: string
  /** The "et al." tail (with its leading space), or ''. */
  suffix: string
  /** Leader matching the first-named inventor, if any. */
  primary: Leader | null
  /** Other leaders whose PatentRefs name this patent (co-inventors). */
  others: Leader[]
}

const words = (s: string): string[] =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

/** "KALISKI, JR.; Burton S. et al." → { surname: "KALISKI", given: "Burton S." }. */
function parseInventor(raw: string): { surname: string; given: string } {
  const [surnamePart = '', given = ''] = raw.split(';').map((s) => s.trim())
  const surname = surnamePart.replace(/,\s*(jr|sr|ii|iii|iv)\.?$/i, '').trim()
  return { surname, given }
}

export function inventorLeadersFor(
  patent: Pick<PatentItem, 'patentNumber' | 'inventors'>,
  leaders: readonly Leader[] = leadersData
): InventorLeaders {
  const raw = patent.inventors ?? ''
  const tail = /\s+et\s+al\.?\s*$/i.exec(raw)
  const firstInventor = tail ? raw.slice(0, tail.index) : raw
  const suffix = tail ? tail[0] : ''

  const id = normalizePatentNumber(patent.patentNumber)
  const byRef = leaders.filter((l) =>
    (l.patentRefs ?? []).some((ref) => normalizePatentNumber(ref) === id)
  )

  const { surname, given } = parseInventor(firstInventor)
  const surnameWords = words(surname)
  let primary: Leader | null = null
  if (surnameWords.length > 0) {
    primary =
      byRef.find((l) => {
        const nameWords = new Set(words(l.name))
        return surnameWords.every((w) => nameWords.has(w))
      }) ??
      (given ? findLeaderByName(leaders, `${given} ${surname}`) : undefined) ??
      null
  }
  return {
    firstInventor,
    suffix,
    primary,
    others: byRef.filter((l) => l !== primary),
  }
}

// SPDX-License-Identifier: GPL-3.0-only
/**
 * Patents, framed for the reader — B+ remediation 4.1 (2026-08-10).
 *
 * The page was "raw intellectual-property data with no framing for anybody".
 * The review's headline ask was an executive licensing-risk summary: "the one
 * question an executive has about patents — can I be sued for using this".
 *
 * That question is answered HONESTLY here rather than confidently. The catalog
 * records assignees, algorithms and claims; it records nothing about licensing
 * terms, FRAND commitments, or whether a holder has ever asserted a patent. A
 * component that implied "you are safe" or "you are exposed" from the data we
 * have would be inventing the most consequential claim on the site. So the
 * summary reports exactly what is knowable — how much of the patent landscape
 * touches the standards you are actually migrating to, and who holds it — and
 * says plainly that it is a list of people to ask, not a legal opinion.
 *
 * The second half is the review's "flag only patents touching algorithms the
 * reader's own path teaches": the relevant-algorithm set comes from
 * `ALGORITHM_PERSONA_DEFAULTS[persona].highlight`, the same config that decides
 * what /algorithms pre-highlights, so the two pages agree by construction.
 */
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Scale, ArrowRight } from 'lucide-react'
import type { PatentItem } from '@/types/PatentTypes'
import { ALGORITHM_PERSONA_DEFAULTS } from '@/data/personaConfig'
import type { PersonaId } from '@/data/learningPersonas'

/** The NIST-standardised algorithms every role's migration actually depends on.
 *  Used as the fallback when a persona has no `highlight` set of its own. */
const STANDARDISED = ['ML-KEM', 'ML-DSA', 'SLH-DSA']

/**
 * Algorithm names this persona's own learning path teaches, normalised to
 * family prefixes so 'ML-KEM-768' in the persona config matches 'ML-KEM' in a
 * patent's algorithm list.
 */
export function relevantAlgorithmFamilies(persona: PersonaId | null): string[] {
  const highlight = persona ? ALGORITHM_PERSONA_DEFAULTS[persona].highlight : undefined
  const source = highlight?.length ? highlight : STANDARDISED
  return Array.from(new Set(source.map((name) => name.split('-').slice(0, 2).join('-'))))
}

/** True when any of the patent's PQC algorithms is in the persona's own set. */
export function patentTouchesPersonaAlgorithms(patent: PatentItem, families: string[]): boolean {
  return (patent.pqcAlgorithms ?? []).some((algo: string) =>
    families.some((family) => algo.toUpperCase().includes(family.toUpperCase()))
  )
}

export function PatentsRoleLens({
  patents,
  persona,
}: {
  patents: PatentItem[]
  persona: PersonaId | null
}) {
  const families = useMemo(() => relevantAlgorithmFamilies(persona), [persona])

  const summary = useMemo(() => {
    const relevant = patents.filter((p) => patentTouchesPersonaAlgorithms(p, families))
    const byAssignee = new Map<string, number>()
    for (const p of relevant) {
      if (!p.assignee) continue
      byAssignee.set(p.assignee, (byAssignee.get(p.assignee) ?? 0) + 1)
    }
    const topHolders = [...byAssignee.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    return { relevantCount: relevant.length, holderCount: byAssignee.size, topHolders }
  }, [patents, families])

  // Nothing relevant means nothing to say. An empty framing panel above an
  // empty result is the "structural hole" pattern this programme removes.
  if (summary.relevantCount === 0) return null

  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Scale size={16} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">
          What this means for your migration
        </h2>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">{summary.relevantCount}</span> of the
        patents below touch {families.join(', ')} — the algorithms your own path uses — and they are
        held by <span className="font-semibold text-foreground">{summary.holderCount}</span>{' '}
        organisations.
      </p>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">What this does not tell you:</span> whether
        any of it is enforceable against you. We record assignees and claims; we do not record
        licensing terms, patent-pledge commitments, or any history of assertion, and we are not in a
        position to say whether you owe anyone anything. Treat the list below as who to ask, and put
        the question to your own counsel.
      </p>

      {summary.topHolders.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Who holds the most in your area
          </p>
          <ul className="space-y-1">
            {summary.topHolders.map(([assignee, count]) => (
              <li key={assignee} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-medium text-foreground">{assignee}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {count} patent{count === 1 ? '' : 's'}
                </span>
                {/* The review's "cross-link to the vendors in the migration
                    catalog": if this holder also supplies something you run,
                    that is a single conversation, not two. */}
                <Link
                  to={`/migrate?q=${encodeURIComponent(assignee)}`}
                  className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                >
                  do they supply you?
                  <ArrowRight size={11} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

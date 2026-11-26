// SPDX-License-Identifier: AGPL-3.0-only
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
 * The second half counts the patents that name the three NIST-standardised
 * algorithms (ML-KEM, ML-DSA, SLH-DSA, or their filing-era names) — the same
 * set for every role (owner decision 2026-11-14).
 */
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Scale, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PatentItem } from '@/types/PatentTypes'
import { expandAlgorithmAliases } from '@/data/algorithmNameAliases'
import { vendorIdForPatentHolder } from '@/data/patentHolderVendor'

/** The three NIST-standardised algorithms every migration depends on. */
const STANDARDISED = ['ML-KEM', 'ML-DSA', 'SLH-DSA']

/**
 * The algorithm families the panel counts. One set for every role (owner
 * decision 2026-11-14): the per-role "highlight" lists exist for only two
 * roles and both hold these three, so a per-role framing promised a
 * difference the page never made.
 */
export function relevantAlgorithmFamilies(): string[] {
  return [...STANDARDISED]
}

/** Lower-case a catalogue algorithm name and drop the "CRYSTALS-" prefix some filings use. */
function normalizeAlgorithmName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^crystals[-\s]+/, '')
}

/**
 * True when one catalogue algorithm name belongs to a family. The family's filing-era
 * aliases come from the shared alias table (Kyber for ML-KEM, Dilithium for ML-DSA,
 * SPHINCS+ for SLH-DSA, Falcon for FN-DSA), so a patent filed before the FIPS names existed
 * still counts. The name must equal the family or continue it with a parameter ("-768",
 * "768", " Level 3"); a longer word that merely contains it does not count.
 */
export function algorithmNameMatchesFamily(algorithm: string, family: string): boolean {
  const name = normalizeAlgorithmName(algorithm)
  const accepted = [family, ...expandAlgorithmAliases([family])].map(normalizeAlgorithmName)
  return accepted.some((alias) => {
    if (!alias || !name.startsWith(alias)) return false
    const next = name.charAt(alias.length)
    return next === '' || next === '-' || next === ' ' || /\d/.test(next)
  })
}

/** True when any of the patent's PQC algorithms is in the given families. */
export function patentTouchesPersonaAlgorithms(patent: PatentItem, families: string[]): boolean {
  return (patent.pqcAlgorithms ?? []).some((algo: string) =>
    families.some((family) => algorithmNameMatchesFamily(algo, family))
  )
}

export function PatentsRoleLens({
  patents,
  onSelectAssignee,
}: {
  patents: PatentItem[]
  /** Filters the Explore list to this holder's patents. */
  onSelectAssignee?: (assignee: string) => void
}) {
  const families = useMemo(() => relevantAlgorithmFamilies(), [])
  // Filing-era names that are counted alongside the families, taken from the shared alias table.
  const filingEraNames = useMemo(() => expandAlgorithmAliases(families), [families])

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

  const vendorIds = useMemo(
    () => new Map(summary.topHolders.map(([a]) => [a, vendorIdForPatentHolder(a)])),
    [summary.topHolders]
  )

  // Nothing relevant means nothing to say. An empty framing panel above an
  // empty result is the "structural hole" pattern this programme removes.
  if (summary.relevantCount === 0) return null

  return (
    <section className="bg-card border-2 border-ink rounded-3xl shadow-[0_6px_0_hsl(var(--edge))] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Scale size={16} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold font-display text-heading">
          What this means for your migration
        </h2>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">{summary.relevantCount}</span> of the
        patents below name {families.join(', ')}
        {filingEraNames.length > 0 && <> (or the filing-era names {filingEraNames.join(', ')})</>} —
        the three NIST-standardised algorithms every migration depends on — and they are held by{' '}
        <span className="font-semibold text-foreground">{summary.holderCount}</span> organisations.
        This counts catalogue records only: a record that names just a general class such as
        &ldquo;lattice-based&rdquo;, or that lists no algorithm, is not counted, and the catalogue
        is not a complete search of patent offices, so read the figure as a lower bound for this
        catalogue.
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
          <p className="mb-1.5 uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
            Who holds the most of these
          </p>
          <ul className="space-y-1">
            {summary.topHolders.map(([assignee, count]) => (
              <li key={assignee} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                {onSelectAssignee ? (
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => onSelectAssignee(assignee)}
                    className="h-auto p-0 text-sm font-medium text-foreground hover:text-primary"
                    title={`Show only ${assignee}'s patents`}
                  >
                    {assignee}
                  </Button>
                ) : (
                  <span className="font-medium text-foreground">{assignee}</span>
                )}
                <span className="font-mono text-xs text-muted-foreground">
                  {count} patent{count === 1 ? '' : 's'}
                </span>
                {/* The review's "cross-link to the vendors in the migration
                    catalog": if this holder also supplies something you run,
                    that is a single conversation, not two. Shown only when
                    the holder IS a catalogue vendor — a bank or an inventor
                    gets no link rather than a "no vendor matching" page. */}
                {vendorIds.get(assignee) && (
                  <Link
                    to={`/migrate?tab=roadmaps&vendor=${encodeURIComponent(vendorIds.get(assignee)!)}`}
                    className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                  >
                    do they supply you?
                    <ArrowRight size={11} aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Who has already moved" — B+ remediation 4.6 (2026-08-10).
 *
 * The curious cells on /migrate were the worst on the page (C+/C+/C/A-), for a
 * plain reason: a first-time reader was handed an unfiltered vendor catalog
 * they had no basis to evaluate. Filtering it differently would not have
 * helped — the problem is not which rows, it is that a catalog is the wrong
 * OBJECT for that reader. The question a newcomer actually has is "is anyone
 * actually doing this, or is it all still talk".
 *
 * So this answers that question and links into the catalog rather than
 * replacing it. Everything is DERIVED from the live catalog at render time —
 * counts, categories and the named examples — so it cannot claim a level of
 * adoption the data does not show, and it moves when the catalog moves.
 *
 * The honesty constraint that shapes it: "moved" is read from the catalogue's
 * canonical PQC status, never from a free-text support string. A product counts
 * only when its status is "available" AND its evidence was reviewed and
 * confirmed it. Partial, planned or roadmap, and not-yet-determined products
 * are counted in their own buckets, because a non-empty support string or a
 * proof link on its own does not show that a product ships a post-quantum
 * capability. Even "available" is a catalogue status for the product, not a
 * statement about every operation, version or deployment, and the panel says so.
 */
import { useMemo } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { softwareData } from '@/data/migrateData'

export function WhoHasMovedPanel() {
  const summary = useMemo(() => {
    const statusOf = (p: (typeof softwareData)[number]) =>
      (p.pqcStatusCanonical || '').trim().toLowerCase()
    const available = softwareData.filter((p) => statusOf(p) === 'available')
    // "Moved" needs reviewed evidence behind an "available" status, not just a
    // proof link or a support string. A row whose evidence review is partial,
    // pending or withheld is "available" in the catalogue but not counted here.
    const proven = available.filter(
      (p) => p.verificationStatus === 'Verified' && p.proofUrl?.trim()
    )
    const partial = softwareData.filter((p) => statusOf(p) === 'partial').length
    const planned = softwareData.filter((p) => {
      const s = statusOf(p)
      return s === 'roadmap' || s === 'planned'
    }).length
    const none = softwareData.filter((p) => statusOf(p) === 'none').length
    const undetermined = softwareData.length - available.length - partial - planned - none

    const byCategory = new Map<string, number>()
    for (const p of proven) {
      const cat = p.categoryName?.trim()
      if (cat) byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1)
    }
    const topCategories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)

    // Named examples: the most recent evidence dates, so the page does not
    // show the same four vendors forever.
    const examples = [...proven]
      .sort((a, b) => (b.proofPublicationDate ?? '').localeCompare(a.proofPublicationDate ?? ''))
      .slice(0, 5)

    return {
      total: softwareData.length,
      available: available.length,
      proven: proven.length,
      partial,
      planned,
      undetermined,
      topCategories,
      examples,
    }
  }, [])

  if (summary.proven === 0) return null

  return (
    <section className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <CheckCircle2 size={17} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-foreground">Who has already moved</h2>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Of the <span className="font-semibold text-foreground">{summary.total}</span> products we
        track, <span className="font-semibold text-foreground">{summary.proven}</span> are recorded
        as having post-quantum support available, with reviewed evidence behind that status.{' '}
        {summary.partial} more have partial support, {summary.planned} are planned or on a roadmap,
        and {summary.undetermined} are not yet determined; these are counted separately and not as
        moved.
        {summary.available > summary.proven
          ? ` Another ${summary.available - summary.proven} are marked available but their evidence review is not finished, so they are not counted here.`
          : ''}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        “Available” is a status for the product as catalogued. It does not say which operations,
        protocol profiles or versions are covered, or that anyone has deployed it. Open a product to
        see what its own evidence covers.
      </p>

      {summary.topCategories.length > 0 && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Largest catalogue categories among them:{' '}
          {summary.topCategories.map(([cat, n], i) => (
            <span key={cat}>
              {i > 0 ? ', ' : ''}
              <span className="text-foreground">{cat}</span> ({n})
            </span>
          ))}
          .
        </p>
      )}

      {summary.examples.length > 0 && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Products with the most recently dated evidence:{' '}
          {summary.examples.map((p, i) => (
            <span key={p.softwareName}>
              {i > 0 ? ', ' : ''}
              <span className="text-foreground">{p.softwareName}</span>
            </span>
          ))}
          .
        </p>
      )}

      <p className="mt-3 text-sm">
        <Link to="/migrate" className="inline-flex items-center gap-1 text-primary hover:underline">
          Look up something you use
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </p>
    </section>
  )
}

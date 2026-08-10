// SPDX-License-Identifier: GPL-3.0-only
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
 * The honesty constraint that shapes it: only products whose post-quantum
 * support is backed by a PROOF DOCUMENT are counted as "moved". A vendor's own
 * claim is a claim. Saying "N products have shipped it" on the strength of
 * marketing copy would be the exact failure the proof-gating exists to prevent,
 * and this reader is the least equipped to catch it.
 */
import { useMemo } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { softwareData } from '@/data/migrateData'

export function WhoHasMovedPanel() {
  const summary = useMemo(() => {
    const claimsPqc = softwareData.filter(
      (p) => p.pqcSupport && !/^(no|none|planned|roadmap)/i.test(p.pqcSupport.trim())
    )
    // "Moved" means we hold a document, not that a vendor said so.
    const proven = claimsPqc.filter((p) => p.proofUrl?.trim())

    const byCategory = new Map<string, number>()
    for (const p of proven) {
      const cat = p.categoryName?.trim()
      if (cat) byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1)
    }
    const topCategories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)

    // Named examples: the most recently proven, so the page shows movement
    // rather than the same four vendors forever.
    const examples = [...proven]
      .sort((a, b) => (b.proofPublicationDate ?? '').localeCompare(a.proofPublicationDate ?? ''))
      .slice(0, 5)

    return {
      total: softwareData.length,
      claims: claimsPqc.length,
      proven: proven.length,
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

      {/* Two sentences, because the honest one depends on the data. As of the
          08-09 catalog every product claiming support also carries a proof
          document, so the "the rest is the vendor's word" phrasing would be
          describing a gap that does not exist — and inventing a caveat is as
          much a misstatement as omitting one. If unproven claims reappear, the
          second branch says so without anyone editing this file. */}
      {summary.claims === summary.proven ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Of the <span className="font-semibold text-foreground">{summary.total}</span> products we
          track, <span className="font-semibold text-foreground">{summary.proven}</span> support
          post-quantum cryptography today — and for every one of them we hold the document that
          shows it, not just the vendor’s word.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Of the <span className="font-semibold text-foreground">{summary.total}</span> products we
          track, <span className="font-semibold text-foreground">{summary.claims}</span> say they
          support post-quantum cryptography — and for{' '}
          <span className="font-semibold text-foreground">{summary.proven}</span> of those we hold a
          document that shows it. The other {summary.claims - summary.proven} rest on the vendor’s
          word, which we record but do not count here.
        </p>
      )}

      {summary.topCategories.length > 0 && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          It has landed first where you would expect:{' '}
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
          Most recently proven:{' '}
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

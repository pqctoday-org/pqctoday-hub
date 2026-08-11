// SPDX-License-Identifier: GPL-3.0-only
/**
 * Two lenses on the same catalog — B+ remediation 4.6 (2026-08-10).
 *
 * The review's finding for both roles was that /migrate answers a question
 * neither of them asked. An executive gets an infrastructure-layer view when
 * their question is "have my suppliers committed"; a researcher gets a product
 * list when what they want is a corpus of claims and the evidence behind them.
 *
 * Both are rendered from the SAME data the catalog already holds — vendor
 * roadmaps (`vendorRoadmapData`) and per-product proof (`proofFreshness`) — so
 * neither lens can assert something the rows themselves do not support. That
 * matters most for the executive one: "vendor X has committed" is a sentence
 * someone will repeat in a meeting, so it is said only where we hold a
 * published roadmap, and the count of vendors where we hold nothing is stated
 * just as plainly.
 */
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Handshake, FileSearch } from 'lucide-react'
import { softwareData, vendorMap } from '@/data/migrateData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { proofFreshness } from './proofFreshness'

/** Executive: who among your suppliers has actually said something in public. */
export function VendorCommitmentPanel() {
  const summary = useMemo(() => {
    const vendors = new Map<string, { id: string; name: string; products: number }>()
    for (const p of softwareData) {
      if (!p.vendorId) continue
      const existing = vendors.get(p.vendorId)
      if (existing) existing.products += 1
      else {
        // Display name from the vendor registry, falling back to the id — a
        // panel an executive quotes should not be showing internal slugs.
        const vendor = vendorMap.get(p.vendorId)
        vendors.set(p.vendorId, {
          id: p.vendorId,
          name: vendor?.vendorDisplayName || vendor?.vendorName || p.vendorId,
          products: 1,
        })
      }
    }
    const all = [...vendors.values()]
    const committed = all.filter((v) => roadmapByVendorId.has(v.id))
    const silent = all.filter((v) => !roadmapByVendorId.has(v.id))
    return {
      total: all.length,
      committed: committed.sort((a, b) => b.products - a.products).slice(0, 8),
      committedCount: committed.length,
      silentCount: silent.length,
    }
  }, [])

  if (summary.total === 0) return null

  return (
    <section className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Handshake size={17} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-foreground">
          Which of your suppliers have committed
        </h2>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Of the <span className="font-semibold text-foreground">{summary.total}</span> vendors in
        this catalog,{' '}
        <span className="font-semibold text-foreground">{summary.committedCount}</span> have
        published a post-quantum roadmap we hold a copy of. For the other{' '}
        <span className="font-semibold text-foreground">{summary.silentCount}</span> we have found
        nothing public — which is not the same as knowing they have no plan, and is the list worth
        taking to your account manager.
      </p>

      {summary.committed.length > 0 && (
        <ul className="mt-3 space-y-1">
          {summary.committed.map((v) => {
            const roadmap = roadmapByVendorId.get(v.id)
            return (
              <li key={v.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-medium text-foreground">{v.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {v.products} product{v.products === 1 ? '' : 's'} you may run
                </span>
                {roadmap?.roadmapUrl && (
                  <a
                    href={roadmap.roadmapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    read their commitment
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        A published roadmap is a statement of intent, not a shipped product. The row-level proof
        dates below tell you which of those intentions has actually landed.
      </p>
    </section>
  )
}

/** Researcher: the catalog as a corpus of claims, scored by what backs them. */
export function ClaimsAndEvidencePanel() {
  const summary = useMemo(() => {
    let dated = 0
    let undated = 0
    let vendorWord = 0
    let stale = 0
    for (const p of softwareData) {
      const f = proofFreshness(p)
      if (f.vendorClaimOnly) vendorWord += 1
      else if (f.ageMonths === null) undated += 1
      else {
        dated += 1
        if (f.tone === 'warning') stale += 1
      }
    }
    return { total: softwareData.length, dated, undated, vendorWord, stale }
  }, [])

  return (
    <section className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-2 flex items-center gap-2">
        <FileSearch size={17} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-foreground">This catalog as a corpus of claims</h2>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Every row is a vendor claim plus whatever we hold behind it. Across{' '}
        <span className="font-semibold text-foreground">{summary.total}</span> products:
      </p>

      <dl className="mt-2 space-y-1 text-sm">
        <div>
          <dt className="inline font-medium text-foreground">
            {summary.dated} backed by a dated document
          </dt>
          <dd className="inline text-muted-foreground">
            {' '}
            — of which <span className="text-foreground">{summary.stale}</span> are old enough that
            the product may have moved on since.
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">
            {summary.undated} backed by an undated document
          </dt>
          <dd className="inline text-muted-foreground">
            {' '}
            — we hold the proof but not its publication date, so currency is unknown.
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">
            {summary.vendorWord} on the vendor’s word alone
          </dt>
          <dd className="inline text-muted-foreground">
            {' '}
            — recorded, and deliberately not counted as evidence.
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        The counts are computed from the rows at render time, not stored, so they cannot drift from
        what the table below shows.{' '}
        <Link to="/about#about-trust-engine" className="text-primary hover:underline">
          How the trust scoring works
        </Link>
        .
      </p>
    </section>
  )
}

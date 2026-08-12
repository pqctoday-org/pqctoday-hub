// SPDX-License-Identifier: GPL-3.0-only
/**
 * Products — "which of the things I run are certified, and under which scheme?"
 *
 * Assembles a chain that already exists in the repo but has never been shown
 * in one place: the product catalogue, the certification cross-reference, and
 * the CMVP / ACVP / Common Criteria certificate behind each link.
 *
 * Inventory comes from `useMigrateSelectionStore.myProducts` — the list
 * /migrate already maintains. This page does not mint a second one.
 */
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { certsByProduct } from '@/data/certificationXrefData'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import type { CertificationXref } from '@/types/MigrateTypes'
import {
  buildProductRows,
  isPqcCertificate,
  summarizeCoverage,
  type Coverage,
  type ProductCertification,
} from './productsModel'

const COVERAGE_LABEL: Record<Coverage, string> = {
  pqc: 'PQC validated',
  mixed: 'Mixed coverage',
  classical: 'Classical only',
  none: 'No certificates',
}

const COVERAGE_TONE: Record<Coverage, string> = {
  pqc: 'text-status-success',
  mixed: 'text-status-warning',
  classical: 'text-status-error',
  none: 'text-muted-foreground',
}

export function ProductsTab() {
  const myProducts = useMigrateSelectionStore((s) => s.myProducts)
  const [showAll, setShowAll] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [pqcOnly, setPqcOnly] = useState(false)

  const owned = useMemo(() => new Set(myProducts), [myProducts])
  const hasInventory = owned.size > 0

  const rows = useMemo(
    () => buildProductRows(certsByProduct, showAll || !hasInventory ? undefined : owned),
    [showAll, hasInventory, owned]
  )
  const visible = useMemo(
    () => (pqcOnly ? rows.filter((r) => r.coverage === 'pqc' || r.coverage === 'mixed') : rows),
    [rows, pqcOnly]
  )
  const totals = useMemo(() => summarizeCoverage(rows), [rows])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Inventory
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAll((v) => !v)}
            className="h-auto rounded-full border border-border px-2.5 py-1 text-[11.5px] font-semibold"
          >
            {hasInventory && !showAll ? `My products (${owned.size})` : 'All catalogue products'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-pressed={pqcOnly}
            onClick={() => setPqcOnly((v) => !v)}
            className={`h-auto rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
              pqcOnly ? 'border-primary/45 bg-primary/5 text-primary' : 'border-border'
            }`}
          >
            PQC-validated only
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{totals.products}</span> product
          {totals.products === 1 ? '' : 's'} with{' '}
          <span className="font-semibold text-foreground">{totals.certificates}</span> certificate
          {totals.certificates === 1 ? '' : 's'} — {totals.byCoverage.pqc} PQC validated,{' '}
          {totals.byCoverage.mixed} mixed, {totals.byCoverage.classical} classical only.
        </p>

        {!hasInventory && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            You haven&apos;t marked anything as yours yet, so this shows the whole catalogue. Pick
            your products on{' '}
            <a href="/migrate" className="text-primary hover:underline">
              Migrate
            </a>{' '}
            and this narrows to them.
          </p>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <PackageSearch size={24} className="mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold text-foreground">Nothing matches</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pqcOnly
              ? 'None of these products holds a certificate naming a PQC algorithm.'
              : 'No certification records for this selection.'}
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
          {visible.map((row) => (
            <ProductRow
              key={row.productId + row.softwareName}
              row={row}
              open={!!expanded[row.productId + row.softwareName]}
              onToggle={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [row.productId + row.softwareName]: !prev[row.productId + row.softwareName],
                }))
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ProductRow({
  row,
  open,
  onToggle,
}: {
  row: ProductCertification
  open: boolean
  onToggle: () => void
}) {
  return (
    <li>
      {/* The caret owns expand/collapse — the row is not a second button, which
          is the nested-interactive pattern FrameworkCard was refactored away
          from (see ComplianceLandscape.tsx:476). */}
      <Button
        type="button"
        variant="ghost"
        aria-expanded={open}
        onClick={onToggle}
        className="h-auto w-full justify-start gap-2 rounded-none px-4 py-3 text-left"
      >
        {open ? (
          <ChevronDown size={15} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight size={15} className="shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-foreground">
            {row.softwareName}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-normal text-muted-foreground">
            {row.schemes.map((s) => (
              <span key={s.scheme} className="rounded bg-muted px-1.5 py-0.5">
                {s.scheme}
                {s.count > 1 ? ` ×${s.count}` : ''}
              </span>
            ))}
          </span>
        </span>
        <span className={`shrink-0 text-[11.5px] font-semibold ${COVERAGE_TONE[row.coverage]}`}>
          {row.coverage === 'mixed'
            ? `${row.pqcCount} PQC · ${row.classicalCount} classical`
            : COVERAGE_LABEL[row.coverage]}
        </span>
      </Button>

      {open && (
        <ul className="border-t border-border bg-muted/20">
          {row.certificates.map((cert) => (
            <CertificateRow key={cert.certId} cert={cert} />
          ))}
        </ul>
      )}
    </li>
  )
}

function CertificateRow({ cert }: { cert: CertificationXref }) {
  const pqc = isPqcCertificate(cert)
  return (
    <li
      className={`border-l-[3px] px-4 py-2.5 ${
        pqc ? 'border-status-success' : 'border-status-error'
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[11.5px] font-semibold text-foreground">{cert.certType}</span>
        <span className="font-mono text-[10.5px] text-muted-foreground">{cert.certId}</span>
        {cert.certLink && (
          <a
            href={cert.certLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[10.5px] text-primary hover:underline"
          >
            Record <ExternalLink size={9} />
          </a>
        )}
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {cert.certProduct}
        {cert.certVendor ? ` · ${cert.certVendor}` : ''}
        {cert.certDate ? ` · ${cert.certDate}` : ''}
      </p>
      <p
        className={`mt-0.5 text-[10.5px] font-medium ${
          pqc ? 'text-status-success' : 'text-muted-foreground'
        }`}
      >
        {pqc ? cert.pqcAlgorithms : 'No PQC mechanisms detected'}
      </p>
    </li>
  )
}

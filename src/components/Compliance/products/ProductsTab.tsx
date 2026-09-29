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
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { deepLinkSelector, useScrollToDeepLinkTarget } from '@/hooks/useScrollToDeepLinkTarget'
import { certsByProduct } from '@/data/certificationXrefData'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import type { CertificationXref } from '@/types/MigrateTypes'
import { recordTypeLabel } from '../recordSemantics'
import {
  buildProductRows,
  isPqcCertificate,
  productKey,
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

interface ProductsTabProps {
  /**
   * `?prod=<productId>` (ADDED 2026-09-29, deep-link PR 2): the product row a
   * link expands. Expanding a row pushes it (`onOpenProduct`); collapsing
   * that row replaces it away (`onCloseProduct`).
   */
  openProductId?: string | null
  onOpenProduct?: (id: string) => void
  onCloseProduct?: () => void
}

export function ProductsTab({
  openProductId = null,
  onOpenProduct,
  onCloseProduct,
}: ProductsTabProps = {}) {
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

  // ── `?prod=` ──────────────────────────────────────────────────────────
  // Every catalogue row, unfiltered — to tell "hidden by the inventory or
  // PQC-only view" (widen it) from "no such product" (say so).
  const allRows = useMemo(() => buildProductRows(certsByProduct), [])
  const [notice, setNotice] = useState<
    | { kind: 'widened'; message: string; before: { showAll: boolean; pqcOnly: boolean } }
    | { kind: 'not-found'; message: string }
    | null
  >(null)
  // The row the reader expanded by hand is already on screen — no scroll.
  const [selfOpened, setSelfOpened] = useState<string | null>(null)
  const [scrollTarget, setScrollTarget] = useState<string | null>(null)
  // React to each NEW param value during render (the same pattern
  // useComplianceUrlState uses for `?framework=`), so a second link on the
  // mounted route is honoured too.
  const [lastProd, setLastProd] = useState<string | null>(null)
  if (openProductId !== lastProd) {
    setLastProd(openProductId)
    // Back / Forward (not a click on this page) moved off a row: collapse it,
    // so Back closes what the link or the click opened.
    if (lastProd && (!openProductId || openProductId !== selfOpened)) {
      setExpanded((prev) => ({ ...prev, [lastProd]: false }))
    }
    if (openProductId) {
      const target = allRows.find((r) => productKey(r) === openProductId)
      if (!target) {
        setNotice({
          kind: 'not-found',
          message: `No product with the ID “${openProductId}” has certification records here — it may have been renamed or removed from the catalogue.`,
        })
      } else {
        setExpanded((prev) => ({ ...prev, [openProductId]: true }))
        const hiddenByInventory = !rows.some((r) => productKey(r) === openProductId)
        const hiddenByPqc = pqcOnly && target.coverage !== 'pqc' && target.coverage !== 'mixed'
        if (hiddenByInventory || hiddenByPqc) {
          const why = [
            hiddenByInventory ? 'your inventory view' : null,
            hiddenByPqc ? 'the PQC-validated-only filter' : null,
          ]
            .filter(Boolean)
            .join(' and ')
          setNotice({
            kind: 'widened',
            message: `Showing ${target.softwareName} — it was hidden by ${why}, so that was relaxed to show it.`,
            before: { showAll, pqcOnly },
          })
          if (hiddenByInventory) setShowAll(true)
          if (hiddenByPqc) setPqcOnly(false)
        } else {
          setNotice(null)
        }
        if (openProductId !== selfOpened) setScrollTarget(openProductId)
      }
    }
  }
  useScrollToDeepLinkTarget(scrollTarget, scrollTarget ? deepLinkSelector(scrollTarget) : null)

  const toggleRow = (key: string, wasOpen: boolean) => {
    const open = !wasOpen
    setExpanded((prev) => ({ ...prev, [key]: open }))
    if (open) {
      setSelfOpened(key)
      onOpenProduct?.(key)
    } else if (key === openProductId) {
      onCloseProduct?.()
    }
  }

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

      {notice && (
        <DeepLinkNotice
          kind={notice.kind}
          message={notice.message}
          onUndo={
            notice.kind === 'widened'
              ? () => {
                  setShowAll(notice.before.showAll)
                  setPqcOnly(notice.before.pqcOnly)
                  setNotice(null)
                }
              : undefined
          }
          onDismiss={() => {
            if (notice.kind === 'not-found') onCloseProduct?.()
            setNotice(null)
          }}
        />
      )}

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
              key={productKey(row)}
              row={row}
              open={!!expanded[productKey(row)]}
              onToggle={() => toggleRow(productKey(row), !!expanded[productKey(row)])}
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
    <li data-deeplink-id={productKey(row)}>
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
                {recordTypeLabel(s.scheme)}
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
        <span className="text-[11.5px] font-semibold text-foreground">
          {recordTypeLabel(cert.certType)}
        </span>
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
        {pqc ? cert.pqcAlgorithms : 'Classical only — no PQC mechanisms detected'}
      </p>
    </li>
  )
}

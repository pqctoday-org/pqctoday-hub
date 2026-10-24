// SPDX-License-Identifier: AGPL-3.0-only
import { ArrowUpDown, ExternalLink, Info } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../ui/button'
import type { ComplianceRecord } from './types'
import { recordTypeDescription, statusBadgeClass } from './recordSemantics'

/**
 * The Entropy (ESV) tab of the Product Records: NIST CMVP entropy source
 * validations. Its columns are the ones an entropy certificate has — certificate
 * number, entropy source, vendor, status, validation date and the NIST page — not
 * the PQC and classical-algorithm columns of the module and algorithm tabs, which
 * say nothing about a noise source.
 */

export type EsvSortColumn = 'id' | 'productName' | 'vendor' | 'date'

/** "Non-Physical · Open for Reuse": NIST's own words for the noise source and its reuse status. */
function sourceFacts(record: ComplianceRecord): string {
  return [record.esvNoiseSourceClassification, record.esvReuseStatus].filter(Boolean).join(' · ')
}

/** The date of the first validation, when it differs from the latest one shown. */
function firstValidatedNote(record: ComplianceRecord): string | null {
  return record.esvFirstValidated && record.esvFirstValidated !== record.date
    ? `first validated ${record.esvFirstValidated}`
    : null
}

const NistLink = ({ record }: { record: ComplianceRecord }) => (
  <a
    href={record.link}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    aria-label={`NIST certificate page for ${record.id}`}
  >
    NIST
    <ExternalLink size={11} className="shrink-0 opacity-70" aria-hidden="true" />
  </a>
)

export const EsvRow = ({
  record,
  onOpenDetails,
  usedByCount = 0,
}: {
  record: ComplianceRecord
  onOpenDetails: (record: ComplianceRecord) => void
  /** FIPS 140-3 modules whose Security Policy names this certificate. */
  usedByCount?: number
}) => {
  const facts = sourceFacts(record)
  const first = firstValidatedNote(record)
  return (
    <tr
      data-deeplink-id={record.id}
      data-testid="esv-row"
      className="border-b border-border hover:bg-muted/50 transition-colors"
    >
      <td className="px-4 py-3 w-28">
        <div className="font-mono text-sm text-foreground">{record.id}</div>
        {record.esvStandard && (
          <div className="text-[10px] text-muted-foreground">{record.esvStandard}</div>
        )}
      </td>
      <td className="px-4 py-3 font-medium text-foreground whitespace-normal break-words">
        <div className="line-clamp-2" title={record.productName}>
          {record.productName}
        </div>
        {facts && <div className="text-xs font-normal text-muted-foreground">{facts}</div>}
        {usedByCount > 0 && (
          <div className="text-xs font-normal text-muted-foreground">
            Relied on by {usedByCount} FIPS 140-3 module{usedByCount === 1 ? '' : 's'}
          </div>
        )}
      </td>
      <td className="px-4 py-3 w-56">
        <div className="line-clamp-2" title={record.vendor}>
          {record.vendor}
        </div>
      </td>
      <td className="px-4 py-3 w-28">
        <span
          className={clsx(
            'inline-flex items-center rounded border px-1 text-[9px] font-semibold uppercase tracking-wider',
            statusBadgeClass(record.status)
          )}
        >
          {record.status || 'No status'}
        </span>
      </td>
      <td className="px-4 py-3 w-36 whitespace-nowrap">
        <div className="font-mono text-xs text-muted-foreground">{record.date}</div>
        {first && <div className="text-[10px] text-muted-foreground">{first}</div>}
      </td>
      <td className="px-4 py-3 w-20">
        <NistLink record={record} />
      </td>
      <td className="px-4 py-3 w-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenDetails(record)}
          aria-label="View details"
        >
          <Info size={16} />
        </Button>
      </td>
    </tr>
  )
}

const SortHeader = ({
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
  className,
  title,
}: {
  column: EsvSortColumn
  label: string
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  onSort: (column: EsvSortColumn) => void
  className?: string
  title?: string
}) => (
  <th
    scope="col"
    className={clsx('px-4 py-3', className)}
    aria-sort={
      sortColumn === column ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
    }
  >
    <Button
      variant="ghost"
      className="flex items-center gap-1 text-xs font-medium"
      onClick={() => onSort(column)}
      title={title}
    >
      <span>{label}</span>
      <ArrowUpDown
        size={12}
        className={clsx(sortColumn === column ? 'text-primary' : 'opacity-30')}
      />
    </Button>
  </th>
)

export const EsvTable = ({
  rows,
  virtualRows,
  paddingTop,
  paddingBottom,
  sortColumn,
  sortDirection,
  onSort,
  onOpenDetails,
  usedBy,
}: {
  rows: readonly ComplianceRecord[]
  virtualRows: ReadonlyArray<{ index: number }>
  paddingTop: number
  paddingBottom: number
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  onSort: (column: EsvSortColumn) => void
  onOpenDetails: (record: ComplianceRecord) => void
  /** ESV id -> FIPS 140-3 modules naming it (EntropyIndex.usedBy). */
  usedBy?: ReadonlyMap<string, readonly ComplianceRecord[]>
}) => (
  <table className="max-md:hidden w-full text-sm text-left table-fixed" data-testid="esv-table">
    <caption className="sr-only">
      NIST entropy source validation certificates: certificate number, entropy source, vendor,
      status and validation date
    </caption>
    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground sticky top-0 z-10">
      <tr>
        <SortHeader
          column="id"
          label="Certificate"
          className="w-28"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <SortHeader
          column="productName"
          label="Entropy source"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <SortHeader
          column="vendor"
          label="Vendor"
          className="w-56"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <th scope="col" className="px-4 py-3 w-28">
          <span className="text-xs font-medium">Status</span>
        </th>
        <SortHeader
          column="date"
          label="Validated"
          className="w-36"
          title="Date of the most recent validation on the certificate"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <th scope="col" className="px-4 py-3 w-20">
          <span className="text-xs font-medium">NIST page</span>
        </th>
        <th scope="col" className="px-4 py-3 w-12">
          <span className="sr-only">Details</span>
        </th>
      </tr>
    </thead>
    <tbody>
      {paddingTop > 0 && (
        <tr>
          <td style={{ height: `${paddingTop}px` }} colSpan={7} />
        </tr>
      )}
      {virtualRows.map((v) => {
        const record = rows[v.index]
        return (
          <EsvRow
            key={record.id}
            record={record}
            onOpenDetails={onOpenDetails}
            usedByCount={usedBy?.get(record.id)?.length ?? 0}
          />
        )
      })}
      {paddingBottom > 0 && (
        <tr>
          <td style={{ height: `${paddingBottom}px` }} colSpan={7} />
        </tr>
      )}
      {rows.length === 0 && (
        <tr>
          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
            No entropy source validations match your filters.
          </td>
        </tr>
      )}
    </tbody>
  </table>
)

/** A small-screen card for one entropy certificate (the responsive table below 768px). */
export const EsvCard = ({
  record,
  onOpen,
}: {
  record: ComplianceRecord
  onOpen: (record: ComplianceRecord) => void
}) => {
  const facts = sourceFacts(record)
  return (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-foreground">{record.id}</span>
          <span className="text-xs text-muted-foreground" title={recordTypeDescription('ESV')}>
            {record.esvStandard ?? 'SP 800-90B'}
          </span>
          <span
            className={clsx(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border',
              statusBadgeClass(record.status)
            )}
          >
            {record.status || 'No status'}
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground leading-snug mb-1 line-clamp-2">
        {record.productName}
      </p>
      <div className="text-xs text-muted-foreground truncate mb-1">{record.vendor}</div>
      {facts && <div className="text-xs text-muted-foreground mb-2">{facts}</div>}
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase opacity-70">Validated</span>
          <span className="text-xs font-mono text-muted-foreground/80">{record.date}</span>
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <NistLink record={record} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(record)
          }}
          aria-label="View details"
        >
          <Info size={16} />
        </Button>
      </div>
    </>
  )
}
